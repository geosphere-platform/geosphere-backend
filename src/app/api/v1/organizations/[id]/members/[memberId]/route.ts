import {
  withTenantContext,
  GuardedTenantHandlerContext,
} from "../../../../../../../core/tenant/tenant-guard";
import { MembershipService } from "../../../../../../../core/tenant/membership.service";
import { ApiResponse } from "../../../../../../../core/http/api-response";

/**
 * PATCH /api/v1/organizations/:id/members/:memberId
 * Update member role or status.
 */
export const PATCH = withTenantContext(
  async (
    ctx: GuardedTenantHandlerContext,
    routeCtx?: Record<string, unknown>,
  ) => {
    const params = (await (routeCtx?.params as Promise<{
      id: string;
      memberId: string;
    }>)) || {
      id: ctx.tenant.organizationId,
      memberId: "",
    };
    const body = await ctx.request.json();

    let updated;
    if (body.role !== undefined) {
      updated = await MembershipService.updateMemberRole(
        params.id,
        params.memberId,
        body.role,
        ctx.tenant.userId,
      );
    }
    if (body.status !== undefined) {
      updated = await MembershipService.updateMemberStatus(
        params.id,
        params.memberId,
        body.status,
        ctx.tenant.userId,
      );
    }

    return ApiResponse.success(updated);
  },
);

/**
 * DELETE /api/v1/organizations/:id/members/:memberId
 * Remove member from organization.
 */
export const DELETE = withTenantContext(
  async (
    ctx: GuardedTenantHandlerContext,
    routeCtx?: Record<string, unknown>,
  ) => {
    const params = (await (routeCtx?.params as Promise<{
      id: string;
      memberId: string;
    }>)) || {
      id: ctx.tenant.organizationId,
      memberId: "",
    };

    const removed = await MembershipService.removeMember(
      params.id,
      params.memberId,
      ctx.tenant.userId,
    );

    return ApiResponse.success({
      message: "Member removed successfully",
      membership: removed,
    });
  },
);
