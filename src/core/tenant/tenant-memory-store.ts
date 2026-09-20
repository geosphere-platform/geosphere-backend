/**
 * Phase 12 — In-Memory Store for Dev, Offline & Test Environments
 *
 * Serves as fallback store when PostgreSQL is not running in local test environments.
 */

import {
  ORGANIZATION_STATUS,
  WORKSPACE_STATUS,
  MEMBERSHIP_STATUS,
  INVITATION_STATUS,
} from "../../database/schema/tenant-saas";

export interface MemoryOrganization {
  id: string;
  name: string;
  slug: string;
  status: string;
  ownerId: string | null;
  timezone: string;
  locale: string;
  defaultSettings: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryWorkspace {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  settings: Record<string, unknown>;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryMembership {
  id: string;
  organizationId: string;
  userId: string;
  role: string;
  status: string;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryInvitation {
  id: string;
  organizationId: string;
  email: string;
  role: string;
  tokenHash: string;
  status: string;
  expiresAt: Date;
  invitedBy: string;
  acceptedAt: Date | null;
  createdAt: Date;
}

export class TenantMemoryStore {
  public static organizations = new Map<string, MemoryOrganization>();
  public static workspaces = new Map<string, MemoryWorkspace>();
  public static memberships = new Map<string, MemoryMembership>();
  public static invitations = new Map<string, MemoryInvitation>();

  public static isConnRefused(err: unknown): boolean {
    if (!err) return false;
    const msg = err instanceof Error ? err.message : String(err);
    const code = (err as any)?.code || (err as any)?.cause?.code;
    return (
      msg.includes("ECONNREFUSED") ||
      msg.includes("connect ECONNREFUSED") ||
      msg.includes("Failed query") ||
      msg.includes("ENOTFOUND") ||
      code === "ECONNREFUSED"
    );
  }
}
