import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  FileSearch,
  Lock,
  PhoneCall,
  MessageSquare,
  QrCode,
  Globe,
  CreditCard,
  MoreHorizontal,
  Clock
} from 'lucide-react';
import { Language } from '../translations';
import {
  OFFICIAL_AREAS,
  SCAM_TYPES,
  IdentifierType
} from '../engine/normalizer';
import { UserAccount } from '../engine/userManager';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onReportSuccess: (reportId: string, caseId: string) => void;
  currentUser?: UserAccount | null;
  onTrackCase?: (caseId: string) => void;
}

const VISUAL_CHANNELS: Array<{
  id: string;
  labelEn: string;
  labelHi: string;
  defaultType: IdentifierType;
  icon: React.FC<{ className?: string }>;
}> = [
  { id: 'Phone call', labelEn: 'Phone call', labelHi: 'फ़ोन कॉल', defaultType: 'phone', icon: PhoneCall },
  { id: 'SMS or WhatsApp', labelEn: 'SMS / WhatsApp', labelHi: 'SMS / व्हाट्सएप', defaultType: 'phone', icon: MessageSquare },
  { id: 'UPI request', labelEn: 'UPI request', labelHi: 'UPI पेमेंट रिक्वेस्ट', defaultType: 'upi', icon: CreditCard },
  { id: 'QR code', labelEn: 'QR code', labelHi: 'QR कोड स्कैन', defaultType: 'upi', icon: QrCode },
  { id: 'Fake website', labelEn: 'Fake website', labelHi: 'नकली वेबसाइट', defaultType: 'url', icon: Globe },
  { id: 'Something else', labelEn: 'Something else', labelHi: 'अन्य माध्यम', defaultType: 'sender_id', icon: MoreHorizontal }
];

