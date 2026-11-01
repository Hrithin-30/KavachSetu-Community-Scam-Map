/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'node:crypto';

export interface LicensePayload {
  licensee: string;
  expires_at: string;
  signature: string;
}

export interface RenewalRequest {
  request_id: string;
  requester_id: string;
  licensee_name: string;
  contact_email: string;
  requested_days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  admin_notes?: string;
}

export interface PerIdQuotaSummary {
  requester_id: string;
  requests_today_count: number;
  max_requests_per_day: number;
  remaining_today: number;
  last_request_timestamp: number | null;
  next_allowed_seconds: number;
  status: 'READY' | 'COOLDOWN' | 'QUOTA_EXHAUSTED';
}

export interface SyncTelemetry {
  requester_id: string;
  min_gap_seconds: number;
  max_requests_per_day: number;
  requests_today: number;
  requests_today_count: number;
  remaining_today: number;
  last_sync_timestamp: number | null;
  seconds_since_last_request: number;
  next_allowed_seconds: number;
  status: 'READY' | 'COOLDOWN' | 'QUOTA_EXHAUSTED';
  per_id_quotas: PerIdQuotaSummary[];
}

const LICENSE_SECRET = process.env.KAVACH_LICENSE_SECRET || 'KAVACHSETU-I4C-MASTER-HMAC-SECRET-2026';

export class LicenseManager {
  private currentLicense: LicensePayload | null = null;
  private isDeleted: boolean = false;
  private maxObservedTimestampMs: number = Date.now();
  private renewalRequests: RenewalRequest[] = [];

  // Rate limiter state: 15s gap between server requests & max 2 requests/day from the SAME ID
  private readonly minGapSeconds = 15;
  private readonly maxRequestsPerDay = 2;
  private syncTimestampsById: Map<string, number[]> = new Map();
  private lastActiveRequesterId: string = 'default_server_node';

  constructor() {
    this.seedInitialLicenseAndRequests();
  }

  public normalizeRequesterId(rawId?: string): string {
    const cleaned = (rawId || '').trim().toLowerCase();
    return cleaned || this.lastActiveRequesterId || 'default_server_node';
  }

  public signPayload(licensee: string, expiresAt: string): string {
    return crypto
      .createHmac('sha256', LICENSE_SECRET)
      .update(`${licensee}::${expiresAt}`)
      .digest('hex');
  }

  public createSignedLicense(licensee: string, durationMinutes: number): LicensePayload {
    const now = Math.max(Date.now(), this.maxObservedTimestampMs);
    const expiresAt = new Date(now + durationMinutes * 60 * 1000).toISOString();
    const signature = this.signPayload(licensee, expiresAt);
    return {
      licensee,
      expires_at: expiresAt,
      signature
    };
  }

  public seedInitialLicenseAndRequests(): void {
    this.isDeleted = false;
    this.maxObservedTimestampMs = Date.now();
    this.syncTimestampsById.clear();
    this.lastActiveRequesterId = 'default_server_node';

    const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    this.currentLicense = {
      licensee: 'Demo Bank',
      expires_at: oneYearFromNow,
      signature: this.signPayload('Demo Bank', oneYearFromNow)
    };

    this.renewalRequests = [
      {
        request_id: 'rnw_1793459210246_1n7v',
        requester_id: 'vigilance@sbi.co.in',
        licensee_name: 'State Bank of India - Fraud Wing',
        contact_email: 'vigilance@sbi.co.in',
        requested_days: 365,
        reason: 'Annual organization subscription for enterprise scam lookup API and banking fraud radar',
        status: 'pending',
        created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString()
      }
    ];
  }

  public verifySignature(payload: LicensePayload): boolean {
    if (!payload || !payload.licensee || !payload.expires_at || !payload.signature) {
      return false;
    }
    const expected = this.signPayload(payload.licensee, payload.expires_at);
    return payload.signature === expected;
  }

