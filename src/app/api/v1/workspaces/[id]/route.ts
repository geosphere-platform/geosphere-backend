import {
  withTenantContext,
  GuardedTenantHandlerContext,
} from "../../../../../core/tenant/tenant-guard";
import { WorkspaceService } from "../../../../../core/tenant/workspace.service";
import { ApiResponse } from "../../../../../core/http/api-response";

/**
 * GET /api/v1/workspaces/:id
 * Get workspace details by ID.
 */
export const GET = withTenantContext(
  async (
    ctx: GuardedTenantHandlerContext,
    routeCtx?: Record<string, unknown>,
  ) => {
    const params = (await (routeCtx?.params as Promise<{ id: string }>)) || {
      id: ctx.tenant.workspaceId || "",
    };
    const workspace = await WorkspaceService.getWorkspaceById(
      params.id,
      ctx.tenant.organizationId,
    );
    return ApiResponse.success(workspace);
  },
);

/**
 * PATCH /api/v1/workspaces/:id
 * Update workspace configuration or metadata.
 */
export const PATCH = withTenantContext(
  async (
    ctx: GuardedTenantHandlerContext,
    routeCtx?: Record<string, unknown>,
  ) => {
    const params = (await (routeCtx?.params as Promise<{ id: string }>)) || {
      id: ctx.tenant.workspaceId || "",
    };
    const body = await ctx.request.json();

    const updated = await WorkspaceService.updateWorkspace(
      params.id,
      {
        name: body.name,
        description: body.description,
        settings: body.settings,
      },
      ctx.tenant,
    );

    return ApiResponse.success(updated);
  },
);
