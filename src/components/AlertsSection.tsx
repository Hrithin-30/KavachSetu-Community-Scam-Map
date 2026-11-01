/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Bell, Flame, Sparkles, CheckCircle2 } from 'lucide-react';
import { OFFICIAL_AREAS } from '../engine/normalizer';
import { Language } from '../translations';

interface AlertItem {
  type: 'SPIKE' | 'NEW_TYPE';
  pincode: string;
  window: string;
  count?: number;
  baseline_per_day?: number;
  scam_type?: string;
}

interface AlertsSectionProps {
  language: Language;
  preselectedPincode?: string;
  onAskAi: (prompt: string, context?: any) => void;
}

export const AlertsSection: React.FC<AlertsSectionProps> = ({
  preselectedPincode,
  onAskAi
}) => {
  const [selectedPincode, setSelectedPincode] = useState<string>(preselectedPincode || '560102');
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [blockedFake24h, setBlockedFake24h] = useState<number>(0);
  const [rawReports24h, setRawReports24h] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAlerts = async (pincode: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/alerts?pincode=${pincode}`);
      const data = await res.json();
      setAlerts(data.alerts || []);
      setBlockedFake24h(data.blocked_fake_reports_24h || 0);
      setRawReports24h(data.raw_reports_24h || 0);
    } catch (err) {
      console.error('Failed to load alerts', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts(selectedPincode);
  }, [selectedPincode]);

  const currentArea = OFFICIAL_AREAS[selectedPincode] || {
    pincode: selectedPincode,
    area: 'Area',
    city: 'City',
    lat: 12.9116,
    lng: 77.6473
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Title */}
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight flex items-center justify-center gap-2.5">
          <Bell className="w-7 h-7 text-amber-500" />
          <span>Neighborhood Scam Anomaly Alerts</span>
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          Intelligent statistical triggers: alerts fire ONLY when an unusual surge (2x baseline) or a brand new scam vector is detected.
        </p>
      </div>

      {/* Pincode / Area Selector Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 mb-6">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2">
          Select Neighborhood to Monitor
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={selectedPincode}
            onChange={(e) => setSelectedPincode(e.target.value)}
            className="flex-1 px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold"
          >
            {Object.values(OFFICIAL_AREAS).map((area) => (
              <option key={area.pincode} value={area.pincode}>
                {area.area}, {area.city} ({area.pincode})
              </option>
            ))}
          </select>
        </div>

        {blockedFake24h > 0 && (
          <div className="mt-3 p-3 rounded-xl bg-purple-950/40 border border-purple-500/40 text-xs text-purple-200 flex items-center justify-between gap-2">
            <span>
              <strong>Anti-Spoofing Shield Active in PIN {selectedPincode}:</strong> {blockedFake24h} fake/Sybil reports out of {rawReports24h} raw reports in the last 24h were neutralized (<code className="font-mono">trust_score = 0.0</code>) and blocked from triggering a false SPIKE alert.
            </span>
          </div>
        )}
      </div>

      {/* Alerts Feed */}
      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400 font-mono">
          Evaluating statistical baselines for {currentArea.area}...
        </div>
      ) : alerts.length > 0 ? (
        <div className="space-y-4">
          {alerts.map((alert, idx) => (
            <div
              key={idx}
              className={`rounded-2xl border p-5 shadow-sm transition-all ${
                alert.type === 'SPIKE'
                  ? 'border-red-300 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/20'
                  : 'border-amber-300 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2.5 rounded-xl text-white shrink-0 shadow-xs ${
                      alert.type === 'SPIKE' ? 'bg-red-600' : 'bg-amber-500'
                    }`}
                  >
                    {alert.type === 'SPIKE' ? (
                      <Flame className="w-6 h-6" />
                    ) : (
                      <Sparkles className="w-6 h-6" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        {currentArea.area}, {currentArea.city}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono text-white ${
                          alert.type === 'SPIKE' ? 'bg-red-600' : 'bg-amber-600'
                        }`}
                      >
                        {alert.type} TRIGGERED
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                      {alert.type === 'SPIKE'
                        ? `Scam Reports in ${currentArea.area} Surged Suddenly Today`
                        : `Novel Scam Vector Detected: ${alert.scam_type?.replace(/-/g, ' ')}`}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                      {alert.type === 'SPIKE'
                        ? `${alert.count} confirmed reports within the last 24h (over 2x the 7-day daily baseline of ${alert.baseline_per_day}). Coordinated campaign in progress.`
                        : `This scam category was not recorded in ${currentArea.area} in the last 30 days. Citizen alert broadcasted.`}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() =>
                    onAskAi(
                      `An alert was triggered for ${currentArea.area}: ${alert.type}. How can residents protect their families?`,
                      alert
                    )
                  }
                  className="px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-2xs"
                >
                  Generate Safety Advisory
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            No Anomaly Spikes in {currentArea.area}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Report volume is within normal statistical baseline. The system will alert automatically if reports double or an unseen scam pattern strikes.
          </p>
        </div>
      )}

      {/* Rules Explainer */}
      <div className="mt-8 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
        <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-1">
          Brief Anomaly Criteria:
        </h4>
        <ul className="list-disc pl-4 space-y-1">
          <li><strong>SPIKE:</strong> Reports in last 24h &ge; double the 7-day daily baseline and at least 5.</li>
          <li><strong>NEW_TYPE:</strong> A scam type reported in last 24h that was not seen in that area in the previous 30 days.</li>
          <li><strong>Anti-Spam Immunity:</strong> Fake reports discarded by trust rules do NOT trigger alerts.</li>
        </ul>
      </div>
    </div>
  );
};
