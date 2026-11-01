import React from 'react';
import {
  ShieldCheck,
  Search,
  MapPin,
  Bell,
  FileSearch,
  Lock,
  Globe,
  Sun,
  Moon,
  Plus,
  LogOut,
  UserCheck,
  Key
} from 'lucide-react';
import { Language, TRANSLATIONS } from '../translations';
import { UserAccount } from '../engine/userManager';

interface NavbarProps {
  activeTab: 'lookup' | 'map' | 'alerts' | 'track';
  setActiveTab: (tab: 'lookup' | 'map' | 'alerts' | 'track') => void;
  onOpenReport: () => void;
  onSwitchToAdmin: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  isDark: boolean;
  toggleTheme: () => void;
  isLicenseExpired: boolean;
  currentUser?: UserAccount | null;
  onLogoutCitizen?: () => void;
  onOpenCitizenLogin?: () => void;
  onOpenOrgLicense?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenReport,
  onSwitchToAdmin,
  language,
  setLanguage,
  isDark,
  toggleTheme,
  isLicenseExpired,
  currentUser,
  onLogoutCitizen,
  onOpenCitizenLogin,
  onOpenOrgLicense
}) => {
  const t = TRANSLATIONS[language];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#070B14]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <button
          onClick={() => setActiveTab('lookup')}
          className="flex items-center gap-2.5 text-left group focus:outline-none"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:bg-emerald-400 transition-colors">
            <ShieldCheck className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-extrabold tracking-tight text-emerald-400 leading-none">
              KavachSetu
            </span>
          </div>
        </button>

        {/* Center Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/70 p-1 rounded-xl border border-slate-800/80">
          <button
            onClick={() => setActiveTab('lookup')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'lookup'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            {t.navVerify}
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'map'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            {t.navMap}
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'alerts'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            {t.navAlerts}
          </button>

          <button
            onClick={() => setActiveTab('track')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'track'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSearch className="w-3.5 h-3.5" />
            {t.navTrack}
          </button>

          {onOpenOrgLicense && (
            <button
              onClick={onOpenOrgLicense}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 text-slate-400 hover:text-amber-400"
              title="Organization License & Renewal Desk"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              {t.navOrgLicense}
            </button>
          )}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Citizen Session Status or Sign In */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-2.5 py-1.5 rounded-lg text-xs">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-300 font-semibold max-w-[110px] truncate">
                {currentUser.name}
              </span>
              {onLogoutCitizen && (
                <button
                  onClick={onLogoutCitizen}
                  title="Sign out / Return to Login Page"
                  className="ml-1 text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            onOpenCitizenLogin && (
              <button
                onClick={onOpenCitizenLogin}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Citizen Sign In</span>
              </button>
            )
          )}

          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            className="px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="Switch Language (English / हिन्दी)"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>{language === 'en' ? 'हिन्दी' : 'EN'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
              isDark
                ? 'bg-slate-900/80 border-slate-800 text-amber-400 hover:text-amber-300 hover:bg-slate-800'
                : 'bg-amber-50 border-amber-300 text-indigo-600 hover:bg-amber-100 shadow-xs'
            }`}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform duration-200 hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600 transition-transform duration-200 hover:-rotate-12" />
            )}
          </button>

          {/* Report a Scam CTA */}
          <button
            onClick={onOpenReport}
            disabled={isLicenseExpired}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{t.btnReportScam}</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="flex md:hidden items-center justify-around border-t border-slate-800/80 bg-slate-950/90 py-1.5 px-2">
        <button
          onClick={() => setActiveTab('lookup')}
          className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 ${
            activeTab === 'lookup' ? 'text-emerald-400 bg-slate-800' : 'text-slate-400'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          {t.navVerify}
        </button>
        <button
          onClick={() => setActiveTab('map')}
          className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 ${
            activeTab === 'map' ? 'text-emerald-400 bg-slate-800' : 'text-slate-400'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          {t.navMap}
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 ${
            activeTab === 'alerts' ? 'text-emerald-400 bg-slate-800' : 'text-slate-400'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          {t.navAlerts}
        </button>
        <button
          onClick={() => setActiveTab('track')}
          className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 ${
            activeTab === 'track' ? 'text-emerald-400 bg-slate-800' : 'text-slate-400'
          }`}
        >
          <FileSearch className="w-3.5 h-3.5" />
          {t.navTrack}
        </button>
      </div>
    </header>
  );
};
