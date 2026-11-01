/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'CITIZEN' | 'ENTERPRISE' | 'LAW_ENFORCEMENT' | 'ADMIN';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization: string;
  status: AccountStatus;
  reports_filed: number;
  created_at: string;
  last_active: string;
  permissions: string[];
  password?: string;
}

const DEFAULT_PERMISSIONS: Record<UserRole, string[]> = {
  CITIZEN: ['search_intel', 'report_scam', 'track_case'],
  ENTERPRISE: ['search_intel', 'report_scam', 'track_case', 'org_license_request', 'dispute_business'],
  LAW_ENFORCEMENT: ['search_intel', 'report_scam', 'track_case', 'view_audit_logs', 'escalate_1930'],
  ADMIN: ['search_intel', 'report_scam', 'track_case', 'manage_users', 'manage_licenses', 'moderate_reports']
};

export class UserManager {
  private users: Map<string, UserAccount> = new Map();

  constructor() {
    this.seedDefaultUsers();
  }

  public seedDefaultUsers(): void {
    this.users.clear();
    const initialUsers: UserAccount[] = [
      {
        id: 'usr_bot_06',
        name: 'Automated Web Scraper',
        email: 'bot_scam_feed@proxymail.top',
        role: 'CITIZEN',
        organization: 'Unverified IP Pool /24',
        status: 'SUSPENDED',
        reports_filed: 48,
        created_at: '2026-04-01T02:00:00.000Z',
        last_active: '2026-10-31T08:15:00.000Z',
        permissions: [],
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
        last_active: '2026-10-31T10:12:00.000Z',
        permissions: DEFAULT_PERMISSIONS.CITIZEN,
        password: 'citizen123'
      },
      {
        id: 'usr_cit_04',
        name: 'Rahul Sharma',
        email: 'rahul.sharma88@gmail.com',
        role: 'CITIZEN',
        organization: 'Bengaluru Citizen',
        status: 'ACTIVE',
        reports_filed: 3,
        created_at: '2026-03-01T10:15:00.000Z',
        last_active: '2026-10-31T11:00:00.000Z',
        permissions: DEFAULT_PERMISSIONS.CITIZEN,
        password: 'citizen123'
      },
      {
        id: 'usr_ent_02',
        name: 'Priya Sundaram',
        email: 'priya.sundaram@hdfcbank.com',
        role: 'ENTERPRISE',
        organization: 'HDFC Bank Vigilance & Risk Operations',
        status: 'ACTIVE',
        reports_filed: 14,
        created_at: '2026-02-14T09:00:00.000Z',
        last_active: '2026-10-31T09:45:00.000Z',
        permissions: DEFAULT_PERMISSIONS.ENTERPRISE,
        password: 'citizen123'
      },
      {
        id: 'usr_lea_03',
        name: 'ACP Rajesh Kumar',
        email: 'rajesh.kumar@delhipolice.gov.in',
        role: 'LAW_ENFORCEMENT',
        organization: 'Delhi Police Cyber Cell (IFSO)',
        status: 'ACTIVE',
        reports_filed: 32,
        created_at: '2026-01-20T08:30:00.000Z',
        last_active: '2026-10-31T10:50:00.000Z',
        permissions: DEFAULT_PERMISSIONS.LAW_ENFORCEMENT,
        password: 'citizen123'
      },
      {
        id: 'usr_admin_01',
        name: 'Chief Cyber Coordinator',
        email: 'admin@kavachsetu.gov.in',
        role: 'ADMIN',
        organization: 'Indian Cyber Crime Coordination Centre (I4C)',
        status: 'ACTIVE',
        reports_filed: 0,
        created_at: '2026-01-01T00:00:00.000Z',
        last_active: '2026-10-31T11:10:00.000Z',
        permissions: DEFAULT_PERMISSIONS.ADMIN,
        password: 'citizen123'
      }
    ];

    for (const user of initialUsers) {
      this.users.set(user.id, user);
    }
  }

  public getAllUsers(): UserAccount[] {
    return Array.from(this.users.values());
  }

  public getCitizenDemoList(): UserAccount[] {
    return Array.from(this.users.values()).filter((u) => u.role === 'CITIZEN');
  }

  public getUserById(id: string): UserAccount | undefined {
    return this.users.get(id);
  }

  public getUserByEmail(email: string): UserAccount | undefined {
    const normalized = email.trim().toLowerCase();
    return Array.from(this.users.values()).find((u) => u.email.toLowerCase() === normalized);
  }

