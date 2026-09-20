import {
  withTenantContext,
  GuardedTenantHandlerContext,
} from "../../../../../../core/tenant/tenant-guard";
import { WorkspaceService } from "../../../../../../core/tenant/workspace.service";
import { ApiResponse } from "../../../../../../core/http/api-response";
import { BadRequestError } from "../../../../../../core/errors/errors";

/**
 * GET /api/v1/organizations/:id/workspaces
 * List workspaces in organization.
 */
export const GET = withTenantContext(
  async (
    ctx: GuardedTenantHandlerContext,
    routeCtx?: Record<string, unknown>,
  ) => {
    const params = (await (routeCtx?.params as Promise<{ id: string }>)) || {
      id: ctx.tenant.organizationId,
    };
    const { searchParams } = ctx.request.nextUrl;
    const includeArchived = searchParams.get("includeArchived") === "true";

    const workspaces = await WorkspaceService.listWorkspaces(
      params.id,
      includeArchived,
    );
    return ApiResponse.success(workspaces);
  },
);

/**
 * POST /api/v1/organizations/:id/workspaces
 * Create a new workspace in organization.
 */
export const POST = withTenantContext(
  async (
    ctx: GuardedTenantHandlerContext,
    routeCtx?: Record<string, unknown>,
  ) => {
    const params = (await (routeCtx?.params as Promise<{ id: string }>)) || {
      id: ctx.tenant.organizationId,
    };
    const body = await ctx.request.json();

    if (!body.name || !body.slug) {
      throw new BadRequestError("Workspace name and slug are required");
    }

    const workspace = await WorkspaceService.createWorkspace(
      params.id,
      {
        name: body.name,
        slug: body.slug,
        description: body.description,
        settings: body.settings,
      },
      ctx.tenant.userId,
    );

    return ApiResponse.success(workspace, 201);
  },
);
