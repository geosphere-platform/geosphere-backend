import {
  withTenantContext,
  GuardedTenantHandlerContext,
} from "../../../../../../core/tenant/tenant-guard";
import { OrganizationService } from "../../../../../../core/tenant/organization.service";
import { ApiResponse } from "../../../../../../core/http/api-response";
import { BadRequestError } from "../../../../../../core/errors/errors";

/**
 * POST /api/v1/organizations/:id/transfer-ownership
 * Transactional transfer of organization ownership to a target member.
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

    if (!body.targetUserId) {
      throw new BadRequestError(
        "targetUserId is required for ownership transfer",
      );
    }

    const updatedOrg = await OrganizationService.transferOwnership(
      params.id,
      body.targetUserId,
      ctx.tenant.userId,
      ctx.tenant.isPlatformAdmin,
    );

    return ApiResponse.success({
      message: "Organization ownership successfully transferred",
      organization: updatedOrg,
    });
  },
);
