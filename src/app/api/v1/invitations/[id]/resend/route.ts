import {
  withTenantContext,
  GuardedTenantHandlerContext,
} from "../../../../../../core/tenant/tenant-guard";
import { InvitationService } from "../../../../../../core/tenant/invitation.service";
import { ApiResponse } from "../../../../../../core/http/api-response";

/**
 * POST /api/v1/invitations/:id/resend
 * Resend an invitation (rotates token & resets expiration).
 */
export const POST = withTenantContext(
  async (
    ctx: GuardedTenantHandlerContext,
    routeCtx?: Record<string, unknown>,
  ) => {
    const params = (await (routeCtx?.params as Promise<{ id: string }>)) || {
      id: "",
    };
    const result = await InvitationService.resendInvitation(
      params.id,
      ctx.tenant.userId,
    );

    return ApiResponse.success({
      message: "Invitation resent successfully",
      ...result,
    });
  },
);
