import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  ShieldCheck,
  AlertOctagon,
  RefreshCw,
  Send,
  Clock,
  CheckCircle2,
  Server,
  Download,
  Upload,
  Trash2
} from 'lucide-react';
import { UserAccount } from '../engine/userManager';

interface OrgLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserAccount | null;
  onLicenseChange: () => void;
}

export const OrgLicenseModal: React.FC<OrgLicenseModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLicenseChange
}) => {
  const [licenseStatus, setLicenseStatus] = useState<any>(null);
  const [syncTelemetry, setSyncTelemetry] = useState<any>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);
  const [organization, setOrganization] = useState(
    currentUser?.organization || 'Demo Bank'
  );
  const [contactEmail, setContactEmail] = useState(
    currentUser?.email || 'vigilance@sbi.co.in'
  );
  const [requestedDays, setRequestedDays] = useState(365);
  const [reason, setReason] = useState(
    'Annual organization subscription for enterprise scam lookup API and banking fraud radar'
  );
  const [rawJsonInput, setRawJsonInput] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  const fetchStatus = async (overrideId?: string) => {
    const activeId = (overrideId ?? contactEmail).trim() || 'vigilance@sbi.co.in';
    try {
      const [licRes, syncRes] = await Promise.all([
        fetch('/license'),
        fetch(`/license/sync-telemetry?requester_id=${encodeURIComponent(activeId)}`)
      ]);
      if (licRes.ok) {
        const lData = await licRes.json();
        setLicenseStatus(lData);
        if (lData.licensee && lData.expires_at && lData.signature) {
          setRawJsonInput(
            JSON.stringify(
              {
                licensee: lData.licensee,
                expires_at: lData.expires_at,
                signature: lData.signature
              },
              null,
              2
            )
          );
        }
      }
      if (syncRes.ok) {
        const sData = await syncRes.json();
        const tel = sData.telemetry || sData;
        setSyncTelemetry(tel);
        setCooldownSeconds(tel?.next_allowed_seconds > 0 ? tel.next_allowed_seconds : 0);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus(contactEmail);
      setFeedback(null);
    }
  }, [isOpen, contactEmail]);

  // Live 15-second cooldown countdown timer
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          fetchStatus();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  if (!isOpen) return null;

  const handleRequestRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch('/license/request-renewal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requester_id: contactEmail,
          licensee_name: organization,
          contact_email: contactEmail,
          requested_days: requestedDays,
          reason
        })
      });
      const data = await res.json();
      if (data.telemetry?.next_allowed_seconds > 0) {
        setCooldownSeconds(data.telemetry.next_allowed_seconds);
      }
      if (!res.ok) {
        setFeedback({
          type: 'error',
          text:
            data.error ||
            'Rate-limited: Max 2 requests per day with 15s gap between server requests from same ID'
        });
      } else {
        setFeedback({
          type: 'success',
          text: `Renewal Request ${data.request.request_id} (ID: ${data.request.requester_id}) dispatched! Quota for this ID: ${data.telemetry?.requests_today_count ?? 1}/2 today • 15s server gap active.`
        });
      }
      await fetchStatus(contactEmail);
    } catch {
      setFeedback({ type: 'error', text: 'Network error submitting renewal request' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrDeclineLicense = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch('/license/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({
          type: 'error',
          text: 'License deleted (Won’t Renew / Revoked). All protected endpoints now return 403 LICENSE_EXPIRED until a new license is issued or approved by Admin.'
        });
        await fetchStatus(contactEmail);
        onLicenseChange();
      } else {
        setFeedback({ type: 'error', text: data.error || 'Failed to delete license' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Network error deleting license' });
    } finally {
      setLoading(false);
    }
  };

  const handleInterServerSync = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch('/license/sync-servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requester_id: contactEmail
        })
      });
      const data = await res.json();
      if (data.telemetry?.next_allowed_seconds > 0) {
        setCooldownSeconds(data.telemetry.next_allowed_seconds);
      }
      if (!res.ok) {
        setFeedback({ type: 'error', text: data.error || 'Inter-server sync rate-limited' });
      } else {
        setFeedback({ type: 'success', text: data.message });
      }
      await fetchStatus(contactEmail);
    } catch {
      setFeedback({ type: 'error', text: 'Failed to contact peer license server' });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLicenseAction = async (minutes: number, label: string) => {
    setLoading(true);
    setFeedback(null);
    try {
      const genRes = await fetch('/api/demo/generate-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          minutes,
          licensee: organization || 'Demo Bank'
        })
      });
      const signedPayload = await genRes.json();
      const applyRes = await fetch('/license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signedPayload)
      });
      const applyData = await applyRes.json();
      setFeedback({
        type: applyData.is_valid ? 'success' : 'error',
        text:
          minutes < 0
            ? 'Licence expired! Every endpoint except /health and /license now returns 403 {"error": "LICENSE_EXPIRED"} while keeping all data intact.'
            : `${label} uploaded via POST /license — active immediately without server restart!`
      });
      await fetchStatus();
      onLicenseChange();
    } catch {
      setFeedback({ type: 'error', text: 'Error applying license JSON' });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadLicenseFile = async (minutes: number, filename: string) => {
    try {
      const genRes = await fetch('/api/demo/generate-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          minutes,
          licensee: 'Demo Bank'
        })
      });
      const signedPayload = await genRes.json();
      const blob = new Blob([JSON.stringify(signedPayload, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setFeedback({ type: 'error', text: 'Failed to generate downloadable license file' });
    }
  };

  const handleUploadRawJson = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    try {
      const parsed = JSON.parse(rawJsonInput);
      const res = await fetch('/license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed)
      });
      const data = await res.json();
      if (!res.ok) {
        setFeedback({
          type: 'error',
          text: data.error || 'Signature check failed! Someone edited the date or licensee without the private key.'
        });
      } else {
        setFeedback({
          type: data.is_valid ? 'success' : 'error',
          text: `POST /license succeeded (${data.status_code}) — applied live without server restart!`
        });
        await fetchStatus();
        onLicenseChange();
      }
    } catch {
      setFeedback({ type: 'error', text: 'Invalid JSON format in licence payload' });
    } finally {
      setLoading(false);
    }
  };

  const isValid = Boolean(licenseStatus?.is_valid);
  const quotaUsed = syncTelemetry?.requests_today_count ?? syncTelemetry?.requests_today ?? 0;
  const maxQuota = syncTelemetry?.max_requests_per_day ?? 2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#0D1322] border border-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-white">
              Organization License & Renewal Desk (User & Admin Sync)
            </h3>
            <p className="text-xs text-slate-400">
              Max 2 Requests/Day • 15s Cooldown Gap Between Servers • Request Renewal or Delete Expired License
            </p>
          </div>
        </div>

        {feedback && (
          <div
            className={`mb-4 p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
                : 'bg-red-950/50 border-red-500/40 text-red-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Current License Status & 4-Step Live Judge Demo Buttons */}
        <div className="bg-[#070B14] border border-slate-800 rounded-xl p-4 mb-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              {isValid ? (
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertOctagon className="w-5 h-5 text-red-400" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">GET /license Status:</span>
                  <span
                    className={`text-xs font-extrabold px-2 py-0.5 rounded uppercase ${
                      isValid
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {licenseStatus?.status_code || 'CHECKING'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Licensed To: <strong className="text-slate-200">{licenseStatus?.licensee || 'None (Deleted / Revoked)'}</strong> • Expires:{' '}
                  <span className="font-mono text-slate-300">
                    {licenseStatus?.expires_at
                      ? new Date(licenseStatus.expires_at).toLocaleString()
                      : 'N/A'}
                  </span>
                </p>
              </div>
            </div>

            {/* 4-Step Live Judge Demo Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleDemoLicenseAction(5, '5-Minute Licence')}
                className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Step 2: Upload 5-Min Licence
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleDemoLicenseAction(-1, 'Expired Licence')}
                className="px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Step 3: Simulate Expiry (403)
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleDemoLicenseAction(365 * 24 * 60, '1-Year Valid Licence')}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Step 4: Renew 1-Year Licence
              </button>
            </div>
          </div>

          {/* Downloadable Judge Demo License Files + Inter-Server Sync Telemetry */}
          <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400 font-bold">Download Licence Files:</span>
              <button
                type="button"
                onClick={() => handleDownloadLicenseFile(5, 'license-5min.json')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 font-mono text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3" />
                license-5min.json
              </button>
              <button
                type="button"
                onClick={() => handleDownloadLicenseFile(365 * 24 * 60, 'license-valid-1year.json')}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-300 font-mono text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3" />
                license-valid-1year.json
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-300 font-mono text-[11px] bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                ID <strong className="text-amber-300">{contactEmail || 'default'}</strong> Quota:{' '}
                <strong>{Math.min(2, quotaUsed)}/{maxQuota}</strong>/day (15s Gap)
              </span>
              {cooldownSeconds > 0 && (
                <span className="text-amber-300 font-mono text-[11px] bg-amber-950/60 px-2.5 py-1 rounded border border-amber-700/60 flex items-center gap-1">
                  <Clock className="w-3 h-3 animate-spin" />
                  <span>Wait {cooldownSeconds}s (Same ID)</span>
                </span>
              )}
              <button
                type="button"
                disabled={loading}
                onClick={handleInterServerSync}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 border border-slate-700 text-slate-200 font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                title="Click twice within 15s or >2 times/day from the same ID to test HTTP 429 rate limiting"
              >
                <Server className="w-3 h-3 text-sky-400" />
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                <span>
                  {cooldownSeconds > 0
                    ? `Test 15s Gap (${cooldownSeconds}s)`
                    : quotaUsed >= maxQuota
                    ? 'Test 2/Day Limit (429)'
                    : 'Sync Server (Same ID)'}
                </span>
              </button>
            </div>
          </div>

          {/* Visual 15-Second Server Timeline Bar */}
          <div className="pt-3 mt-3 border-t border-slate-800/80 font-mono">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-slate-400">
                15-Second Inter-Server Timeline ({contactEmail || 'default'}):
              </span>
              {cooldownSeconds > 0 ? (
                <span className="text-amber-300 font-bold">
                  {cooldownSeconds}s remaining ({Math.max(0, 15 - cooldownSeconds)}s / 15s)
                </span>
              ) : quotaUsed >= maxQuota ? (
                <span className="text-red-400 font-bold">
                  2/2 Daily Limit Reached for this ID
                </span>
              ) : (
                <span className="text-emerald-400 font-bold">
                  15s Gap Ready • {Math.max(0, maxQuota - quotaUsed)}/{maxQuota} Requests Remaining Today
                </span>
              )}
            </div>
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-500 ${
                  cooldownSeconds > 0
                    ? 'bg-gradient-to-r from-amber-500 to-sky-400'
                    : quotaUsed >= maxQuota
                    ? 'bg-red-500'
                    : 'bg-emerald-500'
                }`}
                style={{
                  width: `${
                    cooldownSeconds > 0
                      ? Math.round(((15 - cooldownSeconds) / 15) * 100)
                      : 100
                  }%`
                }}
              />
            </div>
          </div>
        </div>

        {/* Two Columns: Upload/Edit Raw Licence JSON (POST /license) OR Request Renewal / Delete License */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Left: Direct POST /license JSON Editor */}
          <form
            onSubmit={handleUploadRawJson}
            className="bg-[#070B14] border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3"
          >
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                Upload / Verify Licence JSON (POST /license)
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Matches Student Brief Page 3 schema. Edit <code className="text-amber-300">expires_at</code> without updating <code className="text-amber-300">signature</code> to test tamper rejection.
              </p>
              <textarea
                rows={6}
                value={rawJsonInput}
                onChange={(e) => setRawJsonInput(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !rawJsonInput.trim()}
              className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
            >
              Upload to POST /license (Hot-Reload Without Restart)
            </button>
          </form>

          {/* Right: Request Renewal from Admin OR Delete License if Not Renewing */}
          <form
            onSubmit={handleRequestRenewal}
            className="bg-[#070B14] border border-slate-800 rounded-xl p-4 space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5" />
                  Request Renewal or Delete License
                </h4>
                <span className="text-[10px] font-mono text-slate-400">
                  {quotaUsed}/{maxQuota} reqs today • 15s gap
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Licensee / Organization Name
                </label>
                <input
                  type="text"
                  required
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Duration
                  </label>
                  <select
                    value={requestedDays}
                    onChange={(e) => setRequestedDays(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value={30}>30 Days</option>
                    <option value={90}>90 Days</option>
                    <option value={365}>365 Days (1 Year)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Reason for Renewal
                </label>
                <textarea
                  rows={2}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
              >
                {cooldownSeconds > 0
                  ? `15s Same-ID Server Gap Active (Wait ${cooldownSeconds}s — Click to Test 429)`
                  : quotaUsed >= maxQuota
                  ? 'Daily Quota Exhausted for This ID (2/2 Today — Click to Test 429)'
                  : `Request License Renewal (${quotaUsed}/${maxQuota} Used Today for ID)`}
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handleDeleteOrDeclineLicense}
                className="w-full py-2 rounded-lg bg-red-950/70 hover:bg-red-900/80 border border-red-800/80 text-red-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span>Won&apos;t Renew — Delete License</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
