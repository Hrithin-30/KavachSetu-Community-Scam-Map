import React, { useState } from 'react';
import { AlertOctagon, Key, RefreshCw, Trash2 } from 'lucide-react';

interface LicenseExpiredBannerProps {
  onOpenLicenseModal: () => void;
  onRefreshStatus: () => void;
}

export const LicenseExpiredBanner: React.FC<LicenseExpiredBannerProps> = ({
  onOpenLicenseModal,
  onRefreshStatus
}) => {
  const [deletedMsg, setDeletedMsg] = useState<string | null>(null);

  const handleDeleteLicense = async () => {
    try {
      const res = await fetch('/license/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        setDeletedMsg('Licence deleted (Won’t Renew confirmed). Status: REVOKED.');
        onRefreshStatus();
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="bg-red-950/90 border-b border-red-500/40 px-4 py-3.5 text-red-200">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/40 shrink-0">
            <AlertOctagon className="w-5 h-5 text-red-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-red-500 text-slate-950">
                403 • LICENSE_EXPIRED
              </span>
              <span className="text-sm font-extrabold text-white">
                Licence expired. Contact your provider.
              </span>
            </div>
            <p className="text-xs text-red-300/90 mt-0.5">
              {deletedMsg || (
                <>
                  Every request except <code className="font-mono">/health</code> and{' '}
                  <code className="font-mono">/license</code> now replies{' '}
                  <code className="font-mono">403 {`{"error": "LICENSE_EXPIRED"}`}</code>. Request a renewal (max 2/day, 15s server gap) or delete the licence if not renewing.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={onRefreshStatus}
            className="px-3 py-1.5 rounded-lg bg-red-900/60 hover:bg-red-900 border border-red-700/60 text-xs font-semibold text-red-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Recheck Status
          </button>
          <button
            onClick={handleDeleteLicense}
            className="px-3 py-1.5 rounded-lg bg-red-950 hover:bg-red-900 border border-red-700 text-xs font-bold text-red-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            Won&apos;t Renew (Delete Licence)
          </button>
          <button
            onClick={onOpenLicenseModal}
            className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <Key className="w-3.5 h-3.5" />
            Request Renewal / Upload Licence
          </button>
        </div>
      </div>
    </div>
  );
};