  public checkLicense(simulatedNowMs?: number, requesterId?: string): {
    is_valid: boolean;
    is_deleted: boolean;
    status_code: 'ACTIVE' | 'LICENSE_EXPIRED' | 'INVALID_SIGNATURE' | 'CLOCK_ROLLBACK_DETECTED' | 'REVOKED';
    licensee: string | null;
    expires_at: string | null;
    signature: string | null;
    renewal_requests: RenewalRequest[];
    telemetry: SyncTelemetry;
  } {
    const now = simulatedNowMs ?? Date.now();
    const telemetry = this.getSyncTelemetry(requesterId, now);

    if (now + 5000 < this.maxObservedTimestampMs) {
      return {
        is_valid: false,
        is_deleted: this.isDeleted,
        status_code: 'CLOCK_ROLLBACK_DETECTED',
        licensee: this.currentLicense?.licensee || null,
        expires_at: this.currentLicense?.expires_at || null,
        signature: this.currentLicense?.signature || null,
        renewal_requests: this.renewalRequests,
        telemetry
      };
    }

    if (now > this.maxObservedTimestampMs) {
      this.maxObservedTimestampMs = now;
    }

    if (this.isDeleted || !this.currentLicense) {
      return {
        is_valid: false,
        is_deleted: true,
        status_code: 'REVOKED',
        licensee: null,
        expires_at: null,
        signature: null,
        renewal_requests: this.renewalRequests,
        telemetry
      };
    }

    const sigValid = this.verifySignature(this.currentLicense);
    if (!sigValid) {
      return {
        is_valid: false,
        is_deleted: false,
        status_code: 'INVALID_SIGNATURE',
        licensee: this.currentLicense.licensee,
        expires_at: this.currentLicense.expires_at,
        signature: this.currentLicense.signature,
        renewal_requests: this.renewalRequests,
        telemetry
      };
    }

    const expMs = Date.parse(this.currentLicense.expires_at);
    if (Number.isNaN(expMs) || now >= expMs) {
      return {
        is_valid: false,
        is_deleted: false,
        status_code: 'LICENSE_EXPIRED',
        licensee: this.currentLicense.licensee,
        expires_at: this.currentLicense.expires_at,
        signature: this.currentLicense.signature,
        renewal_requests: this.renewalRequests,
        telemetry
      };
    }

    return {
      is_valid: true,
      is_deleted: false,
      status_code: 'ACTIVE',
      licensee: this.currentLicense.licensee,
      expires_at: this.currentLicense.expires_at,
      signature: this.currentLicense.signature,
      renewal_requests: this.renewalRequests,
      telemetry
    };
  }

  public updateLicense(payload: Partial<LicensePayload>): {
    ok: boolean;
    error?: string;
    status?: ReturnType<LicenseManager['checkLicense']>;
  } {
    if (!payload.licensee || !payload.expires_at || !payload.signature) {
      return { ok: false, error: 'Missing licensee, expires_at, or signature in license payload' };
    }
    const candidate: LicensePayload = {
      licensee: String(payload.licensee),
      expires_at: String(payload.expires_at),
      signature: String(payload.signature)
    };

    if (!this.verifySignature(candidate)) {
      return { ok: false, error: 'Invalid cryptographic HMAC-SHA256 license signature' };
    }

    this.currentLicense = candidate;
    this.isDeleted = false;
    return {
      ok: true,
      status: this.checkLicense()
    };
  }

  public deleteLicense(): void {
    this.currentLicense = null;
    this.isDeleted = true;
  }

