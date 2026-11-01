/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  MapPin, 
  Users, 
  PhoneCall, 
  ExternalLink, 
  Copy, 
  Check, 
  ArrowRight, 
  Radio, 
  CheckCircle2, 
  AlertTriangle,
  FileCheck2,
  Lock,
  Building2,
  RefreshCw,
  Landmark,
  UserCheck
} from 'lucide-react';
import { Language } from '../translations';
import { UserAccount } from '../engine/userManager';

interface CaseStatusResponse {
  found: boolean;
  case_id?: string;
  identifier_type?: string;
  identifier_masked?: string;
  status?: 'KNOWN_SCAM' | 'CORROBORATED' | 'INVESTIGATING' | 'UNDER_REVIEW';
  status_label?: string;
  scam_types?: string[];
  total_reports?: number;
  distinct_reporters?: number;
  distinct_subnets?: number;
  cities_affected?: string[];
  pincodes_affected?: string[];
  total_amount_lost_inr?: number;
  is_cross_city?: boolean;
  created_at?: string;
  last_updated_at?: string;
  timeline?: Array<{
    stage: string;
    title: string;
    detail: string;
    status: 'completed' | 'in_progress' | 'queued';
    timestamp?: string;
  }>;
  official_actions?: {
    i4c_1930_status: string;
    dot_chakshu_status: string;
    bank_freeze_lien_eligible: boolean;
  };
  citizen_guidance?: {
    immediate_steps: string[];
    helplines: Array<{ name: string; contact: string; note: string }>;
  };
  error?: string;
}

interface CaseTrackerSectionProps {
  language: Language;
  initialQuery?: string;
  onOpenReport?: () => void;
  currentUser?: UserAccount | null;
  onOpenAuth?: () => void;
}

