/**
 * Phase 12 — Multi-Tenant SaaS TenantContext Abstraction & Resolution Service
 *
 * Provides backend authorization boundary, tenant isolation enforcement,
 * membership context resolution, and workspace verification.
 */

import { NextRequest } from "next/server";
import { db } from "../../database";
import {
  organizationsTable,
  workspacesTable,
  organizationMembershipsTable,
  ORGANIZATION_STATUS,
  WORKSPACE_STATUS,
  MEMBERSHIP_STATUS,
} from "../../database/schema/tenant-saas";
import { eq, and } from "drizzle-orm";
import { ForbiddenError, NotFoundError } from "../errors/errors";
import { UserRole, Permission } from "../constants";
import { getPermissionsForRole } from "../auth/permissions";
import {
  TenantMemoryStore,
  MemoryOrganization,
  MemoryMembership,
  MemoryWorkspace,
} from "./tenant-memory-store";

export interface TenantContext {
  userId: string;
  userRole: UserRole; // Global user role
  organizationId: string;
  organizationSlug: string;
  workspaceId?: string;
  workspaceSlug?: string;
  membership: {
    id: string;
    role: string;
    status: string;
  };
  permissions: ReadonlyArray<Permission>;
  isPlatformAdmin: boolean;
}

export class TenantContextService {
  /**
   * Resolves and validates the TenantContext for an incoming HTTP request.
   *
   * Headers inspected:
   * - x-organization-id or x-organization-slug
   * - x-workspace-id or x-workspace-slug
   */
  public static async resolveTenantContext(
    userId: string,
    globalRole: UserRole,
    req: NextRequest,
  ): Promise<TenantContext> {
    const isPlatformAdmin =
      globalRole === "PLATFORM_ADMIN" || globalRole === "SUPER_ADMIN";

    const requestedOrgId = req.headers.get("x-organization-id") || undefined;
    const requestedOrgSlug =
      req.headers.get("x-organization-slug") || undefined;
    const requestedWorkspaceId = req.headers.get("x-workspace-id") || undefined;
    const requestedWorkspaceSlug =
      req.headers.get("x-workspace-slug") || undefined;

    try {
      let orgRecord:
        typeof organizationsTable.$inferSelect | MemoryOrganization | undefined;

      // 1. Resolve Organization
      if (requestedOrgId) {
        const [found] = await db
          .select()
          .from(organizationsTable)
          .where(eq(organizationsTable.id, requestedOrgId))
          .limit(1);
        orgRecord = found;
      } else if (requestedOrgSlug) {
        const [found] = await db
          .select()
          .from(organizationsTable)
          .where(eq(organizationsTable.slug, requestedOrgSlug.toLowerCase()))
          .limit(1);
        orgRecord = found;
      } else {
        const [firstMembership] = await db
          .select({
            org: organizationsTable,
          })
          .from(organizationMembershipsTable)
          .innerJoin(
            organizationsTable,
            eq(
              organizationMembershipsTable.organizationId,
              organizationsTable.id,
            ),
          )
          .where(
            and(
              eq(organizationMembershipsTable.userId, userId),
              eq(organizationMembershipsTable.status, MEMBERSHIP_STATUS.ACTIVE),
              eq(organizationsTable.status, ORGANIZATION_STATUS.ACTIVE),
            ),
          )
          .limit(1);

        if (firstMembership) {
          orgRecord = firstMembership.org;
        }
      }

      if (!orgRecord) {
        // Try memory store fallback
        return this.resolveTenantContextMemoryFallback(
          userId,
          globalRole,
          requestedOrgId,
          requestedOrgSlug,
          requestedWorkspaceId,
          requestedWorkspaceSlug,
          isPlatformAdmin,
        );
      }

      if (orgRecord.status === ORGANIZATION_STATUS.SUSPENDED) {
        throw new ForbiddenError("Organization account is currently suspended");
      }
      if (orgRecord.status === ORGANIZATION_STATUS.ARCHIVED) {
        throw new ForbiddenError("Organization account is archived");
      }

      // 2. Resolve Membership
      let membershipRecord:
        | typeof organizationMembershipsTable.$inferSelect
        | MemoryMembership
        | undefined;

      const [foundMembership] = await db
        .select()
        .from(organizationMembershipsTable)
        .where(
          and(
            eq(organizationMembershipsTable.organizationId, orgRecord.id),
            eq(organizationMembershipsTable.userId, userId),
          ),
        )
        .limit(1);

      membershipRecord = foundMembership;

      if (!membershipRecord) {
        // Fallback to memory store check before throwing
        const memMembership = Array.from(
          TenantMemoryStore.memberships.values(),
        ).find(
          (m) => m.organizationId === orgRecord!.id && m.userId === userId,
        );
        if (memMembership) {
          membershipRecord = memMembership;
        } else if (!isPlatformAdmin) {
          throw new ForbiddenError("User is not a member of this organization");
        } else {
          membershipRecord = {
            id: "platform-admin-membership",
            organizationId: orgRecord.id,
            userId: userId,
            role: "OWNER",
            status: MEMBERSHIP_STATUS.ACTIVE,
            joinedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }
      }

      if (membershipRecord.status === MEMBERSHIP_STATUS.SUSPENDED) {
        throw new ForbiddenError(
          "User membership in this organization is suspended",
        );
      }
      if (membershipRecord.status === MEMBERSHIP_STATUS.REMOVED) {
        throw new ForbiddenError(
          "User membership in this organization has been removed",
        );
      }

      const effectiveRole = (membershipRecord.role as UserRole) || globalRole;
      const permissions = getPermissionsForRole(effectiveRole);

      // 3. Resolve Workspace
      let workspaceRecord:
        typeof workspacesTable.$inferSelect | MemoryWorkspace | undefined;

      if (requestedWorkspaceId) {
        const [foundWs] = await db
          .select()
          .from(workspacesTable)
          .where(
            and(
              eq(workspacesTable.id, requestedWorkspaceId),
              eq(workspacesTable.organizationId, orgRecord.id),
            ),
          )
          .limit(1);
        workspaceRecord = foundWs;
      } else if (requestedWorkspaceSlug) {
        const [foundWs] = await db
          .select()
          .from(workspacesTable)
          .where(
            and(
              eq(workspacesTable.organizationId, orgRecord.id),
              eq(workspacesTable.slug, requestedWorkspaceSlug.toLowerCase()),
            ),
          )
          .limit(1);
        workspaceRecord = foundWs;
      } else {
        const [defaultWs] = await db
          .select()
          .from(workspacesTable)
          .where(
            and(
              eq(workspacesTable.organizationId, orgRecord.id),
              eq(workspacesTable.status, WORKSPACE_STATUS.ACTIVE),
            ),
          )
          .limit(1);
        workspaceRecord = defaultWs;
      }

      if (!workspaceRecord) {
        const memWs = Array.from(TenantMemoryStore.workspaces.values()).find(
          (w) =>
            w.organizationId === orgRecord!.id &&
            w.status === WORKSPACE_STATUS.ACTIVE,
        );
        if (memWs) workspaceRecord = memWs;
      }

      return {
        userId,
        userRole: globalRole,
        organizationId: orgRecord.id,
        organizationSlug: orgRecord.slug,
        workspaceId: workspaceRecord?.id,
        workspaceSlug: workspaceRecord?.slug,
        membership: {
          id: membershipRecord.id,
          role: membershipRecord.role,
          status: membershipRecord.status,
        },
        permissions,
        isPlatformAdmin,
      };
    } catch (err) {
      if (err instanceof ForbiddenError || err instanceof NotFoundError) {
        throw err;
      }
      if (TenantMemoryStore.isConnRefused(err)) {
        return this.resolveTenantContextMemoryFallback(
          userId,
          globalRole,
          requestedOrgId,
          requestedOrgSlug,
          requestedWorkspaceId,
          requestedWorkspaceSlug,
          isPlatformAdmin,
        );
      }
      throw err;
    }
  }

  private static resolveTenantContextMemoryFallback(
    userId: string,
    globalRole: UserRole,
    requestedOrgId?: string,
    requestedOrgSlug?: string,
    requestedWorkspaceId?: string,
    requestedWorkspaceSlug?: string,
    isPlatformAdmin = false,
  ): TenantContext {
    let orgRecord: MemoryOrganization | undefined;

    if (requestedOrgId) {
      orgRecord = TenantMemoryStore.organizations.get(requestedOrgId);
    } else if (requestedOrgSlug) {
      orgRecord = Array.from(TenantMemoryStore.organizations.values()).find(
        (o) => o.slug === requestedOrgSlug.toLowerCase(),
      );
    } else {
      const firstMembership = Array.from(
        TenantMemoryStore.memberships.values(),
      ).find(
        (m) =>
          m.userId === userId &&
          m.status === MEMBERSHIP_STATUS.ACTIVE &&
          TenantMemoryStore.organizations.get(m.organizationId)?.status ===
            ORGANIZATION_STATUS.ACTIVE,
      );
      if (firstMembership) {
        orgRecord = TenantMemoryStore.organizations.get(
          firstMembership.organizationId,
        );
      }
    }

    if (!orgRecord) {
      throw new NotFoundError("Organization not found or inactive context");
    }

    if (orgRecord.status === ORGANIZATION_STATUS.SUSPENDED) {
      throw new ForbiddenError("Organization account is currently suspended");
    }
    if (orgRecord.status === ORGANIZATION_STATUS.ARCHIVED) {
      throw new ForbiddenError("Organization account is archived");
    }

    let membershipRecord = Array.from(
      TenantMemoryStore.memberships.values(),
    ).find((m) => m.organizationId === orgRecord!.id && m.userId === userId);

    if (!membershipRecord) {
      if (!isPlatformAdmin) {
        throw new ForbiddenError("User is not a member of this organization");
      }
      membershipRecord = {
        id: "platform-admin-membership",
        organizationId: orgRecord.id,
        userId: userId,
        role: "OWNER",
        status: MEMBERSHIP_STATUS.ACTIVE,
        joinedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    if (membershipRecord.status === MEMBERSHIP_STATUS.SUSPENDED) {
      throw new ForbiddenError(
        "User membership in this organization is suspended",
      );
    }
    if (membershipRecord.status === MEMBERSHIP_STATUS.REMOVED) {
      throw new ForbiddenError(
        "User membership in this organization has been removed",
      );
    }

    const effectiveRole = (membershipRecord.role as UserRole) || globalRole;
    const permissions = getPermissionsForRole(effectiveRole);

    let workspaceRecord: MemoryWorkspace | undefined;
    if (requestedWorkspaceId) {
      const found = TenantMemoryStore.workspaces.get(requestedWorkspaceId);
      if (found && found.organizationId === orgRecord.id) {
        workspaceRecord = found;
      }
    } else if (requestedWorkspaceSlug) {
      workspaceRecord = Array.from(TenantMemoryStore.workspaces.values()).find(
        (w) =>
          w.organizationId === orgRecord!.id &&
          w.slug === requestedWorkspaceSlug.toLowerCase(),
      );
    } else {
      workspaceRecord = Array.from(TenantMemoryStore.workspaces.values()).find(
        (w) =>
          w.organizationId === orgRecord!.id &&
          w.status === WORKSPACE_STATUS.ACTIVE,
      );
    }

    return {
      userId,
      userRole: globalRole,
      organizationId: orgRecord.id,
      organizationSlug: orgRecord.slug,
      workspaceId: workspaceRecord?.id,
      workspaceSlug: workspaceRecord?.slug,
      membership: {
        id: membershipRecord.id,
        role: membershipRecord.role,
        status: membershipRecord.status,
      },
      permissions,
      isPlatformAdmin,
    };
  }
}
