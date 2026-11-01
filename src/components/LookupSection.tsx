import React, { useState } from 'react';
import {
  Phone,
  CreditCard,
  Link2,
  MessageSquare,
  Search,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  CheckCircle2,
  Clock,
  Globe,
  Cpu,
  Filter,
  Scale,
  ArrowRight,
  FileSearch
} from 'lucide-react';
import { Language, TRANSLATIONS } from '../translations';
import { IdentifierType } from '../engine/normalizer';
import { LookupResult } from '../engine/trustEngine';
import { ZoneCrimeGrowthGraph } from './ZoneCrimeGrowthGraph';

interface LookupSectionProps {
  language: Language;
  onOpenReport: () => void;
  onAskAi: (prompt: string, context?: any) => void;
  onOpenDispute: () => void;
  onTrackCase: (caseId: string) => void;
}

const QUICK_TESTS: Array<{
  label: string;
  type: IdentifierType;
  value: string;
  isCrossCity?: boolean;
}> = [
  {
    label: 'Cross-City (+91 98765 22446 BLR & MAA)',
    type: 'phone',
    value: '+91 98765 22446',
    isCrossCity: true
  },
  {
    label: '+91 98765 43210 (Digital Arrest)',
    type: 'phone',
    value: '+91 98765 43210'
  },
  {
    label: '1930 (Cybercrime Helpline)',
    type: 'phone',
    value: '1930'
  },
  {
    label: '1800 1234 (SBI Care)',
    type: 'phone',
    value: '1800 1234'
  },
  {
    label: 'freshbakes@okaxis (Bakery)',
    type: 'upi',
    value: 'freshbakes@okaxis'
  },
  {
    label: 'VM-HDFCBK (Bank SMS)',
    type: 'sender_id',
    value: 'VM-HDFCBK'
  },
  {
    label: 'sbi-kyc-update.in/verify (Phish)',
    type: 'url',
    value: 'sbi-kyc-update.in/verify'
  }
];

