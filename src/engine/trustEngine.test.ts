import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizePhone,
  normalizeUpi,
  normalizeUrl,
  normalizeSenderId,
  maskIdentifier
} from './normalizer';
import { TrustEngine } from './trustEngine';
import { LicenseManager } from './licenseEngine';
import { UserManager } from './userManager';

describe('KavachSetu Trust Engine, Auth Gate & License Test Suite (18 Core Tests)', () => {
  let engine: TrustEngine;

  beforeEach(() => {
    engine = new TrustEngine();
    engine.clearAllForTest();
  });

  it('1. Step 1 & 2 (Gatekeeper & Cleaner): Normalizes valid phones and rejects junk ("12345", "test", "1234567890")', () => {
    assert.equal(normalizePhone('+91 98765-43210'), '+919876543210');
    assert.equal(normalizePhone('09876543210'), '+919876543210');
    assert.equal(normalizePhone('98765 43210'), '+919876543210');
    assert.equal(normalizePhone('1930'), '1930');
    assert.equal(normalizePhone('12345'), null);
    assert.equal(normalizePhone('test'), null);
    assert.equal(normalizePhone('1234567890'), null);
    assert.equal(
      engine.ingestReport({
        identifier_type: 'phone',
        identifier_value: '1234567890',
        pincode: '560102'
      }).status,
      400
    );
  });

  it('2. Normalizes UPI handles and strips spaces while lowercasing', () => {
    assert.equal(normalizeUpi('  RAVI.KUMAR@OKAXIS '), 'ravi.kumar@okaxis');
    assert.equal(normalizeUpi('FreshBakes@okaxis'), 'freshbakes@okaxis');
    assert.equal(normalizeUpi('not-a-upi-handle'), null);
  });

  it('3. Normalizes URLs and strips UTM tracking parameters while preserving paths', () => {
    const res = normalizeUrl('http://www.SBI-KYC-Update.in/verify/?utm_source=sms&utm_medium=link');
    assert.equal(res, 'https://sbi-kyc-update.in/verify');
    assert.equal(normalizeUrl('just_a_word'), null);
  });

  it('4. Normalizes SMS DLT Sender IDs (strips VM-, AD-, JX- telecom prefixes)', () => {
    assert.equal(normalizeSenderId('VM-HDFCBK'), 'HDFCBK');
    assert.equal(normalizeSenderId('ad-sbibnk'), 'SBIBNK');
    assert.equal(normalizeSenderId('12'), null);
  });

  it('5. Enforces strict privacy masking when unverified (<3 distinct reporters)', () => {
    assert.equal(maskIdentifier('phone', '+919876543210', false), '98XXXXX210');
    assert.equal(maskIdentifier('phone', '+919876543210', true), '+919876543210');
    assert.equal(maskIdentifier('upi', 'ravi.kumar@okaxis', false), 'r***@okaxis');
    assert.equal(maskIdentifier('upi', 'ravi.kumar@okaxis', true), 'ravi.kumar@okaxis');
  });

  it('6. Protects Verified Businesses & Public Helplines (1930, 18001600, freshbakes@okaxis) from false-flagging', () => {
    for (let i = 1; i <= 5; i++) {
      engine.ingestReport({
        identifier_type: 'upi',
        identifier_value: 'freshbakes@okaxis',
        scam_type: 'upi-refund-qr',
        channel: 'UPI request',
        pincode: '560038',
        occurred_at: '2026-06-05T10:00:00Z',
        reporter_id: `attacker_${i}`,
        ip_prefix: `10.${i}.1`
      });
    }
    const res = engine.lookup('upi', 'freshbakes@okaxis');
    assert.equal(res.data?.verdict, 'VERIFIED_BUSINESS');

    const helpline = engine.lookup('phone', '1930');
    assert.equal(helpline.data?.verdict, 'VERIFIED_BUSINESS');
  });

  it('7. Step 3 & 4: Awards Base 1.0 + 0.5 Detailed Story Bonus (1.5) and sets 0.0 on same ip_prefix / reporter_id', () => {
    const detailed = engine.ingestReport({
      identifier_type: 'phone',
      identifier_value: '+91 98111 22333',
      scam_type: 'digital-arrest',
      channel: 'Phone call',
      pincode: '560102',
      occurred_at: '2026-06-05T10:00:00Z',
      reporter_id: 'cit_1',
      ip_prefix: '103.21.58',
      note: 'Caller posed as Mumbai Crime Branch officer on Skype video call and demanded transfer.'
    });
    assert.equal(detailed.data?.trust_score, 1.5);

    const sameWifi = engine.ingestReport({
      identifier_type: 'phone',
      identifier_value: '09811122333',
      scam_type: 'digital-arrest',
      channel: 'Phone call',
      pincode: '560102',
      occurred_at: '2026-06-05T10:05:00Z',
      reporter_id: 'cit_2',
      ip_prefix: '103.21.58',
      note: 'Different note but same Wi-Fi /24 ip_prefix'
    });
    assert.equal(sameWifi.data?.trust_score, 0.0);

    const res = engine.lookup('phone', '09811122333');
    assert.equal(res.data?.distinct_reporters, 1);
    assert.equal(res.data?.trust_score_sum, 1.5);
    assert.equal(res.data?.verdict, 'SUSPICIOUS');
  });

  it('8. Step 3 & 4: Copy-Paste Filter & Payload Entropy set trust_score to 0.0', () => {
    for (let i = 1; i <= 5; i++) {
      engine.ingestReport({
        identifier_type: 'phone',
        identifier_value: '+91 98222 33444',
        scam_type: 'upi-refund-qr',
        channel: 'WhatsApp',
        pincode: '560038',
        occurred_at: `2026-06-05T11:0${i}:00Z`,
        reporter_id: `blank_bot_${i}`,
        ip_prefix: `${40 + i}.21.${10 + i}`,
        note: '' // 5 consecutive blank notes with same channel and pincode -> Low Payload Entropy!
      });
    }
    const entropyLookup = engine.lookup('phone', '+919822233444');
    assert.equal(entropyLookup.data?.trust_score_sum, 0);
    assert.equal(entropyLookup.data?.verdict, 'NO_REPORTS');
  });

  it('9. Step 5: Escalates to KNOWN_SCAM and unmasks identifier when >=3 distinct reporters on separate subnets report it', () => {
    const reporters = [
      { id: 'cit_1', ip: '49.205.10', val: '+91 98765 43210', note: 'Video call threat claiming parcel seized at airport.' },
      { id: 'cit_2', ip: '106.51.20', val: '09876543210', note: 'Received WhatsApp call from fake customs officer.' },
      { id: 'cit_3', ip: '122.167.30', val: '98765-43210', note: 'Asked to transfer money to RBI verification account.' }
    ];
    for (const r of reporters) {
      engine.ingestReport({
        identifier_type: 'phone',
        identifier_value: r.val,
        scam_type: 'digital-arrest',
        channel: 'SMS or WhatsApp',
        pincode: '560102',
        occurred_at: '2026-06-05T11:00:00Z',
        reporter_id: r.id,
        ip_prefix: r.ip,
        note: r.note
      });
    }
    const res = engine.lookup('phone', '+919876543210');
    assert.equal(res.data?.distinct_reporters, 3);
    assert.equal(res.data?.trust_score_sum, 4.5);
    assert.equal(res.data?.verdict, 'KNOWN_SCAM');
    assert.equal(res.data?.display_value, '+919876543210');
  });

  it('10. Dispute Kill Switch: Steps down verdict from KNOWN_SCAM to SUSPICIOUS with challenged=true on POST /challenges', () => {
    for (let i = 1; i <= 3; i++) {
      engine.ingestReport({
        identifier_type: 'phone',
        identifier_value: '+91 97000 11111',
        scam_type: 'fake-kyc-link',
        channel: 'Phone call',
        pincode: '560034',
        occurred_at: `2026-06-05T12:0${i}:00Z`,
        reporter_id: `rep_${i}`,
        ip_prefix: `${40 + i}.10.20`,
        note: `Unique witness report #${i} with distinct context`
      });
    }
    assert.equal(engine.lookup('phone', '+919700011111').data?.verdict, 'KNOWN_SCAM');

    const ch = engine.createChallenge({
      identifier_type: 'phone',
      identifier_value: '09700011111',
      claimant_name: 'Kaveri Logistics Pvt Ltd',
      proof_note: 'GSTIN 29AABCK1234F1Z5 + Airtel Enterprise Allocation Letter'
    });
    assert.equal(ch.status, 201);
    assert.equal(ch.data?.status, 'under_review');

    const afterDispute = engine.lookup('phone', '+919700011111');
    assert.equal(afterDispute.data?.challenged, true);
    assert.equal(afterDispute.data?.verdict, 'SUSPICIOUS');
  });

  it('11. Geographic radius filtering & 7-day window exclude far-away and month-old reports on /map', () => {
    const nowIso = new Date().toISOString();
    const fortyDaysAgoIso = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString();

    engine.ingestReport({
      identifier_type: 'phone',
      identifier_value: '+919888877771',
      scam_type: 'digital-arrest',
      channel: 'Phone call',
      pincode: '560102',
      occurred_at: nowIso,
      reporter_id: 'blr_1',
      ip_prefix: '49.1.1',
      note: 'Recent HSR Layout report'
    });
    engine.ingestReport({
      identifier_type: 'phone',
      identifier_value: '+919888877773',
      scam_type: 'fake-kyc-link',
      channel: 'SMS',
      pincode: '560034',
      occurred_at: fortyDaysAgoIso,
      reporter_id: 'old_rep_1',
      ip_prefix: '69.1.1',
      note: 'Month old report'
    });

    const mapRes = engine.getMapClusters('560102', 7, 10);
    assert.equal(mapRes.status, 200);
    assert.equal(mapRes.data?.clusters.length, 1);
    assert.equal(mapRes.data?.clusters[0].pincode, '560102');
  });

  it('12. Triggers SPIKE alert on >=5 genuine reports (>=2x baseline) and ignores fake single-reporter bursts', () => {
    for (let i = 1; i <= 5; i++) {
      engine.ingestReport({
        identifier_type: 'phone',
        identifier_value: '+919876543210',
        scam_type: 'digital-arrest',
        channel: 'SMS or WhatsApp',
        pincode: '560102',
        occurred_at: `2026-06-05T0${i}:00:00Z`,
        reporter_id: `distinct_cit_${i}`,
        ip_prefix: `${100 + i}.20.30`,
        note: `Distinct citizen report ${i} in HSR Layout`
      });
    }
    const alertsRes = engine.getAlerts('560102');
    assert.equal(alertsRes.status, 200);
    assert.equal(alertsRes.data?.alerts.some((a) => a.type === 'SPIKE'), true);
  });

  it('13. Per-Citizen Case Tracking: Rahul Sharma (usr_cit_04) has 3 cases and Neha Verma (usr_cit_05) has 1 case', () => {
    engine.seedDemoData();
    const rahulCases = engine.getCasesByUser('usr_cit_04');
    const nehaCases = engine.getCasesByUser('usr_cit_05');
    assert.equal(rahulCases.length, 3);
    assert.equal(nehaCases.length, 1);
    assert.notEqual(rahulCases[0].case_id, nehaCases[0].case_id);
  });

  it('14. Suspended Citizen Login Denied until Admin changes status to ACTIVE', () => {
    const um = new UserManager();
    const denied = um.authenticateCitizen('bot_scam_feed@proxymail.top', 'citizen123');
    assert.equal(denied.ok, false);
    assert.equal(denied.code, 'SUSPENDED');

    // Admin toggles status from SUSPENDED to ACTIVE
    um.toggleUserStatus('usr_bot_06');
    const allowed = um.authenticateCitizen('bot_scam_feed@proxymail.top', 'citizen123');
    assert.equal(allowed.ok, true);
  });

  it('15. LicenseManager enforces 15s cooldown gap, max 2 renewal requests/day, and User/Admin License Deletion', () => {
    const lm = new LicenseManager();
    assert.equal(lm.checkLicense().is_valid, true);

    // First renewal request succeeds
    const req1 = lm.submitRenewalRequest({
      licensee_name: 'Demo Bank',
      contact_email: 'admin@demobank.in',
      requested_days: 365
    });
    assert.equal(req1.ok, true);
    assert.equal(req1.status, 201);

    // Immediate second renewal request within 15s is blocked with 429
    const req2Immediate = lm.submitRenewalRequest({
      licensee_name: 'Demo Bank',
      contact_email: 'admin@demobank.in',
      requested_days: 365
    });
    assert.equal(req2Immediate.ok, false);
    assert.equal(req2Immediate.status, 429);

    // Deleting license (Won't renew / Admin revoke) sets status_code to REVOKED and is_valid to false
    lm.deleteLicense();
    assert.equal(lm.checkLicense().is_valid, false);
    assert.equal(lm.checkLicense().status_code, 'REVOKED');
  });

  it('16. Blocks untrusted reports (0.0 trust) without inflating distinct_reporters or substituting fake loss amounts', () => {
    const baseTimeMs = Date.now();
    // 5 consecutive blank-note reports on same channel & PIN trigger Step 4 Low Payload Entropy (all 5 set to trust_score = 0.0)
    for (let i = 0; i < 5; i++) {
      engine.ingestReport({
        identifier_type: 'phone',
        identifier_value: '+91 98450 99887',
        scam_type: 'digital-arrest',
        channel: 'SMS or WhatsApp',
        pincode: '560102',
        occurred_at: new Date(baseTimeMs - (45 - i) * 1000).toISOString(),
        reporter_id: `entropy_rep_${i + 1}`,
        ip_prefix: `103.${50 + i}.88`,
        note: ''
      });
    }

    const lookupRes = engine.lookup('phone', '+91 98450 99887');
    assert.equal(lookupRes.data?.trust_score_sum, 0);
    assert.equal(lookupRes.data?.distinct_reporters, 0);
    assert.equal(lookupRes.data?.verdict, 'NO_REPORTS');

    // Verify Case Status reports exact ₹0 loss when no loss was recorded
    const caseDossier = engine.getCaseStatus('+91 98450 99887');
    assert.equal(caseDossier?.amount_lost_inr, 0);
    assert.equal(caseDossier?.total_amount_lost_inr, 0);

    // Verify Map & Point-Arrow Graph daily_series reflect 5 raw, 5 blocked, 0 verified, 0 distinct_reporters
    const mapRes = engine.getMapClusters('560102', 7, 10);
    const cluster = mapRes.data?.clusters.find((c) => c.area_pincode === '560102');
    assert.equal(cluster?.report_count, 0);
    assert.equal(cluster?.raw_report_count, 5);
    assert.equal(cluster?.blocked_report_count, 5);
    assert.equal(cluster?.distinct_reporters, 0);
  });

  it('17. Enforces 2 requests every day and 15-second gap between servers from the SAME ID in LicenseManager', () => {
    const lm = new LicenseManager();
    const baseTime = Date.now();

    // 1st request from ID "server_node_alpha" at t = 0s -> Succeeds (1/2 today)
    const r1 = lm.submitRenewalRequest({
      requester_id: 'server_node_alpha',
      licensee_name: 'Alpha Bank',
      contact_email: 'alpha@bank.in',
      simulated_now_ms: baseTime
    });
    assert.equal(r1.ok, true);
    assert.equal(r1.status, 201);
    assert.equal(r1.telemetry.requests_today_count, 1);

    // 2nd request from SAME ID "server_node_alpha" at t = +5s (<15s gap) -> Blocked with 429
    const r2TooFast = lm.submitRenewalRequest({
      requester_id: 'server_node_alpha',
      licensee_name: 'Alpha Bank',
      contact_email: 'alpha@bank.in',
      simulated_now_ms: baseTime + 5000
    });
    assert.equal(r2TooFast.ok, false);
    assert.equal(r2TooFast.status, 429);
    assert.equal(r2TooFast.telemetry.next_allowed_seconds, 10);

    // Request from a DIFFERENT ID "server_node_beta" at t = +5s -> Succeeds immediately (1/2 today for beta)
    const rBeta = lm.submitRenewalRequest({
      requester_id: 'server_node_beta',
      licensee_name: 'Beta Bank',
      contact_email: 'beta@bank.in',
      simulated_now_ms: baseTime + 5000
    });
    assert.equal(rBeta.ok, true);
    assert.equal(rBeta.status, 201);
    assert.equal(rBeta.telemetry.requests_today_count, 1);

    // 2nd request from "server_node_alpha" at t = +16s (>=15s gap) -> Succeeds (2/2 today)
    const r2AfterGap = lm.submitRenewalRequest({
      requester_id: 'server_node_alpha',
      licensee_name: 'Alpha Bank',
      contact_email: 'alpha@bank.in',
      simulated_now_ms: baseTime + 16000
    });
    assert.equal(r2AfterGap.ok, true);
    assert.equal(r2AfterGap.status, 201);
    assert.equal(r2AfterGap.telemetry.requests_today_count, 2);

    // 3rd request from SAME ID "server_node_alpha" at t = +35s (>=15s gap, same day) -> Blocked with 429 (Max 2/day!)
    const r3OverDailyQuota = lm.submitRenewalRequest({
      requester_id: 'server_node_alpha',
      licensee_name: 'Alpha Bank',
      contact_email: 'alpha@bank.in',
      simulated_now_ms: baseTime + 35000
    });
    assert.equal(r3OverDailyQuota.ok, false);
    assert.equal(r3OverDailyQuota.status, 429);
    assert.equal(r3OverDailyQuota.telemetry.status, 'QUOTA_EXHAUSTED');
  });

  it('18. Enforces 2 requests every day and 15-second gap from the SAME reporter_id in TrustEngine without exceeding 2/2', () => {
    // 1st request from "cit_same_id" at 10:00:00Z -> Allowed (trust_score = 1.0, 1/2 today)
    const req1 = engine.ingestReport({
      identifier_type: 'phone',
      identifier_value: '+91 98100 10001',
      pincode: '560102',
      occurred_at: '2026-06-05T10:00:00Z',
      reporter_id: 'cit_same_id',
      ip_prefix: '49.205.10',
      note: 'First report from citizen'
    });
    assert.equal(req1.data?.is_trusted_distinct, true);
    assert.equal(req1.data?.trust_score, 1.0);
    assert.equal(req1.data?.reporter_quota?.requests_today_count, 1);

    // 2nd request from SAME ID "cit_same_id" 5 seconds later (10:00:05Z, <15s gap) -> Blocked (SAME_ID_15S_GAP_VIOLATION, quota stays 1/2)
    const req2TooFast = engine.ingestReport({
      identifier_type: 'phone',
      identifier_value: '+91 98100 10002',
      pincode: '560102',
      occurred_at: '2026-06-05T10:00:05Z',
      reporter_id: 'cit_same_id',
      ip_prefix: '106.51.20',
      note: 'Second report only 5s later from same ID'
    });
    assert.equal(req2TooFast.data?.is_trusted_distinct, false);
    assert.equal(req2TooFast.data?.trust_score, 0.0);
    assert.equal(req2TooFast.data?.collapse_reason, 'SAME_ID_15S_GAP_VIOLATION');
    assert.equal(req2TooFast.data?.reporter_quota?.requests_today_count, 1);

    // 2nd valid request after 15s gap (10:00:16Z, >=15s gap) -> Allowed (2/2 today)
    const req2AfterGap = engine.ingestReport({
      identifier_type: 'phone',
      identifier_value: '+91 98100 10002',
      pincode: '560102',
      occurred_at: '2026-06-05T10:00:16Z',
      reporter_id: 'cit_same_id',
      ip_prefix: '106.51.20',
      note: 'Second valid report 16s after first report'
    });
    assert.equal(req2AfterGap.data?.is_trusted_distinct, true);
    assert.equal(req2AfterGap.data?.reporter_quota?.requests_today_count, 2);

    // 3rd request from SAME ID "cit_same_id" 20 seconds later (10:00:36Z, >=15s gap, already 2/2 today!) -> Blocked & capped at 2/2 (never 3/2!)
    const req3OverDailyLimit = engine.ingestReport({
      identifier_type: 'phone',
      identifier_value: '+91 98100 10003',
      pincode: '560102',
      occurred_at: '2026-06-05T10:00:36Z',
      reporter_id: 'cit_same_id',
      ip_prefix: '122.167.30',
      note: 'Third report on the same day from the same ID'
    });
    assert.equal(req3OverDailyLimit.data?.is_trusted_distinct, false);
    assert.equal(req3OverDailyLimit.data?.trust_score, 0.0);
    assert.equal(req3OverDailyLimit.data?.collapse_reason, 'SAME_ID_2_PER_DAY_QUOTA_EXCEEDED');
    assert.equal(req3OverDailyLimit.data?.reporter_quota?.requests_today_count, 2);

    // Enforced UI mode (enforce_id_rate_limit: true) rejects with HTTP 429 on 15s gap and after 2/2
    const ui1 = engine.ingestReport({
      identifier_type: 'phone',
      identifier_value: '+91 98100 20001',
      pincode: '560102',
      reporter_id: 'cit_ui_user',
      enforce_id_rate_limit: true
    });
    assert.equal(ui1.status, 201);
    assert.equal(ui1.data?.reporter_quota?.requests_today_count, 1);

    const ui2Immediate = engine.ingestReport({
      identifier_type: 'phone',
      identifier_value: '+91 98100 20002',
      pincode: '560102',
      reporter_id: 'cit_ui_user',
      enforce_id_rate_limit: true
    });
    assert.equal(ui2Immediate.status, 429);
    assert.equal(ui2Immediate.reporter_quota?.requests_today_count, 1);
  });

  it('19. UI Gate Mode (enforce_id_rate_limit: true) blocks Same Account, Same Wi-Fi IP, and Copy-Pasted Note with HTTP 409 without creating empty shells', () => {
    // First valid report from usr_alice on Wi-Fi 103.21.124.15
    const r1 = engine.ingestReport({
      identifier_type: 'phone',
      identifier_value: '+91 98450 55667',
      scam_type: 'digital-arrest',
      channel: 'Phone call',
      pincode: '560102',
      reporter_id: 'usr_alice',
      client_ip: '103.21.124.15',
      note: 'Caller pretended to be customs official demanding immediate RTGS transfer.',
      enforce_id_rate_limit: true
    });
    assert.equal(r1.status, 201);

    // Reset 15s cooldown for usr_alice to test Same Account + Same Number (formatted with 0 prefix)
    engine.resetReporterQuota('usr_alice');
    const sameAccount = engine.ingestReport({
      identifier_type: 'phone',
      identifier_value: '098450-55667',
      scam_type: 'digital-arrest',
      channel: 'Phone call',
      pincode: '560102',
      reporter_id: 'usr_alice',
      client_ip: '49.205.10.22',
      note: 'Trying again from same account with different phone format',
      enforce_id_rate_limit: true
    });
    assert.equal(sameAccount.status, 409);
    assert.match(String(sameAccount.error), /SAME_REPORTER_DUPLICATE/);

    // Different account (usr_bob) on the SAME Wi-Fi IP /24 subnet (103.21.124.88)
    const sameWifi = engine.ingestReport({
      identifier_type: 'phone',
      identifier_value: '9845055667',
      scam_type: 'digital-arrest',
      channel: 'Phone call',
      pincode: '560102',
      reporter_id: 'usr_bob',
      client_ip: '103.21.124.88',
      note: 'Totally different note from Bob on the same Wi-Fi router',
      enforce_id_rate_limit: true
    });
    assert.equal(sameWifi.status, 409);
    assert.match(String(sameWifi.error), /SAME_SUBNET_24H_BURST/);

    // Different account (usr_charlie) on DIFFERENT Wi-Fi IP (122.167.30.10) but COPY-PASTED note
    const copyPaste = engine.ingestReport({
      identifier_type: 'phone',
      identifier_value: '+919845055667',
      scam_type: 'digital-arrest',
      channel: 'Phone call',
      pincode: '560102',
      reporter_id: 'usr_charlie',
      client_ip: '122.167.30.10',
      note: 'Caller pretended to be customs official demanding immediate RTGS transfer.',
      enforce_id_rate_limit: true
    });
    assert.equal(copyPaste.status, 409);
    assert.match(String(copyPaste.error), /COPY_PASTED_NOTE_COLLAPSED/);

    // Verify no empty shell reports were added: total_reports for this case is strictly 1
    const dossier = engine.getCaseStatus('+919845055667');
    assert.equal(dossier.total_reports, 1);
    assert.equal(dossier.distinct_reporters, 1);
    assert.equal(dossier.trust_score_sum, 1.5);
  });

  it('20. Simulates High-Velocity Bot Flood (>10 reports in 10s) and Coordinated Area PIN Flood', () => {
    const baseMs = Date.UTC(2026, 5, 5, 15, 0, 0);
    let velocityCollapsed = 0;
    for (let i = 1; i <= 14; i++) {
      const res = engine.ingestReport({
        identifier_type: 'phone',
        identifier_value: '+91 98450 44332',
        scam_type: 'fake-kyc-link',
        channel: 'SMS',
        pincode: '560102',
        occurred_at: new Date(baseMs + i * 500).toISOString(),
        reporter_id: `bot_node_${i}`,
        ip_prefix: `${10 + i}.20.${30 + i}`,
        note: `Unique bot note payload #${i} generated by script`
      });
      if (res.data?.collapse_reason === 'BOT_VELOCITY_10S_EXCEEDED') {
        velocityCollapsed++;
      }
    }
    assert.equal(velocityCollapsed, 4);

    // Coordinated Area Flood: same /24 subnet flooding 5 different numbers in PIN 560034 within 5 minutes
    let areaCollapsed = 0;
    for (let i = 1; i <= 5; i++) {
      const res = engine.ingestReport({
        identifier_type: 'phone',
        identifier_value: `+91 98459 0000${i}`,
        scam_type: 'upi-refund-qr',
        channel: 'WhatsApp',
        pincode: '560034',
        occurred_at: new Date(baseMs + i * 30000).toISOString(),
        reporter_id: `subnet_flooder_${i}`,
        client_ip: `49.205.99.${10 + i}`,
        note: `Flooding area PIN 560034 target #${i}`
      });
      if (res.data?.collapse_reason === 'COORDINATED_AREA_FLOOD_COLLAPSED') {
        areaCollapsed++;
      }
    }
    assert.equal(areaCollapsed, 2);
  });

  it('21. Runs full 8-Vector Anti-Spoofing & Fake Report Attack Simulation (50 fake reports) in isolated sandbox without polluting live engine', () => {
    const beforeThreatFeed = engine.getAdminThreatFeed();
    assert.equal(beforeThreatFeed.stats.total_reports, 0);

    const simResult = engine.runMultiVectorAttackSimulation();
    assert.equal(simResult.ok, true);
    assert.equal(simResult.isolated_sandbox, true);
    assert.equal(simResult.total_scenarios, 8);
    assert.equal(simResult.passed_scenarios, 8);
    assert.equal(simResult.total_fake_reports_generated, 50);
    assert.equal(simResult.empty_shells_created_in_ui_mode, 0);
    assert.equal(simResult.live_database_polluted, false);

    // Confirm live engine still has 0 reports (zero pollution from simulation)
    const afterThreatFeed = engine.getAdminThreatFeed();
    assert.equal(afterThreatFeed.stats.total_reports, 0);
  });
});