  /**
   * Enforces max 2 requests per day and 15-second cooldown gap between server requests from the SAME ID.
   */
  public submitRenewalRequest(params: {
    requester_id?: string;
    licensee_name: string;
    contact_email: string;
    requested_days?: number;
    reason?: string;
    simulated_now_ms?: number;
  }): {
    ok: boolean;
    status: number;
    error?: string;
    request?: RenewalRequest;
    telemetry: SyncTelemetry;
  } {
    const now = params.simulated_now_ms ?? Date.now();
    const rawId =
      params.requester_id?.trim() ||
      params.contact_email?.trim() ||
      params.licensee_name?.trim() ||
      'default_server_node';
    const requesterId = this.normalizeRequesterId(rawId);
    this.lastActiveRequesterId = requesterId;

    const telemetry = this.getSyncTelemetry(requesterId, now);

    if (telemetry.next_allowed_seconds > 0) {
      return {
        ok: false,
        status: 429,
        error: `Rate limit active for ID "${requesterId}": Minimum 15s gap between server requests from the same ID required. Please wait ${telemetry.next_allowed_seconds}s.`,
        telemetry
      };
    }

    if (telemetry.requests_today_count >= this.maxRequestsPerDay) {
      return {
        ok: false,
        status: 429,
        error: `Daily request quota exhausted for ID "${requesterId}" (${this.maxRequestsPerDay}/${this.maxRequestsPerDay} requests used today). Maximum 2 requests per day allowed from the same ID.`,
        telemetry
      };
    }

    const existing = this.syncTimestampsById.get(requesterId) || [];
    existing.push(now);
    this.syncTimestampsById.set(requesterId, existing);

    const updatedTelemetry = this.getSyncTelemetry(requesterId, now);

    const req: RenewalRequest = {
      request_id: `rnw_${now}_${Math.random().toString(36).substring(2, 6)}`,
      requester_id: requesterId,
      licensee_name: params.licensee_name.trim() || 'Enterprise Partner',
      contact_email: params.contact_email.trim() || 'compliance@partner.in',
      requested_days: Number(params.requested_days) || 365,
      reason: params.reason?.trim() || 'Annual enterprise license renewal request',
      status: 'pending',
      created_at: new Date(now).toISOString()
    };
    this.renewalRequests.unshift(req);

    return {
      ok: true,
      status: 201,
      request: req,
      telemetry: updatedTelemetry
    };
  }

  public approveRenewalRequest(requestId: string): {
    ok: boolean;
    license?: LicensePayload;
    request?: RenewalRequest;
    error?: string;
  } {
    const req = this.renewalRequests.find((r) => r.request_id === requestId);
    if (!req) {
      return { ok: false, error: 'Renewal request not found' };
    }
    req.status = 'approved';
    const newLicense = this.createSignedLicense(req.licensee_name, req.requested_days * 24 * 60);
    this.currentLicense = newLicense;
    this.isDeleted = false;
    return { ok: true, license: newLicense, request: req };
  }

  public rejectRenewalRequest(requestId: string, notes?: string): { ok: boolean; error?: string } {
    const req = this.renewalRequests.find((r) => r.request_id === requestId);
    if (!req) {
      return { ok: false, error: 'Renewal request not found' };
    }
    req.status = 'rejected';
    req.admin_notes = notes || 'Declined by Administrator';
    return { ok: true };
  }

  private computeQuotaForId(requesterId: string, now: number): PerIdQuotaSummary & { elapsedSec: number } {
    const dayWindowStart = now - 24 * 3600 * 1000;
    const rawList = this.syncTimestampsById.get(requesterId) || [];
    const filtered = rawList.filter((ts) => ts > dayWindowStart && ts <= now + 1000);
    if (filtered.length !== rawList.length) {
      this.syncTimestampsById.set(requesterId, filtered);
    }

    const requestsToday = filtered.length;
    const lastSync = requestsToday > 0 ? filtered[filtered.length - 1] : null;
    const elapsedMs = lastSync !== null ? Math.max(0, now - lastSync) : Infinity;
    const elapsedSec = lastSync !== null ? Math.floor(elapsedMs / 1000) : 999999;
    const minGapMs = this.minGapSeconds * 1000;
    const remainingCooldown =
      lastSync !== null && elapsedMs < minGapMs
        ? Math.max(1, Math.ceil((minGapMs - elapsedMs) / 1000))
        : 0;

    let status: SyncTelemetry['status'] = 'READY';
    if (requestsToday >= this.maxRequestsPerDay) {
      status = 'QUOTA_EXHAUSTED';
    } else if (remainingCooldown > 0) {
      status = 'COOLDOWN';
    }

    return {
      requester_id: requesterId,
      requests_today_count: requestsToday,
      max_requests_per_day: this.maxRequestsPerDay,
      remaining_today: Math.max(0, this.maxRequestsPerDay - requestsToday),
      last_request_timestamp: lastSync,
      next_allowed_seconds: remainingCooldown,
      status,
      elapsedSec
    };
  }

