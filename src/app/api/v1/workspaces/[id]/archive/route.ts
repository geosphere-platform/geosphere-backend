import {
  withTenantContext,
  GuardedTenantHandlerContext,
} from "../../../../../../core/tenant/tenant-guard";
import { WorkspaceService } from "../../../../../../core/tenant/workspace.service";
import { ApiResponse } from "../../../../../../core/http/api-response";

/**
 * POST /api/v1/workspaces/:id/archive
 * Archive a workspace (prevents new writes).
 */
export const POST = withTenantContext(
  async (
    ctx: GuardedTenantHandlerContext,
    routeCtx?: Record<string, unknown>,
  ) => {
    const params = (await (routeCtx?.params as Promise<{ id: string }>)) || {
      id: ctx.tenant.workspaceId || "",
    };
    const archived = await WorkspaceService.archiveWorkspace(
      params.id,
      ctx.tenant,
    );

    return ApiResponse.success({
      ...archived,
      message: "Workspace archived successfully",
    });
  },
);
