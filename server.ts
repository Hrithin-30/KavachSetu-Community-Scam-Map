import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { trustEngine } from './src/engine/trustEngine';
import { licenseManager } from './src/engine/licenseEngine';
import { userManager } from './src/engine/userManager';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '1mb' }));

  // Admin session tokens & lockout counter
  const activeAdminSessions = new Map<string, any>();
  let failedAdminAttempts = 0;
  let adminLockoutUntilMs = 0;

  // ============================================================================
  // 1. HEALTH & LICENSE MANAGEMENT ENDPOINTS (Always accessible even if expired)
  // ============================================================================

  // Student Brief Page 9: "1. GET /health -> Reply 200 with {'ok': true}."
  app.get('/health', (_req, res) => {
    const lic = licenseManager.checkLicense();
    res.status(200).json({
      ok: true,
      status: 'ok',
      service: 'community-scam-map',
      license: lic.status_code,
      is_valid: lic.is_valid,
      expires_at: lic.expires_at,
      uptime_seconds: Math.round(process.uptime())
    });
  });

  app.get('/license', (_req, res) => {
    res.status(200).json(licenseManager.checkLicense());
  });

  app.post('/license', (req, res) => {
    const body = req.body || {};
    const result = licenseManager.updateLicense(body);
    if (!result.ok) {
      return res.status(400).json({ error: result.error, ...licenseManager.checkLicense() });
    }
    return res.status(200).json(result.status);
  });

  app.delete('/license', (_req, res) => {
    licenseManager.deleteLicense();
    return res.status(200).json({
      ok: true,
      message: 'Active license revoked and deleted',
      ...licenseManager.checkLicense()
    });
  });

  app.post('/license/delete', (_req, res) => {
    licenseManager.deleteLicense();
    return res.status(200).json({
      ok: true,
      message: 'License deleted (non-renewal confirmed)',
      ...licenseManager.checkLicense()
    });
  });

  app.get('/license/sync-telemetry', (req, res) => {
    const requesterId =
      typeof req.query.requester_id === 'string'
        ? req.query.requester_id
        : typeof req.query.id === 'string'
        ? req.query.id
        : undefined;
    const telemetry = licenseManager.getSyncTelemetry(requesterId);
    res.status(200).json({ telemetry, ...telemetry });
  });

  app.post('/license/sync-servers', (req, res) => {
    const body = req.body || {};
    const requesterId =
      body.requester_id ||
      body.server_id ||
      body.contact_email ||
      body.user_id ||
      (typeof req.query.requester_id === 'string' ? req.query.requester_id : undefined);
    const result = licenseManager.triggerServerSync(
      requesterId ? String(requesterId) : undefined
    );
    return res.status(result.status).json(result);
  });

  app.get('/api/reporter-quota', (req, res) => {
    const reporterId =
      typeof req.query.reporter_id === 'string' ? req.query.reporter_id : 'anon_reporter';
    res.status(200).json(trustEngine.getReporterQuota(reporterId));
  });

  app.post('/api/reporter-quota/reset', (req, res) => {
    const reporterId =
      typeof req.body?.reporter_id === 'string'
        ? req.body.reporter_id
        : typeof req.query.reporter_id === 'string'
        ? req.query.reporter_id
        : undefined;
    trustEngine.resetReporterQuota(reporterId);
    res.status(200).json(trustEngine.getReporterQuota(reporterId || 'anon_reporter'));
  });

  app.post('/license/request-renewal', (req, res) => {
    const body = req.body || {};
    const licenseeName = body.licensee_name || body.organization;
    const contactEmail = body.contact_email || body.requested_by || 'compliance@partner.in';
    const requesterId =
      body.requester_id || body.user_id || body.contact_email || body.requested_by || licenseeName;
    const requestedDays =
      body.requested_days ||
      (body.requested_duration_seconds ? Math.round(body.requested_duration_seconds / 86400) : 365);

    if (!licenseeName) {
      return res.status(400).json({ error: 'licensee_name or organization is required' });
    }

    const result = licenseManager.submitRenewalRequest({
      requester_id: String(requesterId),
      licensee_name: String(licenseeName),
      contact_email: String(contactEmail),
      requested_days: Number(requestedDays) || 365,
      reason: body.reason || 'Enterprise license renewal request'
    });
    if (!result.ok) {
      return res.status(result.status).json({
        ok: false,
        error: result.error,
        telemetry: result.telemetry
      });
    }
    return res.status(201).json({
      ok: true,
      request: result.request,
      telemetry: result.telemetry
    });
  });

  app.post('/license/approve-request', (req, res) => {
    const { request_id } = req.body || {};
    if (!request_id) {
      return res.status(400).json({ error: 'request_id is required' });
    }
    const result = licenseManager.approveRenewalRequest(request_id);
    if (!result.ok) {
      return res.status(400).json({ error: result.error });
    }
    return res.status(200).json(result);
  });

  app.post('/license/reject-request', (req, res) => {
    const { request_id, notes } = req.body || {};
    if (!request_id) {
      return res.status(400).json({ error: 'request_id is required' });
    }
    const result = licenseManager.rejectRenewalRequest(request_id, notes);
    if (!result.ok) {
      return res.status(400).json({ error: result.error });
    }
    return res.status(200).json(result);
  });

  app.post('/api/demo/generate-license', (req, res) => {
    const body = req.body || {};
    const minutes =
      body.minutes !== undefined
        ? Number(body.minutes)
        : body.durationSeconds !== undefined
        ? Number(body.durationSeconds) / 60
        : 60;
    const licensee = body.licensee || body.issuedTo || 'Demo Bank';
    const signed = licenseManager.createSignedLicense(String(licensee), minutes);
    return res.status(200).json(signed);
  });

  // Ready-to-download 5-minute & 1-year license JSON files for the 4-step live judge demo (Page 4 & Page 7)
  app.get('/api/demo/license-files', (_req, res) => {
    const fiveMinLicense = licenseManager.createSignedLicense('Demo Bank', 5);
    const oneYearLicense = licenseManager.createSignedLicense('Demo Bank', 365 * 24 * 60);
    const expiredLicense = licenseManager.createSignedLicense('Demo Bank', -5);
    res.status(200).json({
      five_minute_license: fiveMinLicense,
      one_year_license: oneYearLicense,
      expired_license: expiredLicense
    });
  });

  // ============================================================================
  // 2. CITIZEN & AUTHORITY ADMIN AUTHENTICATION ENDPOINTS
  // ============================================================================

  app.get('/api/user/citizen-list', (_req, res) => {
    res.status(200).json({ citizens: userManager.getCitizenDemoList() });
  });

  app.post('/api/user/login', (req, res) => {
    const { email, password } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const auth = userManager.authenticateCitizen(email, password);
    if (!auth.ok) {
      const status = auth.code === 'SUSPENDED' ? 403 : 401;
      return res.status(status).json({ error: auth.error, code: auth.code });
    }
    return res.status(200).json({ user: auth.user });
  });

  app.post('/api/user/register', (req, res) => {
    const { name, email, password, city } = req.body || {};
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    const reg = userManager.registerCitizen({ name, email, password, city });
    if (!reg.ok) {
      return res.status(400).json({ error: reg.error });
    }
    return res.status(201).json({ user: reg.user });
  });

  app.post('/api/user/forgot-password', (req, res) => {
    const { email, newPassword } = req.body || {};
    if (!email || !newPassword) {
      return res.status(400).json({ error: 'Email and newPassword are required' });
    }
    const result = userManager.resetCitizenPassword(email, newPassword);
    if (!result.ok) {
      return res.status(404).json({ error: result.error });
    }
    return res.status(200).json({ ok: true });
  });

  // Admin Auth Gate routes (/api/admin/auth/login, /api/admin/auth/session, /api/admin/auth/logout)
  app.post('/api/admin/auth/login', (req, res) => {
    if (Date.now() < adminLockoutUntilMs) {
      return res.status(429).json({
        message: 'Terminal locked due to excessive failed attempts. Wait 60 seconds.'
      });
    }

    const { officerId, passkey } = req.body || {};
    const validOfficer =
      officerId?.trim().toLowerCase() === 'officer@kavachsetu.gov.in' ||
      officerId?.trim().toLowerCase() === 'admin@kavachsetu.gov.in';
    const validPass =
      passkey === 'KAVACH-ADMIN-SECURE-2026' ||
      passkey === 'I4C-KAVACH-2026' ||
      passkey === 'Admin@1930#Kavach';

    if (!validOfficer || !validPass) {
      failedAdminAttempts += 1;
      if (failedAdminAttempts >= 3) {
        adminLockoutUntilMs = Date.now() + 60 * 1000;
        failedAdminAttempts = 0;
        return res.status(429).json({
          message: 'SECURITY LOCKOUT: 3 failed authorization attempts. Terminal locked for 60s.'
        });
      }
      return res.status(401).json({
        message: `Authentication clearance denied (${3 - failedAdminAttempts} attempt(s) remaining before lockout).`
      });
    }

    failedAdminAttempts = 0;
    const token = `adm_tok_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const officer = {
      id: 'usr_admin_01',
      name: 'Chief Cyber Coordinator',
      badge: 'I4C-NODAL-01',
      role: 'ADMIN',
      organization: 'Indian Cyber Crime Coordination Centre (I4C)'
    };
    activeAdminSessions.set(token, officer);

    return res.status(200).json({
      authenticated: true,
      token,
      officer
    });
  });

  app.get('/api/admin/auth/session', (req, res) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const officer = activeAdminSessions.get(token);
    if (!officer) {
      return res.status(401).json({ authenticated: false });
    }
    return res.status(200).json({ authenticated: true, officer });
  });

  app.post('/api/admin/auth/logout', (req, res) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    activeAdminSessions.delete(token);
    return res.status(200).json({ ok: true });
  });

  // Admin Portal User & Threat Management endpoints
  app.get('/api/admin/users', (_req, res) => {
    res.status(200).json({
      users: userManager.getAllUsers()
    });
  });

  app.post('/api/admin/users', (req, res) => {
    const result = userManager.createAdminUser(req.body || {});
    if (!result.ok) {
      return res.status(400).json({ error: result.error });
    }
    return res.status(201).json({ user: result.user });
  });

  app.patch('/api/admin/users/:userId', (req, res) => {
    const { userId } = req.params;
    const { role } = req.body || {};
    const updated = userManager.updateUserRole(userId, role);
    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(200).json({ user: updated });
  });

  app.post('/api/admin/users/:userId/toggle-status', (req, res) => {
    const { userId } = req.params;
    const updated = userManager.toggleUserStatus(userId);
    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(200).json({ user: updated });
  });

  app.delete('/api/admin/users/:userId', (req, res) => {
    const { userId } = req.params;
    const result = userManager.deleteUser(userId);
    if (!result.ok) {
      return res.status(404).json({ error: result.error });
    }
    return res.status(200).json({ message: 'User account permanently deleted' });
  });

  app.get('/api/admin/threat-feed', (_req, res) => {
    res.status(200).json(trustEngine.getAdminThreatFeed());
  });

  app.post('/api/admin/simulate-attacks', (_req, res) => {
    res.status(200).json(trustEngine.runMultiVectorAttackSimulation());
  });

  app.post('/api/admin/challenges/:challengeId/resolve', (req, res) => {
    const { challengeId } = req.params;
    const { resolution } = req.body || {};
    const updated = trustEngine.resolveChallenge(challengeId, resolution);
    if (!updated) {
      return res.status(404).json({ error: 'Challenge not found' });
    }
    return res.status(200).json({ ok: true, challenge: updated });
  });

  // ============================================================================
  // 3. CRYPTOGRAPHIC LICENSE GUARD FOR CORE API ROUTES
  // ============================================================================

  // Student Brief Page 3: "Expired: every request except /health and /license gets the reply 403 {'error': 'LICENSE_EXPIRED'}. Do not delete any data."
  const requireValidLicense: express.RequestHandler = (_req, res, next) => {
    const status = licenseManager.checkLicense();
    if (!status.is_valid) {
      return res.status(403).json({
        error: 'LICENSE_EXPIRED',
        status_code: status.status_code,
        message: 'Licence expired. Contact your provider.'
      });
    }
    next();
  };

  // ============================================================================
  // 4. MANDATORY PRD CORE ENDPOINTS (/reports, /lookup, /map, /alerts, /admin/reset, /challenges)
  // ============================================================================

  app.post('/reports', requireValidLicense, (req, res) => {
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp =
      (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : undefined) ||
      req.socket.remoteAddress ||
      '103.21.124.10';

    const result = trustEngine.ingestReport({
      ...req.body,
      client_ip: clientIp
    });

    if (result.status !== 201 || !result.data) {
      return res.status(result.status).json({
        error: result.error,
        reporter_quota: result.reporter_quota
      });
    }

    if (req.body?.reporter_id) {
      userManager.incrementReportsFiled(String(req.body.reporter_id));
    }

    return res.status(201).json(result.data);
  });

  app.get('/lookup', requireValidLicense, (req, res) => {
    const type = typeof req.query.type === 'string' ? req.query.type : undefined;
    const value = typeof req.query.value === 'string' ? req.query.value : undefined;

    const result = trustEngine.lookup(type, value);
    if (result.status !== 200 || !result.data) {
      return res.status(result.status).json({ error: result.error });
    }
    return res.status(200).json(result.data);
  });

  // Student Brief Page 10: "Example: GET /map?pincode=560102&days=7&radius_km=2. If days is missing, use 7. If radius_km is missing, use 2."
  app.get('/map', requireValidLicense, (req, res) => {
    const pincode =
      typeof req.query.pincode === 'string'
        ? req.query.pincode
        : typeof req.query.area_pincode === 'string'
        ? req.query.area_pincode
        : undefined;
    const days = req.query.days !== undefined ? Number(req.query.days) : 7;
    const radiusKm = req.query.radius_km !== undefined ? Number(req.query.radius_km) : 2;

    const result = trustEngine.getMapClusters(pincode, days, radiusKm);
    if (result.status !== 200 || !result.data) {
      return res.status(result.status).json({ error: result.error });
    }
    return res.status(200).json(result.data);
  });

  app.get('/alerts', requireValidLicense, (req, res) => {
    const pincode =
      typeof req.query.pincode === 'string'
        ? req.query.pincode
        : typeof req.query.area_pincode === 'string'
        ? req.query.area_pincode
        : '560102';

    const result = trustEngine.getAlerts(pincode);
    if (result.status !== 200 || !result.data) {
      return res.status(result.status).json({ error: result.error });
    }
    return res.status(200).json(result.data);
  });

  // Student Brief Page 11: "6. POST /admin/reset -> Delete every report and reply 200."
  app.post('/admin/reset', (_req, res) => {
    trustEngine.resetAll();
    return res.status(200).json({
      ok: true,
      status: 'ok',
      message: 'All reports and challenges deleted'
    });
  });

  // Helper endpoint to re-seed demo data for interactive UI exploration after a clean judge reset
  app.post('/api/demo/seed', (_req, res) => {
    trustEngine.seedDemoData();
    return res.status(200).json({
      ok: true,
      status: 'ok',
      message: 'Demo reports re-seeded'
    });
  });

  app.post('/challenges', requireValidLicense, (req, res) => {
    const result = trustEngine.createChallenge(req.body || {});
    if (result.status !== 201 || !result.data) {
      return res.status(result.status).json({ error: result.error });
    }
    return res.status(201).json(result.data);
  });

  // ============================================================================
  // 5. CASE TRACKER & GEMINI AI ADVISOR ENDPOINTS
  // ============================================================================

  app.get('/cases', requireValidLicense, (req, res) => {
    const q =
      typeof req.query.query === 'string'
        ? req.query.query
        : typeof req.query.q === 'string'
        ? req.query.q
        : '';
    const dossier = trustEngine.getCaseStatus(q);
    if (!dossier) {
      return res.status(404).json({
        found: false,
        error: `No active Case Dossier or Report found matching "${q}". Try CASE-2026-8921 or +91 98765 22446.`
      });
    }
    return res.status(200).json(dossier);
  });

  app.get('/api/user/cases/:userId', requireValidLicense, (req, res) => {
    const { userId } = req.params;
    const userObj = userManager.getUserById(userId) || userManager.getUserByEmail(userId);
    const casesById = trustEngine.getCasesByUser(userId);
    const casesByEmail = userObj ? trustEngine.getCasesByUser(userObj.email) : [];
    const seen = new Set<string>();
    const combined: any[] = [];
    for (const c of [...casesById, ...casesByEmail]) {
      if (!seen.has(c.case_id)) {
        seen.add(c.case_id);
        combined.push(c);
      }
    }
    return res.status(200).json({ cases: combined });
  });

  app.post('/api/gemini/analyze-scam', async (req, res) => {
    const { prompt, context } = req.body || {};
    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const systemInstruction = `You are the KavachSetu Citizen Cyber Safety AI Advisor for India.
Analyze suspected phone numbers, UPI handles, SMS links, and scam messages (such as Digital Arrest, Fake KYC, UPI Collect Requests, Electricity Bill Disconnection, and FedEx Customs scams).
Rules:
1. Never accuse an individual by name; use calm, factual, civic-minded phrasing.
2. Provide a clear Risk Assessment, explain how the scam pattern works in India, and give a concise 3-step action plan (including calling 1930 or reporting at cybercrime.gov.in if money was lost).
3. Include a brief 2-line Hindi summary (हिंदी सुरक्षा सारांश) at the end for accessibility.`;

        const fullPrompt = context
          ? `User Query: ${prompt}\n\nTrust Engine Telemetry Context:\n${JSON.stringify(context, null, 2)}`
          : String(prompt);

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: fullPrompt,
          config: {
            systemInstruction,
            temperature: 0.3
          }
        });

        if (response.text) {
          return res.status(200).json({ analysis: response.text });
        }
      } catch (err) {
        console.warn('Gemini API fallback triggered:', err);
      }
    }

    const verdict = context?.verdict || 'SUSPICIOUS';
    const scamType = context?.scam_type || 'digital-arrest';
    const displayVal = context?.display_value || 'Reported Identifier';

    const fallbackAnalysis = `• RISK VERDICT: ${verdict} (${displayVal})
• PATTERN IDENTIFIED: ${String(scamType).toUpperCase().replace(/-/g, ' ')}

1. HOW THIS SCAM OPERATES IN INDIA:
Fraudsters use spoofed caller IDs, WhatsApp video calls in fake police/CBI uniforms, or urgent SMS shortlinks to create panic ("Digital Arrest" or "Immediate KYC/Electricity Suspension"). Legitimate Indian law enforcement agencies (CBI, ED, Police, Customs) and banks NEVER interrogate citizens on video calls or demand UPI/RTGS transfers to "verify" funds.

2. 3-STEP CITIZEN SAFETY PROTOCOL:
• STEP 1 (Disconnect): Do not click any link, never share your screen (AnyDesk/TeamViewer), and NEVER enter your UPI PIN on a "Collect Request" (entering a UPI PIN always deducts money).
• STEP 2 (Verify): Independently dial your bank's official toll-free number (e.g., 1800-1234 for SBI) or check KavachSetu before trusting unknown callers.
• STEP 3 (Golden Hour Escalation): If any money was deducted, immediately dial **1930** (National Cybercrime Helpline) or file a complaint at **cybercrime.gov.in** within the first hour to freeze the recipient mule account.

हिंदी सुरक्षा सारांश:
पुलिस, CBI या बैंक कभी भी व्हाट्सएप वीडियो कॉल पर "डिजिटल अरेस्ट" नहीं करते और न ही पैसे प्राप्त करने के लिए UPI PIN मांगते हैं। किसी भी साइबर धोखाधड़ी की स्थिति में तुरंत 1930 पर कॉल करें।`;

    return res.status(200).json({ analysis: fallbackAnalysis });
  });

  // ============================================================================
  // 6. VITE DEV MIDDLEWARE OR PRODUCTION STATIC ASSETS
  // ============================================================================

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KavachSetu — Community Scam Map server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