export const LookupSection: React.FC<LookupSectionProps> = ({
  language,
  onAskAi,
  onOpenDispute,
  onTrackCase
}) => {
  const t = TRANSLATIONS[language];
  const [selectedType, setSelectedType] = useState<IdentifierType>('phone');
  const [queryValue, setQueryValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [responseTimeMs, setResponseTimeMs] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<LookupResult | null>(null);

  const executeLookup = async (typeToUse: IdentifierType, valToUse: string) => {
    const trimmed = valToUse.trim();
    if (!trimmed) return;

    setLoading(true);
    setErrorMsg(null);
    const start = performance.now();

    try {
      const res = await fetch(
        `/lookup?type=${encodeURIComponent(typeToUse)}&value=${encodeURIComponent(trimmed)}`
      );
      const elapsed = Math.max(1, Math.round(performance.now() - start));
      setResponseTimeMs(elapsed);

      const data = await res.json();
      if (!res.ok) {
        setResult(null);
        setErrorMsg(data.error || 'Invalid lookup value');
      } else {
        setResult(data);
      }
    } catch {
      setErrorMsg('Network error while contacting Trust Engine');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeLookup(selectedType, queryValue);
  };

  const handleQuickTest = (item: typeof QUICK_TESTS[number]) => {
    setSelectedType(item.type);
    setQueryValue(item.value);
    executeLookup(item.type, item.value);
  };

  const placeholderText =
    selectedType === 'phone'
      ? t.placeholderPhone
      : selectedType === 'upi'
      ? t.placeholderUpi
      : selectedType === 'url'
      ? t.placeholderUrl
      : t.placeholderSender;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Heading */}
      <div className="text-center mb-8 mt-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2.5">
          {t.heroTitle}
        </h1>
        <p className="text-slate-400 text-sm sm:text-base">{t.heroSubtitle}</p>
      </div>

      {/* Main Search Card */}
      <div className="bg-[#0D1322] border border-slate-800/90 rounded-2xl p-5 sm:p-6 shadow-2xl">
        {/* Identifier Type Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button
            type="button"
            onClick={() => setSelectedType('phone')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
              selectedType === 'phone'
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            {t.tabPhone}
          </button>

          <button
            type="button"
            onClick={() => setSelectedType('upi')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
              selectedType === 'upi'
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            {t.tabUpi}
          </button>

          <button
            type="button"
            onClick={() => setSelectedType('url')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
              selectedType === 'url'
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            {t.tabUrl}
          </button>

          <button
            type="button"
            onClick={() => setSelectedType('sender_id')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
              selectedType === 'sender_id'
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            {t.tabSender}
          </button>
        </div>

        {/* Search Input Bar */}
        <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={queryValue}
              onChange={(e) => setQueryValue(e.target.value)}
              placeholder={placeholderText}
              className="w-full pl-10 pr-4 py-3 bg-[#070B14] border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !queryValue.trim()}
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm transition-colors shrink-0 cursor-pointer"
          >
            {loading ? 'Checking...' : t.btnCheckNow}
          </button>
        </form>

        {/* Quick Test Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-400 mr-1">{t.quickTestLabel}</span>
          {QUICK_TESTS.map((qt) => (
            <button
              key={qt.label}
              type="button"
              onClick={() => handleQuickTest(qt)}
              className="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/70 text-[11px] font-mono text-slate-300 flex items-center gap-1 transition-colors"
            >
              {qt.isCrossCity && <Globe className="w-3 h-3 text-sky-400 shrink-0" />}
              <span>{qt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Response Time Badge */}
      {responseTimeMs !== null && (
        <div className="flex justify-end mt-2.5 mb-2">
          <span className="text-xs font-mono text-slate-400">
            Response time: <strong className="text-emerald-400">{responseTimeMs}ms</strong> (Brief requirement: &lt;500ms)
          </span>
        </div>
      )}

      {/* Friendly Validation Error State */}
      {errorMsg && (
        <div className="mt-4 bg-red-950/30 border border-red-500/40 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-red-300">{errorMsg}</h4>
              <p className="text-xs text-red-200/80 mt-1">
                Tip: Our normalizer strictly validates Indian 10-digit mobile numbers (+91), valid UPI handles (user@bank), URLs, and 6-char SMS Sender IDs to reject junk inputs.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              handleQuickTest({
                label: '+91 98765 43210 (Digital Arrest)',
                type: 'phone',
                value: '+91 98765 43210'
              })
            }
            className="px-3.5 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 text-xs font-bold shrink-0 transition-colors"
          >
            Test Real Scam (+91 98765...)
          </button>
        </div>
      )}

      {/* Verdict Card */}
      {result && (
        <div className="mt-4 space-y-4">
          <div
            className={`rounded-2xl p-6 border shadow-xl ${
              result.verdict === 'KNOWN_SCAM'
                ? 'bg-red-950/25 border-red-500/40'
                : result.verdict === 'SUSPICIOUS'
                ? 'bg-amber-950/25 border-amber-500/40'
                : result.verdict === 'VERIFIED_BUSINESS'
                ? 'bg-emerald-950/25 border-emerald-500/40'
                : 'bg-slate-900/60 border-slate-800'
            }`}
          >
            {/* Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800/80">
              <div className="flex items-start gap-3.5">
                <div
                  className={`p-3 rounded-xl border shrink-0 ${
                    result.verdict === 'KNOWN_SCAM'
                      ? 'bg-red-500/15 border-red-500/30 text-red-400'
                      : result.verdict === 'SUSPICIOUS'
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                      : result.verdict === 'VERIFIED_BUSINESS'
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  {result.verdict === 'KNOWN_SCAM' ? (
                    <ShieldAlert className="w-6 h-6" />
                  ) : result.verdict === 'VERIFIED_BUSINESS' ? (
                    <ShieldCheck className="w-6 h-6" />
                  ) : (
                    <AlertTriangle className="w-6 h-6" />
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        result.verdict === 'KNOWN_SCAM'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : result.verdict === 'SUSPICIOUS'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : result.verdict === 'VERIFIED_BUSINESS'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {result.verdict === 'KNOWN_SCAM'
                        ? `High Risk Alert • ${t.verdictKnownScam}`
                        : result.verdict === 'SUSPICIOUS'
                        ? `Caution • ${t.verdictSuspicious}`
                        : result.verdict === 'VERIFIED_BUSINESS'
                        ? `Protected • ${t.verdictVerified}`
                        : `Clear • ${t.verdictNoReports}`}
                    </span>

                    {result.challenged && (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                        <Scale className="w-3 h-3" />
                        Under Business Dispute Review
                      </span>
                    )}
                  </div>

                  <h2 className="text-xl sm:text-2xl font-mono font-extrabold text-white mt-1.5">
                    {result.display_value}
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-300 mt-1">
                    {result.verdict === 'VERIFIED_BUSINESS' ? (
                      <>
                        Official allowlisted identifier for{' '}
                        <strong className="text-emerald-400">
                          {result.verified_entity?.name || 'Verified Organization'}
                        </strong>{' '}
                        ({result.verified_entity?.category}). Immune to false-flagging.
                      </>
                    ) : result.distinct_reporters > 0 ? (
                      <>
                        Reported by{' '}
                        <strong className="text-white">{result.distinct_reporters}</strong> distinct
                        people near you ({result.report_count} total reports).
                        {result.distinct_reporters < 3 &&
                          ' Identifier remains masked until confirmed by at least 3 independent citizens.'}
                      </>
                    ) : (
                      'No verified scam reports found for this identifier in our community database.'
                    )}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    onAskAi(
                      `Analyze this ${result.identifier_type} identifier (${result.display_value}) with verdict ${result.verdict} and primary scam pattern "${result.scam_type || 'none'}". Give me a 3-step citizen safety check.`,
                      result
                    )
                  }
                  className="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Explain Pattern with AI
                </button>

                {result.case_id && (
                  <button
                    type="button"
                    onClick={() => onTrackCase(result.case_id!)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <FileSearch className="w-3.5 h-3.5 text-sky-400" />
                    View Case ({result.case_id})
                  </button>
                )}
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
                <div className="text-[11px] text-slate-400 uppercase font-semibold">
                  Distinct Reporters
                </div>
                <div className="text-lg font-extrabold text-white mt-0.5 font-mono">
                  {result.distinct_reporters}{' '}
                  <span className="text-xs font-normal text-slate-400">
                    ({result.report_count} raw)
                  </span>
                </div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
                <div className="text-[11px] text-slate-400 uppercase font-semibold">
                  Primary Scam Pattern
                </div>
                <div className="text-sm font-bold text-emerald-400 mt-1 truncate">
                  {result.scam_type ? result.scam_type.replace(/-/g, ' ').toUpperCase() : 'N/A'}
                </div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
                <div className="text-[11px] text-slate-400 uppercase font-semibold">First Seen</div>
                <div className="text-xs font-mono text-slate-200 mt-1">
                  {result.first_seen ? new Date(result.first_seen).toLocaleString() : '—'}
                </div>
              </div>

              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
                <div className="text-[11px] text-slate-400 uppercase font-semibold">Last Seen</div>
                <div className="text-xs font-mono text-slate-200 mt-1">
                  {result.last_seen ? new Date(result.last_seen).toLocaleString() : '—'}
                </div>
              </div>
            </div>

            {/* Anti-Spoofing Telemetry Strip */}
            <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Cpu className="w-4 h-4 text-sky-400 shrink-0" />
                <span>
                  <strong>Subnet /24 Isolation:</strong>{' '}
                  {result.anti_spoofing_telemetry.distinct_subnets} independent network(s)
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Filter className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Sybil Burst Filter:</strong>{' '}
                  {result.anti_spoofing_telemetry.collapsed_bursts} duplicate(s) collapsed
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Confidence Score:</strong>{' '}
                  {result.anti_spoofing_telemetry.confidence_score}% (
                  {result.anti_spoofing_telemetry.cities_affected.join(', ') || 'No active cities'})
                </span>
              </div>
            </div>

            {/* Recent Incident Evidence Table */}
            {result.evidence && result.evidence.length > 0 && (
              <div className="mt-5 pt-4 border-t border-slate-800/80">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    Recent Incident Evidence (Zero-PII Sanitized)
                  </h3>
                  <button
                    type="button"
                    onClick={onOpenDispute}
                    className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                  >
                    Own this business number? File Dispute <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-800/90 bg-slate-950/70">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60">
                        <th className="py-2.5 px-3 font-semibold">Case ID</th>
                        <th className="py-2.5 px-3 font-semibold">Scam Type</th>
                        <th className="py-2.5 px-3 font-semibold">Channel</th>
                        <th className="py-2.5 px-3 font-semibold">Postal Area (PIN)</th>
                        <th className="py-2.5 px-3 font-semibold">Occurred At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {result.evidence.map((ev) => (
                        <tr key={ev.report_id} className="hover:bg-slate-900/40">
                          <td className="py-2 px-3 font-mono text-emerald-400 font-semibold">
                            <button
                              type="button"
                              onClick={() => onTrackCase(ev.case_id)}
                              className="hover:underline"
                            >
                              {ev.case_id}
                            </button>
                          </td>
                          <td className="py-2 px-3 text-slate-200">{ev.scam_type}</td>
                          <td className="py-2 px-3 font-mono text-slate-300">{ev.channel}</td>
                          <td className="py-2 px-3 text-slate-300">
                            {ev.area_name}, {ev.city} ({ev.area_pincode})
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-400">
                            {new Date(ev.occurred_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Point-Arrow Crime Growth Graph by Zone Origin */}
      <div className="mt-6">
        <ZoneCrimeGrowthGraph
          compact
          onInspectTarget={(type, val) => {
            setSelectedType(type);
            setQueryValue(val);
            executeLookup(type, val);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>

      {/* Privacy Guarantee Footer Box */}
      <div className="mt-6 bg-[#0D1322]/90 border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-400 leading-relaxed">
          <strong className="text-slate-200">{t.privacyGuaranteeTitle}</strong>{' '}
          {t.privacyGuaranteeText}
        </p>
      </div>
    </div>
  );
};
