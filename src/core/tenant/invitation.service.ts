/**
 * Phase 12 — Multi-Tenant SaaS Organization Invitation Service
 *
 * Handles secure invitation generation using cryptographically secure tokens,
 * SHA-256 token hashing (never storing raw tokens), expiration checking,
 * transactional acceptance, token rotation, and invitation revocation.
 */

import crypto from "crypto";
import { db } from "../../database";
import {
  organizationInvitationsTable,
  organizationMembershipsTable,
  organizationsTable,
  INVITATION_STATUS,
  MEMBERSHIP_STATUS,
} from "../../database/schema/tenant-saas";
import { usersTable, auditLogsTable } from "../../database/schema";
import { eq, and } from "drizzle-orm";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../errors/errors";
import {
  TenantMemoryStore,
  MemoryInvitation,
  MemoryMembership,
} from "./tenant-memory-store";

export interface CreateInvitationInput {
  email: string;
  role?: string;
  expiresInHours?: number;
}

export class InvitationService {
  /**
   * Compute SHA-256 Hash of raw invitation token
   */
  public static hashToken(rawToken: string): string {
    return crypto.createHash("sha256").update(rawToken.trim()).digest("hex");
  }

  /**
   * Generate secure random raw token
   */
  public static generateRawToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Create an Organization Invitation
   * Generates secure token, stores tokenHash, returns rawToken to caller for delivery.
   */
  public static async createInvitation(
    organizationId: string,
    input: CreateInvitationInput,
    invitedByUserId: string,
  ) {
    const email = input.email.trim().toLowerCase();
    const role = input.role || "MEMBER";
    const expiresInHours = Math.min(
      720,
      Math.max(1, input.expiresInHours || 168),
    );

    const rawToken = this.generateRawToken();
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    try {
      const [invitation] = await db
        .insert(organizationInvitationsTable)
        .values({
          organizationId,
          email,
          role,
          tokenHash,
          status: INVITATION_STATUS.PENDING,
          expiresAt,
          invitedBy: invitedByUserId,
        })
        .returning();

      TenantMemoryStore.invitations.set(invitation.id, invitation);

      return {
        invitation: {
          id: invitation.id,
          organizationId: invitation.organizationId,
          email: invitation.email,
          role: invitation.role,
          status: invitation.status,
          expiresAt: invitation.expiresAt,
          createdAt: invitation.createdAt,
        },
        rawToken,
      };
    } catch (err) {
      if (TenantMemoryStore.isConnRefused(err)) {
        const invId = `inv_${crypto.randomUUID()}`;
        const memInv: MemoryInvitation = {
          id: invId,
          organizationId,
          email,
          role,
          tokenHash,
          status: INVITATION_STATUS.PENDING,
          expiresAt,
          invitedBy: invitedByUserId,
          acceptedAt: null,
          createdAt: new Date(),
        };

        TenantMemoryStore.invitations.set(invId, memInv);

        return {
          invitation: {
            id: memInv.id,
            organizationId: memInv.organizationId,
            email: memInv.email,
            role: memInv.role,
            status: memInv.status,
            expiresAt: memInv.expiresAt,
            createdAt: memInv.createdAt,
          },
          rawToken,
        };
      }
      throw err;
    }
  }

