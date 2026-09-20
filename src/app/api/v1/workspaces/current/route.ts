import {
  withTenantContext,
  GuardedTenantHandlerContext,
} from "../../../../../core/tenant/tenant-guard";
import { WorkspaceService } from "../../../../../core/tenant/workspace.service";
import { ApiResponse } from "../../../../../core/http/api-response";
import { NotFoundError } from "../../../../../core/errors/errors";

/**
 * GET /api/v1/workspaces/current
 * Return active workspace details for the resolved TenantContext.
 */
export const GET = withTenantContext(
  async (ctx: GuardedTenantHandlerContext) => {
    if (!ctx.tenant.workspaceId) {
      throw new NotFoundError("No active workspace context resolved");
    }

    const workspace = await WorkspaceService.getWorkspaceById(
      ctx.tenant.workspaceId,
      ctx.tenant.organizationId,
    );

    return ApiResponse.success({
      workspace,
      organizationId: ctx.tenant.organizationId,
      organizationSlug: ctx.tenant.organizationSlug,
      permissions: ctx.tenant.permissions,
    });
  },
);