  public authenticateCitizen(
    email: string,
    password?: string
  ): { ok: boolean; user?: UserAccount; error?: string; code?: string } {
    const user = this.getUserByEmail(email);
    if (!user) {
      return { ok: false, error: 'No registered citizen account found with that email address.' };
    }
    if (user.status === 'SUSPENDED') {
      return {
        ok: false,
        code: 'SUSPENDED',
        error:
          'LOGIN DENIED: Account Suspended. Your access is restricted by the Cyber Crime Authority. Contact the Admin or have an Administrator reactivate your account in the Admin Authority console.'
      };
    }
    if (password && user.password && user.password !== password) {
      return { ok: false, error: 'Invalid password for this citizen account.' };
    }
    user.last_active = new Date().toISOString();
    return { ok: true, user };
  }

  public registerCitizen(params: {
    name: string;
    email: string;
    password?: string;
    city?: string;
  }): { ok: boolean; user?: UserAccount; error?: string } {
    const existing = this.getUserByEmail(params.email);
    if (existing) {
      return { ok: false, error: 'An account with this email address already exists.' };
    }
    const id = `usr_cit_${Math.random().toString(36).substring(2, 7)}`;
    const newUser: UserAccount = {
      id,
      name: params.name.trim(),
      email: params.email.trim().toLowerCase(),
      role: 'CITIZEN',
      organization: `${params.city?.trim() || 'Bengaluru'} Citizen`,
      status: 'ACTIVE',
      reports_filed: 0,
      created_at: new Date().toISOString(),
      last_active: new Date().toISOString(),
      permissions: DEFAULT_PERMISSIONS.CITIZEN,
      password: params.password || 'citizen123'
    };
    this.users.set(id, newUser);
    return { ok: true, user: newUser };
  }

  public resetCitizenPassword(email: string, newPassword: string): { ok: boolean; error?: string } {
    const user = this.getUserByEmail(email);
    if (!user) {
      return { ok: false, error: 'No account found with that email address.' };
    }
    user.password = newPassword;
    return { ok: true };
  }

  public createAdminUser(params: {
    name: string;
    email: string;
    organization?: string;
    role?: UserRole;
  }): { ok: boolean; user?: UserAccount; error?: string } {
    if (!params.name?.trim() || !params.email?.trim()) {
      return { ok: false, error: 'Name and email are required.' };
    }
    if (this.getUserByEmail(params.email)) {
      return { ok: false, error: 'User with this email already exists.' };
    }
    const role: UserRole = params.role || 'CITIZEN';
    const id = `usr_${role.toLowerCase().slice(0, 3)}_${Math.random().toString(36).substring(2, 6)}`;
    const newUser: UserAccount = {
      id,
      name: params.name.trim(),
      email: params.email.trim().toLowerCase(),
      role,
      organization: params.organization?.trim() || 'Verified Citizen',
      status: 'ACTIVE',
      reports_filed: 0,
      created_at: new Date().toISOString(),
      last_active: new Date().toISOString(),
      permissions: DEFAULT_PERMISSIONS[role] || DEFAULT_PERMISSIONS.CITIZEN,
      password: 'citizen123'
    };
    this.users.set(id, newUser);
    return { ok: true, user: newUser };
  }

  public updateUserRole(id: string, role: UserRole): UserAccount | undefined {
    const user = this.users.get(id);
    if (!user) return undefined;
    user.role = role;
    user.permissions = DEFAULT_PERMISSIONS[role] || DEFAULT_PERMISSIONS.CITIZEN;
    return user;
  }

  public toggleUserStatus(id: string): UserAccount | undefined {
    const user = this.users.get(id);
    if (!user) return undefined;
    user.status = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    user.permissions = user.status === 'ACTIVE' ? DEFAULT_PERMISSIONS[user.role] : [];
    return user;
  }

  public deleteUser(id: string): { ok: boolean; error?: string } {
    const user = this.users.get(id);
    if (!user) return { ok: false, error: 'User not found' };
    this.users.delete(id);
    return { ok: true };
  }

  public incrementReportsFiled(userIdOrEmail?: string): void {
    if (!userIdOrEmail) return;
    const byId = this.users.get(userIdOrEmail);
    if (byId) {
      byId.reports_filed += 1;
      return;
    }
    const byEmail = this.getUserByEmail(userIdOrEmail);
    if (byEmail) {
      byEmail.reports_filed += 1;
    }
  }
}

export const userManager = new UserManager();
