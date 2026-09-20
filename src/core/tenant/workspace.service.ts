/**
 * Phase 12 — Multi-Tenant SaaS Workspace Service
 *
 * Manages logical environments (Workspaces) within an Organization.
 * Enforces composite unique constraints (organizationId + slug) and workspace archiving policies.
 */

import { db } from "../../database";
import {
  workspacesTable,
  organizationsTable,
  WORKSPACE_STATUS,
} from "../../database/schema/tenant-saas";
import { auditLogsTable } from "../../database/schema";
import { eq, and } from "drizzle-orm";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../errors/errors";
import { TenantContext } from "./tenant-context";
import { TenantMemoryStore, MemoryWorkspace } from "./tenant-memory-store";
import crypto from "crypto";

export interface CreateWorkspaceInput {
  name: string;
  slug: string;
  description?: string;
  settings?: Record<string, unknown>;
}

export interface UpdateWorkspaceInput {
  name?: string;
  description?: string;
  settings?: Record<string, unknown>;
}

export class WorkspaceService {
  /**
   * Normalize workspace slug
   */
  public static normalizeSlug(slug: string): string {
    const normalized = slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    if (!normalized || normalized.length < 2 || normalized.length > 100) {
      throw new BadRequestError(
        "Workspace slug must be between 2 and 100 URL-safe characters",
      );
    }
    return normalized;
  }