const TIME_PRESETS: Array<{
  id: 'now' | '1h' | 'yesterday';
  labelEn: string;
  labelHi: string;
  offsetHours: number;
}> = [
  { id: 'now', labelEn: 'Just now', labelHi: 'अभी-अभी', offsetHours: 0 },
  { id: '1h', labelEn: '1 hour ago', labelHi: '1 घंटे पहले', offsetHours: 1 },
  { id: 'yesterday', labelEn: 'Yesterday', labelHi: 'कल', offsetHours: 24 }
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  language,
  onReportSuccess,
  currentUser,
  onTrackCase
}) => {
  const [channel, setChannel] = useState<string>('Phone call');
  const [timePreset, setTimePreset] = useState<'now' | '1h' | 'yesterday'>('now');
  const [identifierType, setIdentifierType] = useState<IdentifierType>('phone');
  const [identifierValue, setIdentifierValue] = useState('');
  const [scamType, setScamType] = useState<string>('digital-arrest');
  const [areaPincode, setAreaPincode] = useState<string>('560102');
  const [note, setNote] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reporterQuota, setReporterQuota] = useState<{
    reporter_id: string;
    requests_today_count: number;
    max_requests_per_day: number;
    remaining_today: number;
    min_gap_seconds: number;
    next_allowed_seconds: number;
    status: string;
  } | null>(null);
  const [cooldownSec, setCooldownSec] = useState<number>(0);
  const [receipt, setReceipt] = useState<{
    report_id: string;
    case_id: string;
    merged: boolean;
    normalized_value: string;
    trust_score?: number;
    is_trusted_distinct?: boolean;
    collapse_reason?: string;
    reporter_quota?: {
      reporter_id: string;
      requests_today_count: number;
      max_requests_per_day: number;
      next_allowed_seconds: number;
    };
  } | null>(null);

  const activeReporterId = currentUser?.id || 'cit_web_guest';

  const fetchQuota = async () => {
    try {
      const res = await fetch(
        `/api/reporter-quota?reporter_id=${encodeURIComponent(activeReporterId)}`
      );
      if (res.ok) {
        const q = await res.json();
        setReporterQuota(q);
        setCooldownSec(q.next_allowed_seconds > 0 ? q.next_allowed_seconds : 0);
      }
    } catch {
      // ignore
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      fetchQuota();
    }
  }, [isOpen, activeReporterId]);

  React.useEffect(() => {
    if (cooldownSec <= 0) return;
    const t = setInterval(() => {
      setCooldownSec((prev) => {
        if (prev <= 1) {
          fetchQuota();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [cooldownSec]);

  if (!isOpen) return null;

  const isHi = language === 'hi';

  const handleSelectChannel = (ch: typeof VISUAL_CHANNELS[number]) => {
    setChannel(ch.id);
    setIdentifierType(ch.defaultType);
  };

  const handleResetQuota = async () => {
    try {
      const res = await fetch('/api/reporter-quota/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reporter_id: activeReporterId })
      });
      if (res.ok) {
        const q = await res.json();
        setReporterQuota(q);
        setCooldownSec(0);
        setErrorMsg(null);
        if (receipt) {
          setReceipt({
            ...receipt,
            reporter_quota: q
          });
        }
      }
    } catch {
      // ignore
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    const preset = TIME_PRESETS.find((p) => p.id === timePreset) || TIME_PRESETS[0];
    const occurredAt = new Date(Date.now() - preset.offsetHours * 3600 * 1000).toISOString();

    try {
      const res = await fetch('/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier_type: identifierType,
          identifier_value: identifierValue,
          scam_type: scamType,
          channel,
          pincode: areaPincode,
          area_pincode: areaPincode,
          occurred_at: occurredAt,
          note: note.trim(),
          reporter_id: activeReporterId,
          enforce_id_rate_limit: true
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to submit report');
        if (data.reporter_quota) {
          setReporterQuota(data.reporter_quota);
          if (data.reporter_quota.next_allowed_seconds > 0) {
            setCooldownSec(data.reporter_quota.next_allowed_seconds);
          }
        } else {
          fetchQuota();
        }
      } else {
        setReceipt(data);
        if (data.reporter_quota) {
          setReporterQuota(data.reporter_quota);
          setCooldownSec(
            data.reporter_quota.next_allowed_seconds > 0
              ? data.reporter_quota.next_allowed_seconds
              : 15
          );
        } else {
          setCooldownSec(15);
          fetchQuota();
        }
        onReportSuccess(data.report_id, data.case_id);
      }
    } catch {
      setErrorMsg('Network error submitting report');
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setReceipt(null);
    setErrorMsg(null);
    setIdentifierValue('');
    setNote('');
    onClose();
  };

  const startAnotherReport = () => {
    setReceipt(null);
    setErrorMsg(null);
    setIdentifierValue('');
    setNote('');
    fetchQuota();
  };

  const quotaUsed = Math.min(
    2,
    reporterQuota?.requests_today_count ?? receipt?.reporter_quota?.requests_today_count ?? 0
  );
  const quotaMax = reporterQuota?.max_requests_per_day ?? 2;
  const isQuotaExhausted = quotaUsed >= quotaMax;
  const timelineElapsed = Math.max(0, Math.min(15, 15 - cooldownSec));
  const timelinePercent = cooldownSec > 0 ? Math.round((timelineElapsed / 15) * 100) : 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#0D1322] border border-slate-800 rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl relative my-6">
        <button
          onClick={resetAndClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {receipt ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                HTTP 201 • {isHi ? 'रिपोर्ट दर्ज हो गई' : 'Incident Logged'}
              </span>
              <h3 className="text-xl font-extrabold text-white mt-2">
                {isHi ? 'स्कैम रिपोर्ट सुरक्षित रूप से दर्ज की गई' : 'Scam Report Recorded Safely'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {isHi
                  ? 'कोई भी व्यक्तिगत जानकारी (नाम या सटीक पता) सेव नहीं की गई है।'
                  : 'Zero personal data (PII) was stored. Only your neighborhood area was recorded.'}
              </p>
            </div>

            <div className="bg-[#070B14] border border-slate-800 rounded-xl p-4 text-left space-y-2.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Case ID:</span>
                <span className="text-emerald-400 font-bold">{receipt.case_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Report ID:</span>
                <span className="text-slate-200">{receipt.report_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Normalized Target:</span>
                <span className="text-slate-200">{receipt.normalized_value}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Trust Score Assigned:</span>
                <span
                  className={
                    (receipt.trust_score ?? 1) > 0
                      ? 'text-emerald-400 font-bold'
                      : 'text-amber-400 font-bold'
                  }
                >
                  {receipt.trust_score ?? 1.0}{' '}
                  {receipt.collapse_reason ? `(Blocked: ${receipt.collapse_reason})` : '(Verified)'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Same-ID Quota Today:</span>
                <span
                  className={`font-bold ${
                    isQuotaExhausted ? 'text-amber-300' : 'text-sky-300'
                  }`}
                >
                  {quotaUsed}/{quotaMax} requests used today
                  {isQuotaExhausted ? ' (Daily Max Reached)' : ` (${quotaMax - quotaUsed} remaining)`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Merged Status:</span>
                <span className="text-sky-400">
                  {receipt.merged ? 'true (Joined existing case)' : 'false (New case)'}
                </span>
              </div>

              {/* Live 15-Second Server Timeline Bar inside Receipt */}
              <div className="pt-2 mt-2 border-t border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300 font-bold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    15-Second Inter-Server Timeline ({activeReporterId}):
                  </span>
                  {cooldownSec > 0 ? (
                    <span className="text-amber-300 font-bold animate-pulse">
                      {cooldownSec}s cooldown remaining ({timelineElapsed}s / 15s)
                    </span>
                  ) : isQuotaExhausted ? (
                    <span className="text-red-400 font-bold">
                      15s Timeline Done • 2/2 Daily Limit Reached
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-bold">
                      15s Gap Complete (0s) • Ready for Request #{quotaUsed + 1}/2
                    </span>
                  )}
                </div>

                <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      cooldownSec > 0
                        ? 'bg-gradient-to-r from-amber-500 to-sky-400'
                        : isQuotaExhausted
                        ? 'bg-red-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${timelinePercent}%` }}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>0s (Sent)</span>
                  <span>5s</span>
                  <span>10s</span>
                  <span>15s (Server Sync Ready)</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              {onTrackCase && (
                <button
                  type="button"
                  onClick={() => {
                    const cid = receipt.case_id;
                    resetAndClose();
                    onTrackCase(cid);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileSearch className="w-4 h-4" />
                  {isHi ? 'केस ट्रैक करें' : `Track Case (${receipt.case_id})`}
                </button>
              )}

              <button
                type="button"
                onClick={startAnotherReport}
                disabled={cooldownSec > 0 || isQuotaExhausted}
                className="py-2.5 px-4 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 disabled:opacity-50 disabled:cursor-not-allowed text-sky-300 font-bold text-xs transition-colors cursor-pointer"
              >
                {cooldownSec > 0
                  ? `Wait ${cooldownSec}s (15s Gap)`
                  : isQuotaExhausted
                  ? '2/2 Daily Limit Reached'
                  : `+ Submit ${quotaUsed + 1}/2 Report`}
              </button>

              {(isQuotaExhausted || cooldownSec > 0) && (
                <button
                  type="button"
                  onClick={handleResetQuota}
                  className="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-[11px] transition-colors cursor-pointer"
                  title="Reset this ID's 2/day quota and 15s timer for testing"
                >
                  Reset Quota
                </button>
              )}

              <button
                type="button"
                onClick={resetAndClose}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors cursor-pointer"
              >
                {isHi ? 'बंद करें' : 'Done'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">
                    {isHi ? 'स्कैम रिपोर्ट करें (< 30 सेकंड)' : 'Report a Scam (< 30 Seconds)'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isHi
                      ? '100% गुमनाम • समान ID से प्रतिदिन अधिकतम 2 अनुरोध और 15 सेकंड का अंतराल'
                      : 'Max 2 requests/day & 15s gap between servers from the same ID'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono bg-[#070B14] border border-slate-800 px-2.5 py-1.5 rounded-xl shrink-0">
                <span className="text-slate-400">ID ({activeReporterId}):</span>
                <strong className={isQuotaExhausted ? 'text-red-400' : 'text-emerald-400'}>
                  {quotaUsed}/{quotaMax} today
                </strong>
                {cooldownSec > 0 && (
                  <span className="text-amber-300 ml-1">• {cooldownSec}s gap</span>
                )}
              </div>
            </div>

            {/* Live 15-Second Server Timeline & 2/Day Quota Banner on Form View */}
            <div className="mb-4 p-3 rounded-xl bg-[#070B14] border border-slate-800 space-y-1.5 font-mono">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  Same-ID Policy: {quotaUsed}/{quotaMax} Daily Quota • 15s Server Timeline
                </span>
                <div className="flex items-center gap-2">
                  {cooldownSec > 0 ? (
                    <span className="text-amber-300 font-bold animate-pulse">
                      Cooldown: {cooldownSec}s left ({timelineElapsed}s / 15s)
                    </span>
                  ) : isQuotaExhausted ? (
                    <span className="text-red-400 font-bold">
                      Daily Limit Reached (2/2 Used Today)
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-bold">
                      Ready ({quotaMax - quotaUsed}/2 Remaining Today)
                    </span>
                  )}
                  {(quotaUsed > 0 || cooldownSec > 0) && (
                    <button
                      type="button"
                      onClick={handleResetQuota}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] border border-slate-700 cursor-pointer"
                    >
                      Reset ID Quota
                    </button>
                  )}
                </div>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-500 ${
                    cooldownSec > 0
                      ? 'bg-gradient-to-r from-amber-500 to-sky-400'
                      : isQuotaExhausted
                      ? 'bg-red-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${timelinePercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>0s</span>
                <span>5s</span>
                <span>10s</span>
                <span>15s Inter-Server Gap</span>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-xs text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Step 1: 1-Tap Visual Icon Channel Grid */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  1. {isHi ? 'स्कैम कैसे आया? (आइकन चुनें)' : 'How did they contact you? (Tap icon)'}
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {VISUAL_CHANNELS.map((ch) => {
                    const Icon = ch.icon;
                    const active = channel === ch.id;
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => handleSelectChannel(ch)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all cursor-pointer ${
                          active
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                            : 'bg-[#070B14] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[10px] font-bold leading-tight">
                          {isHi ? ch.labelHi : ch.labelEn}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: 1-Tap Time Presets ("Just now", "1 hour ago", "Yesterday") */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#070B14] border border-slate-800 rounded-xl p-2.5">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 pl-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  2. {isHi ? 'कब हुआ?' : 'When did it happen?'}
                </span>
                <div className="flex items-center gap-1.5">
                  {TIME_PRESETS.map((tp) => (
                    <button
                      key={tp.id}
                      type="button"
                      onClick={() => setTimePreset(tp.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        timePreset === tp.id
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {isHi ? tp.labelHi : tp.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Paste Number / UPI / Link */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {isHi ? 'प्रकार (Type)' : 'Identifier Type'}
                  </label>
                  <select
                    value={identifierType}
                    onChange={(e) => setIdentifierType(e.target.value as IdentifierType)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#070B14] border border-slate-800 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="phone">{isHi ? 'फ़ोन (+91)' : 'Phone (+91)'}</option>
                    <option value="upi">{isHi ? 'UPI ID' : 'UPI ID'}</option>
                    <option value="url">{isHi ? 'वेबसाइट लिंक' : 'Website Link'}</option>
                    <option value="sender_id">{isHi ? 'SMS सेंडर (HDFCBK)' : 'SMS Sender ID'}</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    3. {isHi ? 'नंबर, UPI या लिंक पेस्ट करें' : 'Paste Scam Number, UPI ID, or Link'}
                  </label>
                  <input
                    type="text"
                    required
                    value={identifierValue}
                    onChange={(e) => setIdentifierValue(e.target.value)}
                    placeholder={
                      identifierType === 'phone'
                        ? '+91 98765 43210'
                        : identifierType === 'upi'
                        ? 'ravi12@okaxis'
                        : identifierType === 'url'
                        ? 'https://sbi-kyc.in/pay'
                        : 'VM-HDFCBK'
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070B14] border border-slate-800 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Step 4: Scam Category & Area (Never exact address) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    4. {isHi ? 'स्कैम का प्रकार' : 'What kind of scam?'}
                  </label>
                  <select
                    value={scamType}
                    onChange={(e) => setScamType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#070B14] border border-slate-800 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                  >
                    {SCAM_TYPES.map((st) => (
                      <option key={st.id} value={st.id}>
                        {isHi ? `${st.labelHi} (${st.id})` : `${st.label} (${st.id})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    5. {isHi ? 'आपका इलाका (केवल पिनकोड)' : 'Your Area (Never exact address)'}
                  </label>
                  <select
                    value={areaPincode}
                    onChange={(e) => setAreaPincode(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#070B14] border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  >
                    {Object.values(OFFICIAL_AREAS).map((a) => (
                      <option key={a.pincode} value={a.pincode}>
                        {a.area}, {a.city} ({a.pincode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Optional 1-line note in own words */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {isHi
                    ? 'संक्षिप्त विवरण (वैकल्पिक — अपने शब्दों में)'
                    : 'Short description in your own words (Optional)'}
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={
                    isHi
                      ? 'जैसे: पुलिस की वर्दी में वीडियो कॉल कर पैसे मांगे...'
                      : 'e.g. Video call from a man in police uniform demanding money...'
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-[#070B14] border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2 text-[11px] text-slate-400">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  {isHi
                    ? 'हम कभी भी आपका नाम, फ़ोन नंबर या घर का पता सेव नहीं करते हैं।'
                    : 'Privacy rule: We never store your name, phone number, or exact location.'}
                </span>
              </div>

              <div className="flex justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                >
                  {isHi ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting || !identifierValue.trim() || cooldownSec > 0 || isQuotaExhausted}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-extrabold text-xs transition-colors shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  {submitting
                    ? isHi
                      ? 'दर्ज हो रहा है...'
                      : 'Posting...'
                    : cooldownSec > 0
                    ? `15s Server Gap (${cooldownSec}s left)`
                    : isQuotaExhausted
                    ? '2/2 Daily Limit Reached'
                    : isHi
                    ? 'स्कैम रिपोर्ट पोस्ट करें'
                    : `Post Scam Report (${quotaUsed + 1}/${quotaMax})`}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
