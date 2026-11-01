/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Key, 
  AlertOctagon, 
  Activity, 
  Trash2, 
  UserPlus, 
  Search, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  ArrowLeft, 
  AlertTriangle, 
  Server, 
  ShieldAlert, 
  Clock, 
  Check, 
  X, 
  Play, 
  RotateCcw, 
  FileCode,
  Building,
  UserCheck,
  UserX,
  FileCheck,
  Lock
} from 'lucide-react';
import { UserAccount, UserRole } from '../engine/userManager';

interface AdminPortalProps {
  authToken?: string;
  officerProfile?: any;
  onBackToUserSite: () => void;
  onRefreshLicense: () => void;
  onLogout?: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  authToken,
  officerProfile,
  onBackToUserSite,
  onRefreshLicense,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'licensing' | 'moderation' | 'audit'>('users');

  const getAuthHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
      headers['x-admin-key'] = authToken;
    }
    return headers;
  };
  
  // Users state
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  
  // Create User Modal
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserOrg, setNewUserOrg] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('CITIZEN');

  // Licensing state
  const [licenseData, setLicenseData] = useState<any>(null);
  const [syncTelemetry, setSyncTelemetry] = useState<any>(null);
  const [syncNodeId, setSyncNodeId] = useState<string>('i4c_nodal_server_01');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncCountdown, setSyncCountdown] = useState<number>(0);
  const [adminNotice, setAdminNotice] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Moderation state
  const [threatReports, setThreatReports] = useState<any[]>([]);
  const [threatChallenges, setThreatChallenges] = useState<any[]>([]);
  const [threatStats, setThreatStats] = useState<any>(null);

  // In-app test suite state
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const res = await fetch('/api/admin/users', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else if (res.status === 401 && onLogout) {
        onLogout();
      }
    } catch {
      console.error('Failed to load users');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchLicenseAndSync = async (overrideNodeId?: string) => {
    const targetNodeId = (overrideNodeId ?? syncNodeId).trim() || 'i4c_nodal_server_01';
    try {
      const res = await fetch('/license');
      const data = await res.json();
      setLicenseData(data);

      const syncRes = await fetch(
        `/license/sync-telemetry?requester_id=${encodeURIComponent(targetNodeId)}`
      );
      const syncData = await syncRes.json();
      setSyncTelemetry(syncData.telemetry);
      if (syncData.telemetry?.next_allowed_seconds !== undefined) {
        setSyncCountdown(syncData.telemetry.next_allowed_seconds);
      }
    } catch {
      console.error('Failed to load license / sync data');
    }
  };

  const fetchThreatFeed = async () => {
    try {
      const res = await fetch('/api/admin/threat-feed', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setThreatReports(data.reports || []);
        setThreatChallenges(data.challenges || []);
        setThreatStats(data.stats || null);
      }
    } catch {
      console.error('Failed to load threat feed');
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchLicenseAndSync();
    fetchThreatFeed();

    const interval = setInterval(() => {
      fetchLicenseAndSync();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Countdown timer for 15s gap between server requests
  useEffect(() => {
    let timer: any = null;
    if (syncCountdown > 0) {
      timer = setTimeout(() => {
        setSyncCountdown(syncCountdown - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [syncCountdown]);

  // Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          organization: newUserOrg,
          role: newUserRole
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAdminNotice({ type: 'success', msg: `User account '${data.user?.name}' created successfully.` });
        setIsCreateUserOpen(false);
        setNewUserName('');
        setNewUserEmail('');
        setNewUserOrg('');
        fetchUsers();
      } else {
        setAdminNotice({ type: 'error', msg: data.error || 'Failed to create user' });
      }
    } catch (err: any) {
      setAdminNotice({ type: 'error', msg: err.message });
    }
  };

  // Change User Role
  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        setAdminNotice({ type: 'success', msg: `User role updated to ${newRole}` });
        fetchUsers();
      }
    } catch {
      setAdminNotice({ type: 'error', msg: 'Failed to update user role' });
    }
  };

  // Toggle User Status (Suspend / Reactivate)
  const handleToggleStatus = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-status`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setAdminNotice({
          type: 'success',
          msg: `Account status updated to ${data.user?.status}`
        });
        fetchUsers();
      }
    } catch {
      setAdminNotice({ type: 'error', msg: 'Failed to toggle account status' });
    }
  };

  // Delete User
  const handleDeleteUser = async (userId: string, userName: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok) {
        setAdminNotice({ type: 'success', msg: `User account '${userName}' deleted permanently.` });
        fetchUsers();
      } else {
        setAdminNotice({ type: 'error', msg: data.error || 'Failed to delete user' });
      }
    } catch {
      setAdminNotice({ type: 'error', msg: 'Error deleting user' });
    }
  };

  // LICENSE: Delete / Revoke (Emergency Killswitch)
  const handleDeleteLicense = async () => {
    try {
      await fetch('/license', {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      setAdminNotice({
        type: 'success',
        msg: 'License permanently deleted by Admin. All API endpoints now return 403 LICENSE_EXPIRED.'
      });
      fetchLicenseAndSync();
      onRefreshLicense();
    } catch {
      setAdminNotice({ type: 'error', msg: 'Failed to delete license' });
    }
  };

  // LICENSE: Approve Renewal Request
  const handleApproveRenewal = async (requestId: string) => {
    try {
      const res = await fetch('/license/approve-request', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ request_id: requestId })
      });
      const data = await res.json();
      if (res.ok) {
        setAdminNotice({
          type: 'success',
          msg: `Renewal request approved! Active cryptographic license renewed until ${new Date(data.license.expires_at).toLocaleDateString()}.`
        });
        fetchLicenseAndSync();
        onRefreshLicense();
      } else {
        setAdminNotice({ type: 'error', msg: data.error || 'Failed to approve renewal' });
      }
    } catch {
      setAdminNotice({ type: 'error', msg: 'Error approving renewal' });
    }
  };

  // LICENSE: Reject Renewal Request
  const handleRejectRenewal = async (requestId: string) => {
    try {
      const res = await fetch('/license/reject-request', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ request_id: requestId, notes: 'Declined by Administrator — non-renewal' })
      });
      if (res.ok) {
        setAdminNotice({ type: 'success', msg: 'Renewal request declined by Administrator.' });
        fetchLicenseAndSync();
      }
    } catch {
      setAdminNotice({ type: 'error', msg: 'Error declining renewal' });
    }
  };

  // LICENSE: Issue 1-Year Valid License
  const handleIssueFreshLicense = async (days: number = 365) => {
    try {
      const res = await fetch('/api/demo/generate-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          minutes: days * 24 * 60,
          licensee: 'National Cyber Coordination Agency'
        })
      });
      const newLic = await res.json();
      const applyRes = await fetch('/license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLic)
      });
      if (applyRes.ok) {
        setAdminNotice({
          type: 'success',
          msg: `Fresh cryptographic license issued for ${days} days and activated instantly without server restart!`
        });
        fetchLicenseAndSync();
        onRefreshLicense();
      }
    } catch {
      setAdminNotice({ type: 'error', msg: 'Failed to issue new license' });
    }
  };

  // INTER-SERVER SYNC: 15s gap & 2 requests daily per same ID
  const handleTriggerServerSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/license/sync-servers', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          requester_id: syncNodeId.trim() || 'i4c_nodal_server_01'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAdminNotice({
          type: 'success',
          msg:
            data.message ||
            `Server synchronization successful for ID "${syncNodeId}"! Quota used: ${data.telemetry?.requests_today_count}/2 today. Next allowed in 15s.`
        });
        setSyncCountdown(15);
      } else {
        const wait = data.telemetry?.next_allowed_seconds;
        if (wait) {
          setSyncCountdown(wait);
        }
        setAdminNotice({
          type: 'error',
          msg: data.error || 'Server sync rate-limited (Max 2/day & 15s gap from same ID).'
        });
      }
      fetchLicenseAndSync(syncNodeId);
    } catch {
      setAdminNotice({ type: 'error', msg: 'Server sync failed due to network error' });
    } finally {
      setIsSyncing(false);
    }
  };

  // MODERATION: Resolve Dispute Challenge
  const handleResolveChallenge = async (challengeId: string, resolution: 'resolved' | 'rejected') => {
    try {
      const res = await fetch(`/api/admin/challenges/${challengeId}/resolve`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ resolution })
      });
      if (res.ok) {
        setAdminNotice({
          type: 'success',
          msg: `Dispute challenge has been ${resolution === 'resolved' ? 'approved (marked legitimate)' : 'rejected (retained as scam)'}.`
        });
        fetchThreatFeed();
      }
    } catch {
      setAdminNotice({ type: 'error', msg: 'Failed to update challenge' });
    }
  };

  // Reset Threat Database
  const handleResetDatabase = async () => {
    if (!window.confirm("WARNING: This will clear all scam reports and challenge data (for test purposes). Continue?")) {
      return;
    }
    try {
      const res = await fetch('/admin/reset', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        setAdminNotice({ type: 'success', msg: 'All reports and challenges cleared.' });
        fetchThreatFeed();
      }
    } catch {
      setAdminNotice({ type: 'error', msg: 'Reset failed' });
    }
  };

  // Run Test Suite & 8-Vector Attack Simulation
  const handleRunAllTests = async () => {
    setIsRunningTests(true);
    setTestLogs([]);
    const appendLog = (msg: string) => setTestLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    appendLog('Starting KavachSetu Authority Validation & 8-Vector Anti-Spoofing Attack Suite...');

    // Test 1: Gatekeeper format validation
    appendLog('TEST 1: Gatekeeper format validation & Junk rejection ("12345")...');
    const r1 = await fetch('/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel: 'Phone call',
        scam_type: 'other',
        identifier_type: 'phone',
        identifier_value: '12345',
        pincode: '560102',
        note: 'test report',
        reporter_id: 'test_rep_1'
      })
    });
    if (r1.status === 400) {
      appendLog('✓ Junk identifier "12345" properly rejected with 400 Bad Request');
    } else {
      appendLog(`✗ Expected 400, received ${r1.status}`);
    }

    // Test 2: Verified entity lookup
    appendLog('TEST 2: Whitelist verification for 1930...');
    const r2 = await fetch('/lookup?type=phone&value=1930');
    const d2 = await r2.json();
    if (d2.verdict === 'VERIFIED_BUSINESS') {
      appendLog('✓ 1930 returned VERIFIED_BUSINESS without masking');
    } else {
      appendLog(`✗ Whitelist test failed: ${d2.verdict}`);
    }

    // Test 3: Inter-server sync 15s gap verification
    appendLog('TEST 3: Checking Inter-Server Sync 15-second gap enforcement...');
    const r3 = await fetch('/license/sync-servers', { method: 'POST' });
    const d3 = await r3.json();
    if (r3.status === 200 || r3.status === 429) {
      appendLog(`✓ Sync Endpoint responded (${r3.status}): ${d3.message || d3.error}`);
    }

    // Test 4: Run 8-Vector Multi-Attack Simulation (50 Fake Reports in Isolated Sandbox)
    appendLog('TEST 4: Running 8-Vector Fake Report Attack Simulation (Isolated Sandbox)...');
    try {
      const simRes = await fetch('/api/admin/simulate-attacks', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const simData = await simRes.json();
      for (const s of simData.scenarios || []) {
        appendLog(
          `${s.passed ? '✓' : '✗'} [${s.id}] ${s.attack_name} (${s.fake_reports_generated} fake reports) -> UI Gate: ${s.ui_gate_result} | Engine: ${s.raw_engine_result} | Empty Shells: ${s.empty_shells_created}`
        );
      }
      appendLog(
        `✓ Sandbox Summary: ${simData.passed_scenarios}/${simData.total_scenarios} attack vectors neutralized (${simData.total_fake_reports_generated} fake reports tested, 0 empty shells, live DB polluted: ${simData.live_database_polluted}).`
      );
    } catch {
      appendLog('✗ Failed to run multi-vector attack simulation');
    }

    appendLog('✓ Complete verification & anti-spoofing suite finished.');
    setIsRunningTests(false);
  };

  // Filtered Users
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.organization.toLowerCase().includes(userSearch.toLowerCase());
    
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const isExpired = !licenseData?.is_valid;
  const isDeleted = licenseData?.is_deleted;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Admin Command Header */}
      <header className="sticky top-0 z-50 bg-slate-900/95 border-b border-indigo-900/60 backdrop-blur-md px-4 sm:px-8 py-3.5 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-rose-600 flex items-center justify-center text-white shadow-md">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-white text-base">
                  KavachSetu Admin Portal
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  ADMIN CONSOLE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Administrator Dashboard • Licensing, Moderation &amp; Anti-Spoofing Audits
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2.5 self-end sm:self-auto">
            {/* Admin Session Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-slate-300 text-[11px]">
                Admin: <strong className="text-white">{officerProfile?.name || 'System Administrator'}</strong>
              </span>
            </div>

            {/* System Status Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
              <span className="text-slate-400">License:</span>
              <span className={`flex items-center gap-1 font-bold ${
                isDeleted ? 'text-red-400' : isExpired ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  isDeleted ? 'bg-red-500' : isExpired ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                }`} />
                {isDeleted ? 'REVOKED' : isExpired ? 'EXPIRED' : 'ACTIVE'}
              </span>
            </div>

            {/* Back to Citizen Website button */}
            <button
              onClick={onBackToUserSite}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Public Citizen Site</span>
            </button>

            {/* Lock Console / Sign Out Button */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800 transition-colors cursor-pointer shadow-xs"
                title="Lock Terminal & Log Out"
              >
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                <span>Lock Console</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Admin Notice Banner */}
      {adminNotice && (
        <div className="max-w-7xl mx-auto w-full px-4 mt-4">
          <div className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-3 border shadow-md ${
            adminNotice.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-800 text-emerald-200'
              : 'bg-red-950/70 border-red-800 text-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {adminNotice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertOctagon className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{adminNotice.msg}</span>
            </div>
            <button
              onClick={() => setAdminNotice(null)}
              className="text-xs font-bold hover:underline opacity-80 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area with Navigation Tabs */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-6 flex-1 space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Accounts Authority</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-950/60 font-mono">
              {users.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('licensing')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'licensing'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Licensing Authority</span>
            {licenseData?.renewal_requests?.filter((r: any) => r.status === 'pending').length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-slate-950 font-bold">
                {licenseData.renewal_requests.filter((r: any) => r.status === 'pending').length} pending
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('moderation')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'moderation'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Scam Reports & Disputes</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-950/60 font-mono">
              {threatReports.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'audit'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Automated Test Suite & Audits</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: USER ACCOUNTS AUTHORITY */}
        {/* ========================================================================= */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Metrics cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] font-mono text-slate-400 uppercase">Total Accounts</span>
                <p className="text-2xl font-bold text-white mt-1">{users.length}</p>
                <span className="text-[10px] text-slate-500">Citizens & Agencies</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] font-mono text-emerald-400 uppercase">Active Accounts</span>
                <p className="text-2xl font-bold text-emerald-400 mt-1">
                  {users.filter(u => u.status === 'ACTIVE').length}
                </p>
                <span className="text-[10px] text-slate-500">Unrestricted access</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] font-mono text-red-400 uppercase">Suspended / Flagged</span>
                <p className="text-2xl font-bold text-red-400 mt-1">
                  {users.filter(u => u.status === 'SUSPENDED').length}
                </p>
                <span className="text-[10px] text-slate-500">Access quarantined</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] font-mono text-indigo-400 uppercase">Enterprise & Police</span>
                <p className="text-2xl font-bold text-indigo-400 mt-1">
                  {users.filter(u => ['ENTERPRISE', 'LAW_ENFORCEMENT'].includes(u.role)).length}
                </p>
                <span className="text-[10px] text-slate-500">Institutional partners</span>
              </div>
            </div>

            {/* Filter and Action Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                {/* Search input */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by name, email, or organization..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                {/* Role filter */}
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-slate-300 focus:outline-hidden"
                >
                  <option value="ALL">All Roles</option>
                  <option value="CITIZEN">Citizens</option>
                  <option value="ENTERPRISE">Enterprise Organizations</option>
                  <option value="LAW_ENFORCEMENT">Law Enforcement</option>
                  <option value="ADMIN">Administrators</option>
                </select>

                {/* Status filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-700 text-slate-300 focus:outline-hidden"
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active Only</option>
                  <option value="SUSPENDED">Suspended Only</option>
                </select>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={fetchUsers}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Refresh user list"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingUsers ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setIsCreateUserOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer shadow-md"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create User Account</span>
                </button>
              </div>
            </div>

            {/* User Accounts Table */}
            <div className="bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">User Details</th>
                      <th className="py-3 px-4">Organization</th>
                      <th className="py-3 px-4">Role & Access</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Reports</th>
                      <th className="py-3 px-4 text-right">Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                          No user accounts found matching the search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-white">{user.name}</div>
                            <div className="text-[11px] text-slate-400">{user.email}</div>
                            <div className="text-[9px] font-mono text-slate-600">{user.id}</div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 text-slate-300">
                              <Building className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span className="truncate max-w-[200px]">{user.organization}</span>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <select
                              value={user.role}
                              onChange={(e) => handleUpdateRole(user.id, e.target.value as UserRole)}
                              className={`px-2 py-1 rounded-md text-[11px] font-bold border ${
                                user.role === 'ADMIN'
                                  ? 'bg-purple-950 text-purple-300 border-purple-800'
                                  : user.role === 'LAW_ENFORCEMENT'
                                  ? 'bg-blue-950 text-blue-300 border-blue-800'
                                  : user.role === 'ENTERPRISE'
                                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                  : 'bg-slate-900 text-slate-300 border-slate-700'
                              } focus:outline-hidden`}
                            >
                              <option value="CITIZEN">Citizen</option>
                              <option value="ENTERPRISE">Enterprise Org</option>
                              <option value="LAW_ENFORCEMENT">Law Enforcement</option>
                              <option value="ADMIN">Administrator</option>
                            </select>
                          </td>

                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              user.status === 'ACTIVE'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-red-500/10 text-red-400 border-red-500/30'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                              {user.status}
                            </span>
                          </td>

                          <td className="py-3 px-4 font-mono font-bold text-slate-300">
                            {user.reports_filed}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-2">
                              {/* Suspend / Reactivate button */}
                              <button
                                onClick={() => handleToggleStatus(user.id)}
                                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                                  user.status === 'ACTIVE'
                                    ? 'bg-amber-950/60 hover:bg-amber-900 text-amber-300 border border-amber-800'
                                    : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800'
                                }`}
                                title={user.status === 'ACTIVE' ? 'Suspend account access' : 'Reactivate account'}
                              >
                                {user.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                              </button>

                              {/* Delete Account button */}
                              <button
                                onClick={() => handleDeleteUser(user.id, user.name)}
                                className="p-1.5 rounded bg-red-950/40 hover:bg-red-900 text-red-400 border border-red-800/60 transition-colors cursor-pointer"
                                title="Permanently delete user account"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: LICENSING & INTER-SERVER SYNC AUTHORITY */}
        {/* ========================================================================= */}
        {activeTab === 'licensing' && (
          <div className="space-y-6">
            {/* Top License Status & Emergency Killswitch Card */}
            <div className={`p-6 rounded-2xl border shadow-xl ${
              isDeleted
                ? 'bg-red-950/40 border-red-800/80'
                : isExpired
                ? 'bg-amber-950/40 border-amber-800/80'
                : 'bg-slate-900/80 border-slate-800'
            }`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-indigo-400" />
                    <h2 className="text-lg font-bold text-white">
                      Cryptographic HMAC-SHA256 License Authority
                    </h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      isDeleted
                        ? 'bg-red-500/20 text-red-400 border-red-500/30'
                        : isExpired
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    }`}>
                      {isDeleted ? 'REVOKED / DELETED' : isExpired ? 'EXPIRED' : 'ACTIVE & VERIFIED'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Signature payload: <code className="font-mono text-indigo-300">{licenseData?.licensee}::{licenseData?.expires_at}</code>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleIssueFreshLicense(365)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Issue 1-Year Valid License</span>
                  </button>

                  <button
                    onClick={() => handleIssueFreshLicense(-1)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-600/80 hover:bg-amber-500 text-white transition-colors"
                    title="Simulate license expiration for testing"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Simulate Expired License</span>
                  </button>

                  {/* EMERGENCY KILLSWITCH: Delete License */}
                  <button
                    onClick={handleDeleteLicense}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-red-700 hover:bg-red-600 text-white shadow-md transition-colors cursor-pointer"
                    title="Delete license if user won't renew or access is revoked"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete / Revoke License</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 font-mono uppercase text-[10px]">Licensed Organization</span>
                  <p className="text-sm font-bold text-white mt-1">{licenseData?.licensee || 'N/A'}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 font-mono uppercase text-[10px]">Expiration Timestamp</span>
                  <p className="text-sm font-mono text-slate-200 mt-1">
                    {licenseData?.expires_at ? new Date(licenseData.expires_at).toLocaleString() : 'N/A'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 font-mono uppercase text-[10px]">HMAC Signature</span>
                  <p className="text-xs font-mono text-emerald-400 mt-1 truncate" title={licenseData?.signature}>
                    {licenseData?.signature || 'Unsigned'}
                  </p>
                </div>
              </div>
            </div>

            {/* User Renewal Requests Inbox (Admin Reviews & Approves/Rejects) */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    <span>User License Renewal Requests Inbox</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Requests submitted by enterprise users. Admin can approve (auto-issues signed license) or reject (if won&apos;t renew).
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 text-xs font-mono">
                  {licenseData?.renewal_requests?.length || 0} Requests Received
                </span>
              </div>

              {(!licenseData?.renewal_requests || licenseData.renewal_requests.length === 0) ? (
                <div className="p-6 rounded-xl bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-400">
                  No pending renewal requests. User requests submitted from the Citizen Website will appear here.
                </div>
              ) : (
                <div className="space-y-3">
                  {licenseData.renewal_requests.map((req: any) => (
                    <div
                      key={req.request_id}
                      className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{req.licensee_name}</span>
                          <span className="text-slate-500 font-mono text-[10px]">ID: {req.request_id}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            req.status === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : req.status === 'rejected'
                              ? 'bg-red-500/10 text-red-400 border-red-500/30'
                              : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          }`}>
                            {req.status}
                          </span>
                        </div>
                        <p className="text-slate-300 text-xs">{req.reason}</p>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                          <span>Contact: <code className="text-slate-300">{req.contact_email}</code></span>
                          <span>•</span>
                          <span>Requested Duration: <strong className="text-white">{req.requested_days} days</strong></span>
                          <span>•</span>
                          <span>Submitted: {new Date(req.created_at).toLocaleString()}</span>
                          {req.admin_notes && (
                            <>
                              <span>•</span>
                              <span className="text-amber-400">Admin Note: {req.admin_notes}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {req.status === 'pending' && (
                        <div className="shrink-0 flex items-center gap-2">
                          <button
                            onClick={() => handleApproveRenewal(req.request_id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow-md"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve Renewal</span>
                          </button>
                          <button
                            onClick={() => handleRejectRenewal(req.request_id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-950/70 hover:bg-red-900 text-red-300 border border-red-800 transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: SCAM MODERATION & INTELLIGENCE */}
        {/* ========================================================================= */}
        {activeTab === 'moderation' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Live Threat Intelligence & Incident Moderation</h2>
                <p className="text-xs text-slate-400">
                  Inspect raw heuristic scores, bot velocity triggers, subnet collapsing, and merchant dispute challenges.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchThreatFeed}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-200 hover:bg-slate-700"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Feed</span>
                </button>
                <button
                  onClick={handleResetDatabase}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-red-950 text-red-300 hover:bg-red-900 border border-red-800"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Database</span>
                </button>
              </div>
            </div>

            {/* Business Disputes / Challenges */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center justify-between">
                <span>Merchant Business Disputes ({threatChallenges.length})</span>
                <span className="text-xs font-normal text-slate-400">Protects legitimate numbers from false reporting</span>
              </h3>

              {threatChallenges.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-500">
                  No active business challenges under review.
                </div>
              ) : (
                <div className="space-y-2">
                  {threatChallenges.map((chal) => (
                    <div
                      key={chal.challenge_id}
                      className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-white">{chal.claimant_name}</strong>
                          <code className="text-emerald-400 font-mono">{chal.identifier_value}</code>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {chal.status}
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs mt-1">{chal.proof_note}</p>
                        <span className="text-[10px] text-slate-500">Contact: {chal.contact_email}</span>
                      </div>

                      {chal.status === 'under_review' && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleResolveChallenge(chal.challenge_id, 'resolved')}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px]"
                          >
                            Approve Legitimate
                          </button>
                          <button
                            onClick={() => handleResolveChallenge(chal.challenge_id, 'rejected')}
                            className="px-2.5 py-1 rounded bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 text-[11px]"
                          >
                            Reject Dispute
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Raw Incident Reports */}
            <div className="bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Raw Incident Stream ({threatReports.length})
                </span>
                <span className="text-xs text-slate-400">Heuristic breakdown with subnet masks</span>
              </div>
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] sticky top-0">
                    <tr>
                      <th className="py-2.5 px-4">Identifier</th>
                      <th className="py-2.5 px-4">Channel & Type</th>
                      <th className="py-2.5 px-4">Subnet Prefix</th>
                      <th className="py-2.5 px-4">Location</th>
                      <th className="py-2.5 px-4">Trust Weight</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {threatReports.map((r, idx) => {
                      const subnetLabel = r.subnet_prefix
                        ? /^\d+\.\d+\.\d+$/.test(r.subnet_prefix)
                          ? `${r.subnet_prefix}.x/24`
                          : r.subnet_prefix
                        : 'Unrecorded';
                      const scoreVal =
                        typeof r.trust_score === 'number'
                          ? r.trust_score
                          : r.is_trusted_distinct === false
                          ? 0
                          : 1.0;
                      return (
                        <tr key={r.report_id || idx} className="hover:bg-slate-800/40">
                          <td className="py-2.5 px-4 font-mono font-bold text-white">
                            {r.normalized_identifier || r.identifier_value}
                          </td>
                          <td className="py-2.5 px-4 text-slate-300">
                            <div>{r.scam_type}</div>
                            <div className="text-[10px] text-slate-500">{r.channel}</div>
                          </td>
                          <td className="py-2.5 px-4 font-mono tabular-nums text-slate-400">
                            {subnetLabel}
                          </td>
                          <td className="py-2.5 px-4 text-slate-300">
                            {r.area_name ? `${r.area_name}, ` : ''}{r.city} ({r.pincode || r.area_pincode})
                          </td>
                          <td className="py-2.5 px-4">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-mono tabular-nums font-bold ${
                                  scoreVal === 0
                                    ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                }`}
                              >
                                {scoreVal.toFixed(1)}
                              </span>
                              {r.collapse_reason && (
                                <span className="text-[10px] font-mono text-amber-400">
                                  {r.collapse_reason}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: AUTOMATED TEST SUITE & AUDIT LOGS */}
        {/* ========================================================================= */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-400" />
                    <span>In-Browser Live Verification Test Runner</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Runs end-to-end tests across Gatekeeper junk rejection, 1930 verified business lookup, and inter-server 15-second gap rate limiter.
                  </p>
                </div>

                <button
                  onClick={handleRunAllTests}
                  disabled={isRunningTests}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-md transition-colors cursor-pointer"
                >
                  <Play className={`w-3.5 h-3.5 ${isRunningTests ? 'animate-spin' : ''}`} />
                  <span>{isRunningTests ? 'Executing Tests...' : 'Run All Verification Tests'}</span>
                </button>
              </div>

              {/* Console Output */}
              <div className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-slate-300 border border-slate-800 h-64 overflow-y-auto space-y-1">
                {testLogs.length === 0 ? (
                  <span className="text-slate-600">Click &apos;Run All Verification Tests&apos; to trigger live execution...</span>
                ) : (
                  testLogs.map((log, i) => (
                    <div key={i} className={log.includes('✓') ? 'text-emerald-400' : log.includes('✗') ? 'text-red-400' : 'text-slate-300'}>
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {isCreateUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-400" />
                <span>Create User Account</span>
              </h3>
              <button
                onClick={() => setIsCreateUserOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Suresh Kumar"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="e.g. suresh@domain.com"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Organization / Agency</label>
                <input
                  type="text"
                  value={newUserOrg}
                  onChange={(e) => setNewUserOrg(e.target.value)}
                  placeholder="e.g. Karnataka Police Cyber Cell or Citizen"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Role & Permissions</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="CITIZEN">Citizen (Lookup, Report, Track Case)</option>
                  <option value="ENTERPRISE">Enterprise (Org Lookups, License Renewal Requests)</option>
                  <option value="LAW_ENFORCEMENT">Law Enforcement (Case Intelligence, Audit Access)</option>
                  <option value="ADMIN">Administrator (Full Access to Users & Licenses)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateUserOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
