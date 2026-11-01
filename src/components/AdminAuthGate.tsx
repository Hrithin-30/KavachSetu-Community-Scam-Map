import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, ArrowLeft, KeyRound, AlertTriangle } from 'lucide-react';
import { AdminPortal } from './AdminPortal';

interface AdminAuthGateProps {
  onBackToUserSite: () => void;
  onRefreshLicense: () => void;
}

export const AdminAuthGate: React.FC<AdminAuthGateProps> = ({
  onBackToUserSite,
  onRefreshLicense
}) => {
  const [authToken, setAuthToken] = useState<string | null>(() =>
    sessionStorage.getItem('kavach_admin_token')
  );
  const [officerProfile, setOfficerProfile] = useState<any>(() => {
    const raw = sessionStorage.getItem('kavach_admin_officer');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });

  const [officerId, setOfficerId] = useState('officer@kavachsetu.gov.in');
  const [passkey, setPasskey] = useState('KAVACH-ADMIN-SECURE-2026');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!authToken) return;
    fetch('/api/admin/auth/session', {
      headers: { Authorization: `Bearer ${authToken}` }
    })
      .then((res) => {
        if (!res.ok) {
          sessionStorage.removeItem('kavach_admin_token');
          sessionStorage.removeItem('kavach_admin_officer');
          setAuthToken(null);
          setOfficerProfile(null);
        }
      })
      .catch(() => {
        // ignore network check failure
      });
  }, [authToken]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ officerId, passkey })
      });
      const data = await res.json();
      if (!res.ok || !data.authenticated) {
        setError(data.message || 'Authentication failed');
      } else {
        sessionStorage.setItem('kavach_admin_token', data.token);
        sessionStorage.setItem('kavach_admin_officer', JSON.stringify(data.officer));
        setAuthToken(data.token);
        setOfficerProfile(data.officer);
      }
    } catch {
      setError('Failed to reach authentication gateway');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (authToken) {
      try {
        await fetch('/api/admin/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` }
        });
      } catch {
        // ignore
      }
    }
    sessionStorage.removeItem('kavach_admin_token');
    sessionStorage.removeItem('kavach_admin_officer');
    setAuthToken(null);
    setOfficerProfile(null);
  };

  if (authToken) {
    return (
      <AdminPortal
        authToken={authToken}
        officerProfile={officerProfile}
        onBackToUserSite={onBackToUserSite}
        onRefreshLicense={onRefreshLicense}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white">KavachSetu Admin Portal</h1>
              <p className="text-xs text-slate-400">Administrator Login &amp; Security Control Panel</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onBackToUserSite}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Citizen Portal</span>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Admin Email / ID
            </label>
            <input
              type="email"
              value={officerId}
              onChange={(e) => setOfficerId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Admin Passkey
            </label>
            <input
              type="password"
              value={passkey}
              onChange={(e) => setPasskey(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Signing In...' : 'Sign In to Admin Portal'}</span>
          </button>
        </form>

        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5 text-[11px] text-slate-400">
          <div className="font-bold text-slate-300 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>Pre-Loaded Admin Demo Credentials</span>
          </div>
          <div className="font-mono text-[11px] text-slate-300">
            Admin ID: <span className="text-indigo-300">officer@kavachsetu.gov.in</span>
          </div>
          <div className="font-mono text-[11px] text-slate-300">
            Passkey: <span className="text-emerald-300">KAVACH-ADMIN-SECURE-2026</span>
          </div>
        </div>
      </div>
    </div>
  );
};