export const CaseTrackerSection: React.FC<CaseTrackerSectionProps> = ({
  language,
  initialQuery = '',
  onOpenReport,
  currentUser,
  onOpenAuth
}) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [caseData, setCaseData] = useState<CaseStatusResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);
  const [isFirModalOpen, setIsFirModalOpen] = useState(false);
  const [userCases, setUserCases] = useState<any[]>([]);

  const loadUserCases = async () => {
    if (!currentUser) {
      setUserCases([]);
      return;
    }
    try {
      const res = await fetch(`/api/user/cases/${encodeURIComponent(currentUser.id)}`);
      if (res.ok) {
        const data = await res.json();
        setUserCases(data.cases || []);
        // If user has cases and no search query was passed, auto-select their first case!
        if (data.cases?.length > 0 && !initialQuery) {
          fetchCase(data.cases[0].case_id);
        }
      }
    } catch {
      console.error('Failed to load user cases');
    }
  };

  useEffect(() => {
    loadUserCases();
  }, [currentUser]);

  const fetchCase = async (queryToFetch: string) => {
    const q = queryToFetch.trim();
    if (!q) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/cases?query=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok || !data.found) {
        setErrorMsg(data.error || `No active case found for "${q}". Please check the Case ID or reported phone number.`);
        setCaseData(null);
      } else {
        setCaseData(data);
      }
    } catch (err: any) {
      setErrorMsg('Failed to connect to tracking server. Please check connection.');
      setCaseData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      setSearchQuery(initialQuery);
      fetchCase(initialQuery);
    } else if (!currentUser) {
      // Default sample query for immediate demonstration
      fetchCase('+91 98765 22446');
    }
  }, [initialQuery]);

  const handleCopyReceipt = () => {
    if (!caseData || !caseData.case_id) return;
    const text = `[KavachSetu Case Reference Receipt]
Case ID: ${caseData.case_id}
Status: ${caseData.status_label}
Target: ${caseData.identifier_masked} (${caseData.identifier_type})
Independent Reports: ${caseData.distinct_reporters} citizen(s) across ${caseData.cities_affected?.join(', ')}
Total Loss Reported: ₹${(caseData.total_amount_lost_inr || 0).toLocaleString()}
Official Escalation: National Cyber Crime Portal (1930 / I4C) compliant dossier
Timestamp: ${new Date(caseData.last_updated_at || Date.now()).toLocaleString()}`;

    navigator.clipboard.writeText(text);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2500);
  };

  const sampleCases = [
    { label: '🌐 Cross-City (+91 98765 22446 - BLR & MAA)', query: '+91 98765 22446' },
    { label: '🚨 Digital Arrest (+91 98765 43210 - HSR Layout)', query: '+91 98765 43210' },
    { label: '⚖️ Business Dispute (freshbakes@okaxis)', query: 'freshbakes@okaxis' }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header Banner */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-3 uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Case Tracking & Transparency System</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
          {language === 'hi' ? 'रिपोर्ट के बाद क्या होता है? अपना केस ट्रैक करें' : 'What Happens After Reporting? Track Your Case'}
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          {language === 'hi' 
            ? 'अपनी रिपोर्ट की जांच प्रगति, अन्य नागरिकों की पुष्टि और 1930 साइबर सेल हैंडओवर की स्थिति देखें।' 
            : 'Track the automated verification lifecycle, multi-citizen corroboration, and 1930/LEA escalation status for any case.'}
        </p>
      </div>

      {/* Personalized Citizen Portfolio Banner (When logged in) */}
      {currentUser ? (
        <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/60 border border-emerald-800/80 rounded-2xl p-5 mb-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-500/50 flex items-center justify-center text-emerald-400 font-bold text-base shadow-xs">
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">
                    {currentUser.name}'s Incident Portfolio
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    LOGGED IN CITIZEN
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {currentUser.email} • {currentUser.organization}
                </p>
              </div>
            </div>

            <button
              onClick={onOpenReport}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer self-start sm:self-auto flex items-center gap-1.5 shadow-xs"
            >
              <span>+ File New Incident</span>
            </button>
          </div>

          {/* User's Reported Cases List */}
          <div className="mt-3">
            <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
              <span>Your Reported Incidents ({userCases.length})</span>
              <span className="text-[10px] text-slate-400">Click any incident to inspect live status</span>
            </div>

            {userCases.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {userCases.map((uc) => {
                  const isSelected = caseData?.case_id === uc.case_id;
                  return (
                    <button
                      key={uc.case_id}
                      onClick={() => {
                        setSearchQuery(uc.case_id);
                        fetchCase(uc.case_id);
                      }}
                      className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-800 border-emerald-500 ring-1 ring-emerald-500 shadow-sm'
                          : 'bg-slate-950/70 border-slate-800 hover:bg-slate-850 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-mono text-xs font-bold text-emerald-400">
                          {uc.case_id}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                          uc.status === 'KNOWN_SCAM'
                            ? 'bg-red-950/80 text-red-300 border border-red-800'
                            : 'bg-amber-950/80 text-amber-300 border border-amber-800'
                        }`}>
                          {uc.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-200 font-semibold truncate">
                        {uc.identifier_value}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center justify-between mt-1">
                        <span className="capitalize">{uc.scam_type?.replace('-', ' ')}</span>
                        {uc.amount_lost_inr > 0 && (
                          <span className="text-red-400 font-mono font-semibold">
                            ₹{uc.amount_lost_inr.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 text-center text-xs text-slate-400">
                You have not filed any scam complaints yet. Protect other citizens by reporting any suspicious calls, SMS, or QR codes.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/60 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-900/60 flex items-center justify-center text-indigo-400 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-indigo-200">
                Sign in as Citizen to view your Case Portfolio
              </div>
              <p className="text-[11px] text-indigo-300/80">
                Track status updates on your filed complaints, DoT Chakshu actions, and 1930 nodal escalation.
              </p>
            </div>
          </div>
          {onOpenAuth && (
            <button
              onClick={onOpenAuth}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors cursor-pointer shrink-0"
            >
              Log In as Citizen
            </button>
          )}
        </div>
      )}

      {/* Search Input Box */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md p-4 sm:p-5 mb-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchCase(searchQuery);
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'hi' ? 'केस आईडी (जैसे case_8f92ab10) या रिपोर्ट किया गया फोन / यूपीआई डालें...' : 'Enter Case ID (e.g. case_8f92ab10) or reported Phone / UPI...'}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !searchQuery.trim()}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs shrink-0"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>{language === 'hi' ? 'ट्रैक करें' : 'Track Status'}</span>
          </button>
        </form>

        {/* Quick sample chips */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60">
          <span className="text-[11px] font-semibold text-slate-400">Quick Test Cases:</span>
          {sampleCases.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setSearchQuery(sample.query);
                fetchCase(sample.query);
              }}
              className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
            <span>{errorMsg}</span>
          </div>
          {onOpenReport && (
            <button
              onClick={onOpenReport}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg shrink-0 cursor-pointer text-xs"
            >
              Report New Scam
            </button>
          )}
        </div>
      )}

      {/* Case Details Card */}
      {caseData && caseData.found && (
        <div className="space-y-6">
          {/* Main Status Header Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Live Case Record
                  </span>
                  <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {caseData.case_id}
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-mono font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                  {caseData.identifier_masked}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                  <span className="capitalize">{caseData.identifier_type} target</span>
                  <span>•</span>
                  <span>First reported: {new Date(caseData.created_at || '').toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex flex-col sm:items-end gap-1.5">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wide border shadow-xs ${
                  caseData.status === 'KNOWN_SCAM'
                    ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-300 dark:border-red-800'
                    : caseData.status === 'UNDER_REVIEW'
                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                    : caseData.status === 'CORROBORATED'
                    ? 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-800'
                    : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                }`}>
                  {caseData.status === 'KNOWN_SCAM' ? <ShieldAlert className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  <span>{caseData.status_label}</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  {caseData.is_cross_city ? 'Multi-State Cross-City Activity' : 'Local Area Cluster'}
                </span>
              </div>
            </div>

            {/* Transparency Metrics Grid (Answers "How Can We Know?") */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Distinct Citizens</span>
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {caseData.distinct_reporters}
                  <span className="text-xs font-normal text-slate-400 ml-1">({caseData.total_reports} reports)</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">Collusion-filtered</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold">
                  <Radio className="w-3.5 h-3.5 text-blue-600" />
                  <span>IP Subnets</span>
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {caseData.distinct_subnets}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">Separate ISP networks</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-purple-600" />
                  <span>Cities Affected</span>
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 truncate">
                  {caseData.cities_affected?.join(', ') || 'Local'}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {caseData.is_cross_city ? 'Inter-state Syndicate' : 'Single city'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold">
                  <Lock className="w-3.5 h-3.5 text-red-600" />
                  <span>Reported Loss</span>
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  ₹{(caseData.total_amount_lost_inr || 0).toLocaleString()}
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">1930 lien eligible</p>
              </div>
            </div>

            {/* LIFECYCLE AUDIT TRAIL (Answers "What Will They Do?") */}
            <div className="pt-5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Verification & Escalation Lifecycle (What happens to this report)</span>
              </h3>

              <div className="space-y-4 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {caseData.timeline?.map((event, idx) => (
                  <div key={idx} className="relative flex items-start gap-4 pl-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 z-10 ${
                      event.status === 'completed'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : event.status === 'in_progress'
                        ? 'bg-blue-600 text-white animate-pulse'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                    }`}>
                      {event.status === 'completed' ? '✓' : idx + 1}
                    </div>
                    <div className="flex-1 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 rounded-xl p-3.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-200">
                          {event.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(event.timestamp || '').toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                        {event.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Official Nodal Action Packet Card */}
            <div className="mt-6 p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider mb-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Nodal Law Enforcement & Telecom Carrier Status</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-blue-100 dark:border-blue-900/40">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">1930 / I4C Portal Dossier</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {caseData.official_actions?.i4c_1930_status}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Standardized evidence format ready for National Cybercrime Reporting Portal.
                  </p>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-blue-100 dark:border-blue-900/40">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">DoT Chakshu Carrier Takedown</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {caseData.official_actions?.dot_chakshu_status}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Queued for Sanchar Saathi carrier investigation (SIM / IMEI suspension).
                  </p>
                </div>
              </div>
            </div>

            {/* Actions & Next Steps */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href="tel:1930"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call 1930 Helpline</span>
                </a>
                <a
                  href="https://cybercrime.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <span>cybercrime.gov.in</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
                <button
                  type="button"
                  onClick={() => setIsFirModalOpen(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Generate Police FIR Draft (PDF)</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleCopyReceipt}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedReceipt ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedReceipt ? 'Receipt Copied!' : 'Copy Official Case Receipt'}</span>
              </button>
            </div>
          </div>

          {/* Golden Hour Emergency Bank Freeze Directory */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <Landmark className="w-4 h-4 text-amber-600" />
                <span>Golden Hour Bank Freeze Directory (Immediate Account Lien)</span>
              </h4>
              <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 font-bold">24x7 Nodal Desks</span>
            </div>
            <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 mb-3 leading-relaxed">
              If money left your account within the last 2-3 hours, contact your bank's fraud desk immediately after 1930 to freeze the beneficiary account:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40">
                <span className="font-bold text-slate-800 dark:text-slate-200 block font-sans">SBI (State Bank)</span>
                <a href="tel:18001234" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">1800 1234</a>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40">
                <span className="font-bold text-slate-800 dark:text-slate-200 block font-sans">HDFC Bank</span>
                <a href="tel:18001600" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">1800 1600</a>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40">
                <span className="font-bold text-slate-800 dark:text-slate-200 block font-sans">ICICI Bank</span>
                <a href="tel:18001080" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">1800 1080</a>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40">
                <span className="font-bold text-slate-800 dark:text-slate-200 block font-sans">Axis Bank</span>
                <a href="tel:18604195555" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">1860 419 5555</a>
              </div>
            </div>
          </div>

          {/* Citizen Guidance Summary Box */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs">
            <h4 className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Recommended Citizen Actions</span>
            </h4>
            <ul className="space-y-1.5 text-emerald-800 dark:text-emerald-300 list-disc list-inside">
              {caseData.citizen_guidance?.immediate_steps.map((step, idx) => (
                <li key={idx} className="leading-relaxed">
                  {step}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Official Legal FIR Draft Modal */}
      {isFirModalOpen && caseData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 my-8 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Official Cybercrime Police Complaint (FIR Draft)
                </h3>
              </div>
              <button
                onClick={() => setIsFirModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-[11px] space-y-3 text-slate-800 dark:text-slate-200 leading-relaxed max-h-[420px] overflow-y-auto select-all">
              <p className="font-bold">TO,<br />THE STATION HOUSE OFFICER (SHO) / INVESTIGATING OFFICER (IO),<br />CYBER CRIME POLICE STATION,<br />[DISTRICT / COMMISSIONERATE: {caseData.cities_affected?.[0]?.toUpperCase() || 'LOCAL'} POLICE]</p>
              
              <p><strong>SUBJECT:</strong> Formal Criminal Complaint under Section 66D Information Technology Act, 2000 & Section 318(4) Bharatiya Nyaya Sanhita (BNS) for Cyber Impersonation and Fraudulent Extortion.</p>

              <p><strong>RESPECTED SIR / MADAM,</strong></p>

              <p>I am lodging this formal complaint regarding an act of cyber fraud and financial extortion committed against me. The technical evidentiary telemetry recorded on the KavachSetu Citizen Fraud Radar is detailed below:</p>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                <div>• <strong>KavachSetu Case Dossier ID:</strong> {caseData.case_id}</div>
                <div>• <strong>Suspect Identifier ({caseData.identifier_type}):</strong> {caseData.identifier_masked}</div>
                <div>• <strong>Corroborating Victims:</strong> {caseData.distinct_reporters} independent citizen(s) across {caseData.cities_affected?.join(', ')}</div>
                <div>• <strong>Total Loss Claimed:</strong> ₹{(caseData.total_amount_lost_inr || 0).toLocaleString()}</div>
                <div>• <strong>Independent Subnet Verification:</strong> {caseData.distinct_subnets} separate ISP network(s) validated</div>
                <div>• <strong>Incident Classification:</strong> {caseData.scam_types?.join(', ').replace(/-/g, ' ')}</div>
              </div>

              <p><strong>PRAYER FOR RELIEF:</strong><br />
              1. Register a First Information Report (FIR) under Section 66D IT Act and Sections 318(4) / 319(2) BNS.<br />
              2. Immediately issue directions under Section 94 BNSS / Section 91 CrPC to the concerned Bank / Payment Gateway to place a formal debit freeze / lien on the recipient bank account / UPI VPA.<br />
              3. Request the Department of Telecommunications (DoT) under Chakshu protocol to deactivate the fraudulent SIM card and associated IMEI handset.</p>

              <p>Yours Faithfully,<br />[Victim Signature / Complainant]<br />Contact: [Your Mobile Number]<br />Aadhaar / ID: [Attached Copy]</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-slate-500">
                Ready to print, sign, and submit at your local cyber cell or attach to <strong>cybercrime.gov.in</strong>.
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  Print Letter
                </button>
                <button
                  onClick={() => {
                    const text = `TO,\nTHE STATION HOUSE OFFICER (SHO),\nCYBER CRIME POLICE STATION\n\nSUBJECT: Complaint under Section 66D IT Act & Section 318(4) BNS\nCase Dossier ID: ${caseData.case_id}\nSuspect: ${caseData.identifier_masked} (${caseData.identifier_type})\nReported Loss: INR ${(caseData.total_amount_lost_inr || 0).toLocaleString()}\nAffected Cities: ${caseData.cities_affected?.join(', ')}\nCorroborated by ${caseData.distinct_reporters} independent citizen(s).\n\nPlease initiate Section 94 BNSS bank debit freeze and DoT Chakshu SIM block.`;
                    navigator.clipboard.writeText(text);
                    setCopiedReceipt(true);
                    setTimeout(() => setCopiedReceipt(false), 2500);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer"
                >
                  {copiedReceipt ? 'Copied FIR Draft!' : 'Copy Text'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
