/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Mail, 
  Key, 
  MapPin, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  ShieldAlert, 
  UserPlus, 
  LogIn, 
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { UserAccount } from '../engine/userManager';
import { StarfallBackground } from './StarfallBackground';

interface CitizenAuthGateProps {
  onLoginSuccess: (user: UserAccount) => void;
  onSwitchToAdmin: () => void;
  onContinueAsGuest: () => void;
}

export const CitizenAuthGate: React.FC<CitizenAuthGateProps> = ({
  onLoginSuccess,
  onSwitchToAdmin,
  onContinueAsGuest
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');

  // Form states
  const [email, setEmail] = useState('rahul.sharma88@gmail.com');
  const [password, setPassword] = useState('citizen123');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityPin, setSecurityPin] = useState('9104');

  // Auto-fill users list
  const [citizenList, setCitizenList] = useState<UserAccount[]>([]);
  const [selectedAutoFillIndex, setSelectedAutoFillIndex] = useState<number>(0);

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch registered citizen list for the auto-fill indicator
  const loadCitizenList = async () => {
    try {
      const res = await fetch('/api/user/citizen-list');
      if (res.ok) {
        const data = await res.json();
        setCitizenList(data.citizens || []);
      }
    } catch {
      // Fallback defaults if offline
      setCitizenList([
        {
          id: 'usr_cit_04',
          name: 'Rahul Sharma',
          email: 'rahul.sharma88@gmail.com',
          role: 'CITIZEN',
          organization: 'Bengaluru Citizen',
          status: 'ACTIVE',
          reports_filed: 3,
          created_at: '2026-03-01T10:15:00.000Z',
          last_active: new Date().toISOString(),
          permissions: ['search_intel', 'report_scam', 'track_case'],
          password: 'citizen123'
        },
        {
          id: 'usr_cit_05',
          name: 'Neha Verma',
          email: 'neha.verma@outlook.com',
          role: 'CITIZEN',
          organization: 'Mumbai Citizen',
          status: 'ACTIVE',
          reports_filed: 1,
          created_at: '2026-03-12T16:00:00.000Z',
          last_active: new Date().toISOString(),
          permissions: ['search_intel', 'report_scam', 'track_case'],
          password: 'citizen123'
        },
        {
          id: 'usr_bot_06',
          name: 'Automated Web Scraper',
          email: 'bot_scam_feed@proxymail.top',
          role: 'CITIZEN',
          organization: 'Unverified IP Pool /24',
          status: 'SUSPENDED',
          reports_filed: 48,
          created_at: '2026-04-01T02:00:00.000Z',
          last_active: new Date().toISOString(),
          permissions: [],
          password: 'citizen123'
        }
      ]);
    }
  };

  useEffect(() => {
    loadCitizenList();
  }, []);

  const handleSelectAutoFill = (user: UserAccount, index: number) => {
    setSelectedAutoFillIndex(index);
    setEmail(user.email);
    setPassword(user.password || 'citizen123');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'SUSPENDED' || res.status === 403) {
          setErrorMessage(data.error || 'LOGIN DENIED: Account Suspended. Your access has been locked by the Cyber Crime Authority. Contact the Admin or have an Administrator reactivate your account in the Admin Authority console.');
        } else {
          setErrorMessage(data.error || 'Login failed. Please check credentials.');
        }
        return;
      }

      // Success
      onLoginSuccess(data.user);
    } catch (err: any) {
      setErrorMessage('Network connection error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setErrorMessage('All fields are required.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          city: city.trim() || 'Bengaluru'
        })
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Registration failed.');
        return;
      }

      onLoginSuccess(data.user);
    } catch (err: any) {
      setErrorMessage('Network connection error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !newPassword) {
      setErrorMessage('Email and new password are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/user/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          newPassword
        })
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Password reset failed.');
        return;
      }

      setSuccessMessage('Password successfully updated! You can now log in.');
      setPassword(newPassword);
      setAuthMode('login');
    } catch (err: any) {
      setErrorMessage('Error resetting password: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white relative overflow-hidden">
      <StarfallBackground />
      {/* Top Bar with Admin Login at Corner */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 sm:px-8 py-3.5 sticky top-0 z-30 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold tracking-tight text-emerald-400 text-lg">
              KavachSetu
            </span>
            <span className="text-slate-500 text-xs hidden sm:inline">|</span>
            <span className="text-slate-400 text-xs hidden sm:inline">
              Citizen Scam Protection Portal
            </span>
          </div>

          {/* Option: Login Admin at corner */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onContinueAsGuest}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer px-2 py-1"
            >
              Continue as Guest
            </button>
            <button
              onClick={onSwitchToAdmin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-300 bg-rose-950/70 border border-rose-800 hover:bg-rose-900/80 hover:text-white transition-colors cursor-pointer shadow-xs"
              title="Official Law Enforcement & Admin Authority Console (IT Act Gated)"
            >
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              <span>Officer / Admin Login</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Authentication Flow Area (Very First Phase) */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="max-w-md w-full bg-slate-900/95 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden">
          {/* Subtle Ambient Background Accents */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header Title */}
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 shadow-inner mb-3">
              <User className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              {authMode === 'login' && 'Citizen Account Log In'}
              {authMode === 'register' && 'Create Citizen Account'}
              {authMode === 'forgot' && 'Reset Citizen Password'}
            </h1>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {authMode === 'login' && 'Sign in to access your personalized incident reports & live case tracking.'}
              {authMode === 'register' && 'Register your verified citizen identity to file reports and track active investigations.'}
              {authMode === 'forgot' && 'Forgot password flow strictly for registered citizen users.'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 mb-6 text-xs font-semibold">
            <button
              onClick={() => {
                setAuthMode('login');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                authMode === 'login'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Log In</span>
            </button>
            <button
              onClick={() => {
                setAuthMode('register');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                authMode === 'register'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>

          {/* Quick Auto-Fill Citizen Accounts with Option Indicator */}
          {authMode === 'login' && (
            <div className="mb-6 p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800/90 shadow-inner">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Auto-Fill Citizen Account (With Option Indicator)</span>
                </span>
                <button
                  type="button"
                  onClick={loadCitizenList}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1 cursor-pointer"
                  title="Refresh account status from Admin Console"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>TOP 3 CITIZENS</span>
                </button>
              </div>
              <div className="space-y-2">
                {citizenList.slice(0, 3).map((user, idx) => {
                  const isSuspended = user.status === 'SUSPENDED';
                  const isSelected = email.toLowerCase() === user.email.toLowerCase();
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleSelectAutoFill(user, idx)}
                      className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? isSuspended
                            ? 'bg-red-950/40 border-red-500 text-white shadow-sm ring-1 ring-red-500'
                            : 'bg-emerald-950/40 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {/* Explicit Option Indicator (Radio Circle) */}
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? isSuspended
                                ? 'border-red-400 bg-red-500/20'
                                : 'border-emerald-400 bg-emerald-500/20'
                              : 'border-slate-600 bg-slate-950'
                          }`}
                        >
                          {isSelected && (
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isSuspended ? 'bg-red-400' : 'bg-emerald-400'
                              }`}
                            />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                            <span>{user.name}</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({user.organization})
                            </span>
                            {isSelected && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-amber-300 border border-amber-500/30">
                                AUTO-FILLED
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {user.email} • {user.reports_filed} case(s)
                          </div>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                          isSuspended
                            ? 'bg-red-950/80 text-red-300 border border-red-800'
                            : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {user.status}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-400 mt-2.5 text-center leading-relaxed">
                Select <strong>Rahul Sharma</strong> (3 cases) or <strong>Neha Verma</strong> (1 case) to see personalized Case Tracking, or select <strong>Automated Web Scraper</strong> to test <strong className="text-red-400">Suspended Login Denied</strong>.
              </p>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-start gap-2.5 shadow-md">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">
                {errorMessage}
              </div>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs flex items-start gap-2.5 shadow-md">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">
                {successMessage}
              </div>
            </div>
          )}

          {/* 1. Log In Form */}
          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Citizen Email Address</span>
                  <span className="text-[10px] text-slate-500 font-mono">REGISTERED EMAIL</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. rahul.sharma88@gmail.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('forgot');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter citizen password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Citizen Session...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Log In to Citizen Portal</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* 2. Create Account Form */}
          {authMode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aarav Patel"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. aarav.patel@gmail.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  City / Locality (India)
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Bengaluru, Karnataka"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Register Citizen Identity</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* 3. Forgot Password Form (Only for User) */}
          {authMode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-3.5">
              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/60 text-xs text-indigo-300 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>Citizen Security Protocol: Reset your password by verifying your registered email and 4-digit Citizen Security PIN.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Registered Citizen Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rahul.sharma88@gmail.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Citizen Security PIN (Default: 9104)
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={securityPin}
                  onChange={(e) => setSecurityPin(e.target.value)}
                  placeholder="4-digit PIN"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-center font-mono tracking-widest text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New Password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    <span>Update Password & Return to Login</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  ← Back to Log In
                </button>
              </div>
            </form>
          )}

          {/* Continue as Guest option */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={onContinueAsGuest}
              className="text-xs text-slate-400 hover:text-emerald-400 flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer font-medium"
            >
              <span>Explore Public Scam Map as Guest</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/40 py-3 px-4 text-center text-slate-500 text-xs">
        KavachSetu • India's Collaborative Community Anti-Fraud Defense Architecture
      </footer>
    </div>
  );
};
