/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AttackGraphNode {
  id: string;
  hostname: string;
  ip: string;
  os: string;
  role: string;
  type: 'attacker' | 'workstation' | 'server' | 'domain_controller' | 'database' | 'cloud';
  isCompromised: boolean;
  compromisedCredentials: string[];
  extractedIocs: string[];
  blastRadiusScore: number;
  x?: number;
  y?: number;
}

export interface AttackGraphEdge {
  id: string;
  source: string;
  target: string;
  techniqueId: string;
  techniqueName: string;
  protocol: string;
  evidence: string;
}