  /**
   * Create a new Workspace within an Organization
   */
  public static async createWorkspace(
    organizationId: string,
    input: CreateWorkspaceInput,
    userId: string,
  ) {
    // Phase 13 — Entitlement Check: MAX_WORKSPACES
    const { entitlementService } =
      await import("../subscription/entitlement.service");
    const { EntitlementLimitExceededError } =
      await import("../subscription/errors");
    const limitCheck = await entitlementService.checkLimit(
      organizationId,
      "MAX_WORKSPACES",
      1,
    );
    if (!limitCheck.allowed) {
      throw new EntitlementLimitExceededError(
        "MAX_WORKSPACES",
        limitCheck.currentUsage,
        limitCheck.limit,
        1,
      );
    }

    const slug = this.normalizeSlug(input.slug);

    try {
      // Check composite uniqueness (organizationId + slug)
      const [existing] = await db
        .select({ id: workspacesTable.id })
        .from(workspacesTable)
        .where(
          and(
            eq(workspacesTable.organizationId, organizationId),
            eq(workspacesTable.slug, slug),
          ),
        )
        .limit(1);

      if (existing) {
        throw new ConflictError(
          `Workspace slug '${slug}' already exists in this organization`,
        );
      }

      const defaultSettings = {
        defaultMapProvider: "osm",
        defaultCenter: [77.209, 28.6139],
        defaultZoom: 10,
        defaultLayers: [],
        initialViewport: { longitude: 77.209, latitude: 28.6139, zoom: 10 },
        ...input.settings,
      };

      const [workspace] = await db
        .insert(workspacesTable)
        .values({
          organizationId,
          name: input.name.trim(),
          slug,
          description: input.description,
          status: WORKSPACE_STATUS.ACTIVE,
          settings: defaultSettings,
          createdBy: userId,
        })
        .returning();

      TenantMemoryStore.workspaces.set(workspace.id, {
        ...workspace,
        settings: (workspace.settings as Record<string, unknown>) || {},
      });
      return workspace;
    } catch (err) {
      if (TenantMemoryStore.isConnRefused(err)) {
        const existingMem = Array.from(
          TenantMemoryStore.workspaces.values(),
        ).find((w) => w.organizationId === organizationId && w.slug === slug);

        if (existingMem) {
          throw new ConflictError(
            `Workspace slug '${slug}' already exists in this organization`,
          );
        }

        const wsId = `ws_${crypto.randomUUID()}`;
        const memWs: MemoryWorkspace = {
          id: wsId,
          organizationId,
          name: input.name.trim(),
          slug,
          description: input.description || null,
          status: WORKSPACE_STATUS.ACTIVE,
          settings: input.settings || {
            defaultMapProvider: "osm",
            defaultCenter: [77.209, 28.6139],
            defaultZoom: 10,
          },
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        TenantMemoryStore.workspaces.set(wsId, memWs);
        return memWs;
      }
      throw err;
    }
  }

  /**
   * List all Workspaces in an Organization
   */
  public static async listWorkspaces(
    organizationId: string,
    includeArchived = false,
  ) {
    try {
      const conditions = [eq(workspacesTable.organizationId, organizationId)];
      if (!includeArchived) {
        conditions.push(eq(workspacesTable.status, WORKSPACE_STATUS.ACTIVE));
      }

      return await db
        .select()
        .from(workspacesTable)
        .where(and(...conditions));
    } catch (err) {
      if (TenantMemoryStore.isConnRefused(err)) {
        return Array.from(TenantMemoryStore.workspaces.values()).filter(
          (w) =>
            w.organizationId === organizationId &&
            (includeArchived || w.status === WORKSPACE_STATUS.ACTIVE),
        );
      }
      throw err;
    }
  }

  /**
   * Get Workspace by ID
   */
  public static async getWorkspaceById(id: string, organizationId?: string) {
    try {
      const conditions = [eq(workspacesTable.id, id)];
      if (organizationId) {
        conditions.push(eq(workspacesTable.organizationId, organizationId));
      }

      const [ws] = await db
        .select()
        .from(workspacesTable)
        .where(and(...conditions))
        .limit(1);

      if (!ws) {
        throw new NotFoundError("Workspace not found");
      }
      return ws;
    } catch (err) {
      if (TenantMemoryStore.isConnRefused(err)) {
        const ws = TenantMemoryStore.workspaces.get(id);
        if (!ws || (organizationId && ws.organizationId !== organizationId)) {
          throw new NotFoundError("Workspace not found");
        }
        return ws;
      }
      throw err;
    }
  }

  /**
   * Update Workspace
   */
  public static async updateWorkspace(
    id: string,
    input: UpdateWorkspaceInput,
    context: TenantContext,
  ) {
    const ws = await this.getWorkspaceById(id, context.organizationId);

    if (ws.status === WORKSPACE_STATUS.ARCHIVED) {
      throw new ForbiddenError("Cannot update an archived workspace");
    }

    try {
      const updateFields: Partial<typeof workspacesTable.$inferInsert> = {
        updatedAt: new Date(),
      };

      if (input.name !== undefined) updateFields.name = input.name.trim();
      if (input.description !== undefined)
        updateFields.description = input.description;
      if (input.settings !== undefined) {
        updateFields.settings = {
          ...(ws.settings as Record<string, unknown>),
          ...input.settings,
        };
      }

      const [updated] = await db
        .update(workspacesTable)
        .set(updateFields)
        .where(eq(workspacesTable.id, id))
        .returning();

      return updated;
    } catch (err) {
      if (TenantMemoryStore.isConnRefused(err)) {
        const memWs = TenantMemoryStore.workspaces.get(id);
        if (!memWs) throw new NotFoundError("Workspace not found");
        if (input.name !== undefined) memWs.name = input.name.trim();
        if (input.description !== undefined)
          memWs.description = input.description;
        if (input.settings !== undefined) {
          memWs.settings = { ...memWs.settings, ...input.settings };
        }
        memWs.updatedAt = new Date();
        TenantMemoryStore.workspaces.set(id, memWs);
        return memWs;
      }
      throw err;
    }
  }

  /**
   * Archive Workspace (Prevents new writes)
   */
  public static async archiveWorkspace(id: string, context: TenantContext) {
    const ws = await this.getWorkspaceById(id, context.organizationId);

    if (ws.status === WORKSPACE_STATUS.ARCHIVED) {
      return ws;
    }

    try {
      const [archived] = await db
        .update(workspacesTable)
        .set({
          status: WORKSPACE_STATUS.ARCHIVED,
          updatedAt: new Date(),
        })
        .where(eq(workspacesTable.id, id))
        .returning();

      return archived;
    } catch (err) {
      if (TenantMemoryStore.isConnRefused(err)) {
        const memWs = TenantMemoryStore.workspaces.get(id);
        if (!memWs) throw new NotFoundError("Workspace not found");
        memWs.status = WORKSPACE_STATUS.ARCHIVED;
        memWs.updatedAt = new Date();
        TenantMemoryStore.workspaces.set(id, memWs);
        return memWs;
      }
      throw err;
    }
  }
}