  public getSyncTelemetry(rawRequesterId?: string, simulatedNowMs?: number): SyncTelemetry {
    const now = simulatedNowMs ?? Date.now();
    const requesterId = this.normalizeRequesterId(rawRequesterId);
    const current = this.computeQuotaForId(requesterId, now);

    const perIdQuotas: PerIdQuotaSummary[] = [];
    for (const id of this.syncTimestampsById.keys()) {
      const summary = this.computeQuotaForId(id, now);
      perIdQuotas.push({
        requester_id: summary.requester_id,
        requests_today_count: summary.requests_today_count,
        max_requests_per_day: summary.max_requests_per_day,
        remaining_today: summary.remaining_today,
        last_request_timestamp: summary.last_request_timestamp,
        next_allowed_seconds: summary.next_allowed_seconds,
        status: summary.status
      });
    }

    return {
      requester_id: requesterId,
      min_gap_seconds: this.minGapSeconds,
      max_requests_per_day: this.maxRequestsPerDay,
      requests_today: current.requests_today_count,
      requests_today_count: current.requests_today_count,
      remaining_today: current.remaining_today,
      last_sync_timestamp: current.last_request_timestamp,
      seconds_since_last_request: current.elapsedSec,
      next_allowed_seconds: current.next_allowed_seconds,
      status: current.status,
      per_id_quotas: perIdQuotas
    };
  }

  public triggerServerSync(rawRequesterId?: string, simulatedNowMs?: number): {
    ok: boolean;
    status: number;
    message?: string;
    error?: string;
    telemetry: SyncTelemetry;
  } {
    const now = simulatedNowMs ?? Date.now();
    const requesterId = this.normalizeRequesterId(rawRequesterId);
    this.lastActiveRequesterId = requesterId;

    const telemetry = this.getSyncTelemetry(requesterId, now);

    if (telemetry.next_allowed_seconds > 0) {
      return {
        ok: false,
        status: 429,
        error: `Inter-server rate limit active for ID "${requesterId}": Minimum 15s gap between servers required for requests from the same ID. Please wait ${telemetry.next_allowed_seconds}s.`,
        telemetry
      };
    }

    if (telemetry.requests_today_count >= this.maxRequestsPerDay) {
      return {
        ok: false,
        status: 429,
        error: `Daily inter-server sync quota exhausted for ID "${requesterId}" (${this.maxRequestsPerDay}/${this.maxRequestsPerDay} requests used today). Maximum 2 requests per day allowed from the same ID.`,
        telemetry
      };
    }

    const existing = this.syncTimestampsById.get(requesterId) || [];
    existing.push(now);
    this.syncTimestampsById.set(requesterId, existing);

    const updatedTelemetry = this.getSyncTelemetry(requesterId, now);
    return {
      ok: true,
      status: 200,
      message: `Server synchronization successful for ID "${requesterId}"! Quota used: ${updatedTelemetry.requests_today_count}/${this.maxRequestsPerDay} today. Next request from "${requesterId}" allowed in 15s.`,
      telemetry: updatedTelemetry
    };
  }
}

export const licenseManager = new LicenseManager();

