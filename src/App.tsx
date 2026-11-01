import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LookupSection } from './components/LookupSection';
import { ScamMapSection } from './components/ScamMapSection';
import { AlertsSection } from './components/AlertsSection';
import { CaseTrackerSection } from './components/CaseTrackerSection';
import { ReportModal } from './components/ReportModal';
import { DisputeModal } from './components/DisputeModal';
import { LicenseExpiredBanner } from './components/LicenseExpiredBanner';
import { OrgLicenseModal } from './components/OrgLicenseModal';
import { AiAdvisorDrawer } from './components/AiAdvisorDrawer';
import { AdminAuthGate } from './components/AdminAuthGate';
import { CitizenAuthGate } from './components/CitizenAuthGate';
import { StarfallBackground } from './components/StarfallBackground';
import { Language } from './translations';
import { UserAccount } from './engine/userManager';
import { PhoneCall, ExternalLink, Scale, Key } from 'lucide-react';

export function App() {
  const [siteMode, setSiteMode] = useState<'user' | 'admin'>('user');
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  // Citizen Auth Gate is ALWAYS shown at the very first phase on launch
  const [showCitizenGate, setShowCitizenGate] = useState<boolean>(true);

  const [activeTab, setActiveTab] = useState<'lookup' | 'map' | 'alerts' | 'track'>('lookup');
  const [selectedAlertPincode, setSelectedAlertPincode] = useState<string>('560102');
  const [trackedCaseId, setTrackedCaseId] = useState<string>('');
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const [isOrgLicenseOpen, setIsOrgLicenseOpen] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [isDark, setIsDark] = useState(true);
  const [isLicenseExpired, setIsLicenseExpired] = useState(false);

  // AI Drawer state
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState<string | undefined>();
  const [aiContext, setAiContext] = useState<any>();

  // Toast notification
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    // Clear any leftover #admin hash on initial startup so Citizen Sign-In always comes first
    if (window.location.hash === '#admin') {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const checkLicenseStatus = async () => {
    try {
      const res = await fetch('/license');
      const data = await res.json();
      setIsLicenseExpired(data.is_valid === false);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    checkLicenseStatus();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 5000);
  };

  const handleSelectAreaForAlerts = (pincode: string) => {
    setSelectedAlertPincode(pincode);
    setActiveTab('alerts');
  };

  const handleTrackCase = (caseId: string) => {
    setTrackedCaseId(caseId);
    setActiveTab('track');
  };

  const handleAskAi = (prompt: string, context?: any) => {
    setAiPrompt(prompt);
    setAiContext(context);
    setIsAiOpen(true);
  };

  // Dedicated Authority Admin Portal Site Mode
  if (siteMode === 'admin') {
    return (
      <AdminAuthGate
        onBackToUserSite={() => {
          if (window.location.hash === '#admin') {
            window.history.replaceState(null, '', window.location.pathname);
          }
          setSiteMode('user');
          checkLicenseStatus();
        }}
        onRefreshLicense={() => {
          checkLicenseStatus();
        }}
      />
    );
  }

  // Citizen / Enterprise Sign-In Gate View (Very First Phase)
  if (showCitizenGate) {
    return (
      <CitizenAuthGate
        onLoginSuccess={(user: UserAccount) => {
          sessionStorage.setItem('kavach_citizen_user', JSON.stringify(user));
          setCurrentUser(user);
          setShowCitizenGate(false);
          showToast(`Welcome, ${user.name} (${user.organization})`);
        }}
        onContinueAsGuest={() => setShowCitizenGate(false)}
        onSwitchToAdmin={() => {
          setSiteMode('admin');
        }}
      />
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 relative overflow-x-hidden ${
        isDark ? 'bg-[#070B14] text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {isDark && <StarfallBackground />}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenReport={() => setIsReportOpen(true)}
        onSwitchToAdmin={() => {
          setSiteMode('admin');
        }}
        language={language}
        setLanguage={setLanguage}
        isDark={isDark}
        toggleTheme={() => setIsDark(!isDark)}
        isLicenseExpired={isLicenseExpired}
        currentUser={currentUser}
        onLogoutCitizen={() => {
          sessionStorage.removeItem('kavach_citizen_user');
          setCurrentUser(null);
          setShowCitizenGate(true);
          showToast('Signed out of citizen session.');
        }}
        onOpenCitizenLogin={() => setShowCitizenGate(true)}
        onOpenOrgLicense={() => setIsOrgLicenseOpen(true)}
      />

      {isLicenseExpired && (
        <LicenseExpiredBanner
          onOpenLicenseModal={() => setIsOrgLicenseOpen(true)}
          onRefreshStatus={checkLicenseStatus}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl border border-emerald-400/30 text-xs font-bold flex items-center gap-2">
          <span>✓</span>
          <span>{toast}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 relative z-10">
        {activeTab === 'lookup' && (
          <LookupSection
            language={language}
            onOpenReport={() => setIsReportOpen(true)}
            onAskAi={handleAskAi}
            onOpenDispute={() => setIsDisputeOpen(true)}
            onTrackCase={handleTrackCase}
          />
        )}

        {activeTab === 'map' && (
          <ScamMapSection
            language={language}
            onSelectAreaForAlerts={handleSelectAreaForAlerts}
          />
        )}

        {activeTab === 'alerts' && (
          <AlertsSection
            language={language}
            preselectedPincode={selectedAlertPincode}
            onAskAi={handleAskAi}
          />
        )}

        {activeTab === 'track' && (
          <CaseTrackerSection
            language={language}
            initialQuery={trackedCaseId}
            currentUser={currentUser}
            onOpenReport={() => setIsReportOpen(true)}
            onOpenAuth={() => {
              sessionStorage.removeItem('kavach_citizen_user');
              setCurrentUser(null);
              setShowCitizenGate(true);
            }}
          />
        )}
      </main>

      {/* Modals & Drawers */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        language={language}
        currentUser={currentUser}
        onTrackCase={handleTrackCase}
        onReportSuccess={(reportId, caseId) => {
          showToast(`Scam report logged (${reportId}) • Case ${caseId}`);
        }}
      />

      <DisputeModal
        isOpen={isDisputeOpen}
        onClose={() => setIsDisputeOpen(false)}
        language={language}
        onDisputeSuccess={(challengeId) => {
          showToast(`Business dispute registered (${challengeId}). Verdict stepped down.`);
        }}
      />

      <OrgLicenseModal
        isOpen={isOrgLicenseOpen}
        onClose={() => setIsOrgLicenseOpen(false)}
        currentUser={currentUser}
        onLicenseChange={checkLicenseStatus}
      />

      <AiAdvisorDrawer
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        language={language}
        initialPrompt={aiPrompt}
        initialContext={aiContext}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#050811]/90 backdrop-blur-md py-3.5 px-4 sm:px-6 lg:px-8 text-xs text-slate-400 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <a
              href="tel:1930"
              className="text-emerald-400 hover:text-emerald-300 font-extrabold flex items-center gap-1.5"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              Cybercrime Helpline: 1930
            </a>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400">Citizen Fraud Response Network</span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-200 flex items-center gap-1 transition-colors"
            >
              <span>cybercrime.gov.in</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              type="button"
              onClick={() => setIsDisputeOpen(true)}
              className="hover:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Scale className="w-3 h-3 text-amber-400" />
              <span>Business Dispute</span>
            </button>

            <button
              type="button"
              onClick={() => setIsOrgLicenseOpen(true)}
              className="hover:text-slate-200 flex items-center gap-1 transition-colors font-mono text-[11px] cursor-pointer"
            >
              <Key className="w-3 h-3 text-amber-400" />
              <span>License & Renewal</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