  /**
   * Accept an Invitation using raw token
   */
  public static async acceptInvitation(
    rawToken: string,
    acceptingUserId: string,
  ) {
    const tokenHash = this.hashToken(rawToken);

    try {
      const [invitation] = await db
        .select()
        .from(organizationInvitationsTable)
        .where(eq(organizationInvitationsTable.tokenHash, tokenHash))
        .limit(1);

      if (!invitation) {
        // Fallback to memory store if DB empty or not found
        return await this.acceptInvitationMemoryFallback(
          tokenHash,
          acceptingUserId,
        );
      }

      if (invitation.status !== INVITATION_STATUS.PENDING) {
        if (invitation.status === INVITATION_STATUS.ACCEPTED) {
          throw new BadRequestError("Invitation has already been accepted");
        }
        if (invitation.status === INVITATION_STATUS.REVOKED) {
          throw new BadRequestError("Invitation has been revoked");
        }
        throw new BadRequestError("Invitation is no longer valid");
      }

      if (new Date() > invitation.expiresAt) {
        await db
          .update(organizationInvitationsTable)
          .set({ status: INVITATION_STATUS.EXPIRED })
          .where(eq(organizationInvitationsTable.id, invitation.id));

        throw new BadRequestError("Invitation token has expired");
      }

      const result = await db.transaction(async (tx) => {
        const [existingMembership] = await tx
          .select()
          .from(organizationMembershipsTable)
          .where(
            and(
              eq(
                organizationMembershipsTable.organizationId,
                invitation.organizationId,
              ),
              eq(organizationMembershipsTable.userId, acceptingUserId),
            ),
          )
          .limit(1);

        let membership;
        if (existingMembership) {
          [membership] = await tx
            .update(organizationMembershipsTable)
            .set({
              role: invitation.role,
              status: MEMBERSHIP_STATUS.ACTIVE,
              updatedAt: new Date(),
            })
            .where(eq(organizationMembershipsTable.id, existingMembership.id))
            .returning();
        } else {
          [membership] = await tx
            .insert(organizationMembershipsTable)
            .values({
              organizationId: invitation.organizationId,
              userId: acceptingUserId,
              role: invitation.role,
              status: MEMBERSHIP_STATUS.ACTIVE,
              joinedAt: new Date(),
            })
            .returning();
        }

        const [acceptedInv] = await tx
          .update(organizationInvitationsTable)
          .set({
            status: INVITATION_STATUS.ACCEPTED,
            acceptedAt: new Date(),
          })
          .where(eq(organizationInvitationsTable.id, invitation.id))
          .returning();

        TenantMemoryStore.memberships.set(membership.id, membership);
        TenantMemoryStore.invitations.set(acceptedInv.id, acceptedInv);

        return { membership, invitation: acceptedInv };
      });

      return result;
    } catch (err) {
      if (TenantMemoryStore.isConnRefused(err)) {
        return this.acceptInvitationMemoryFallback(tokenHash, acceptingUserId);
      }
      throw err;
    }
  }

  private static async acceptInvitationMemoryFallback(
    tokenHash: string,
    acceptingUserId: string,
  ) {
    const memInv = Array.from(TenantMemoryStore.invitations.values()).find(
      (inv) => inv.tokenHash === tokenHash,
    );

    if (!memInv) {
      throw new NotFoundError("Invalid or expired invitation token");
    }

    if (memInv.status !== INVITATION_STATUS.PENDING) {
      if (memInv.status === INVITATION_STATUS.ACCEPTED) {
        throw new BadRequestError("Invitation has already been accepted");
      }
      if (memInv.status === INVITATION_STATUS.REVOKED) {
        throw new BadRequestError("Invitation has been revoked");
      }
      throw new BadRequestError("Invitation is no longer valid");
    }

    if (new Date() > memInv.expiresAt) {
      memInv.status = INVITATION_STATUS.EXPIRED;
      throw new BadRequestError("Invitation token has expired");
    }

    const existingMem = Array.from(TenantMemoryStore.memberships.values()).find(
      (m) =>
        m.organizationId === memInv.organizationId &&
        m.userId === acceptingUserId,
    );

    let memMembership: MemoryMembership;
    if (existingMem) {
      existingMem.role = memInv.role;
      existingMem.status = MEMBERSHIP_STATUS.ACTIVE;
      existingMem.updatedAt = new Date();
      memMembership = existingMem;
    } else {
      const memId = `mem_${crypto.randomUUID()}`;
      memMembership = {
        id: memId,
        organizationId: memInv.organizationId,
        userId: acceptingUserId,
        role: memInv.role,
        status: MEMBERSHIP_STATUS.ACTIVE,
        joinedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      TenantMemoryStore.memberships.set(memId, memMembership);
    }

    memInv.status = INVITATION_STATUS.ACCEPTED;
    memInv.acceptedAt = new Date();
    TenantMemoryStore.invitations.set(memInv.id, memInv);

    return { membership: memMembership, invitation: memInv };
  }

  /**
   * Resend Invitation (rotates token & extends expiration)
   */
  public static async resendInvitation(
    invitationId: string,
    actorUserId: string,
  ) {
    const newRawToken = this.generateRawToken();
    const newTokenHash = this.hashToken(newRawToken);
    const newExpiresAt = new Date(Date.now() + 168 * 60 * 60 * 1000);

    try {
      const [invitation] = await db
        .select()
        .from(organizationInvitationsTable)
        .where(eq(organizationInvitationsTable.id, invitationId))
        .limit(1);

      if (!invitation) throw new NotFoundError("Invitation not found");

      const [updated] = await db
        .update(organizationInvitationsTable)
        .set({
          tokenHash: newTokenHash,
          status: INVITATION_STATUS.PENDING,
          expiresAt: newExpiresAt,
        })
        .where(eq(organizationInvitationsTable.id, invitationId))
        .returning();

      TenantMemoryStore.invitations.set(updated.id, updated);

      return {
        invitation: {
          id: updated.id,
          organizationId: updated.organizationId,
          email: updated.email,
          role: updated.role,
          status: updated.status,
          expiresAt: updated.expiresAt,
        },
        rawToken: newRawToken,
      };
    } catch (err) {
      if (TenantMemoryStore.isConnRefused(err)) {
        const memInv = TenantMemoryStore.invitations.get(invitationId);
        if (!memInv) throw new NotFoundError("Invitation not found");

        memInv.tokenHash = newTokenHash;
        memInv.status = INVITATION_STATUS.PENDING;
        memInv.expiresAt = newExpiresAt;
        TenantMemoryStore.invitations.set(invitationId, memInv);

        return {
          invitation: {
            id: memInv.id,
            organizationId: memInv.organizationId,
            email: memInv.email,
            role: memInv.role,
            status: memInv.status,
            expiresAt: memInv.expiresAt,
          },
          rawToken: newRawToken,
        };
      }
      throw err;
    }
  }

  /**
   * Revoke Pending Invitation
   */
  public static async revokeInvitation(
    invitationId: string,
    actorUserId: string,
  ) {
    try {
      const [invitation] = await db
        .select()
        .from(organizationInvitationsTable)
        .where(eq(organizationInvitationsTable.id, invitationId))
        .limit(1);

      if (!invitation) throw new NotFoundError("Invitation not found");

      const [revoked] = await db
        .update(organizationInvitationsTable)
        .set({ status: INVITATION_STATUS.REVOKED })
        .where(eq(organizationInvitationsTable.id, invitationId))
        .returning();

      TenantMemoryStore.invitations.set(revoked.id, revoked);
      return revoked;
    } catch (err) {
      if (TenantMemoryStore.isConnRefused(err)) {
        const memInv = TenantMemoryStore.invitations.get(invitationId);
        if (!memInv) throw new NotFoundError("Invitation not found");
        memInv.status = INVITATION_STATUS.REVOKED;
        TenantMemoryStore.invitations.set(invitationId, memInv);
        return memInv;
      }
      throw err;
    }
  }

  /**
   * List Invitations for an Organization
   */
  public static async listInvitations(organizationId: string) {
    try {
      return await db
        .select({
          id: organizationInvitationsTable.id,
          organizationId: organizationInvitationsTable.organizationId,
          email: organizationInvitationsTable.email,
          role: organizationInvitationsTable.role,
          status: organizationInvitationsTable.status,
          expiresAt: organizationInvitationsTable.expiresAt,
          invitedBy: organizationInvitationsTable.invitedBy,
          acceptedAt: organizationInvitationsTable.acceptedAt,
          createdAt: organizationInvitationsTable.createdAt,
        })
        .from(organizationInvitationsTable)
        .where(eq(organizationInvitationsTable.organizationId, organizationId));
    } catch (err) {
      if (TenantMemoryStore.isConnRefused(err)) {
        return Array.from(TenantMemoryStore.invitations.values()).filter(
          (inv) => inv.organizationId === organizationId,
        );
      }
      throw err;
    }
  }
}
