import {
  withTenantContext,
  GuardedTenantHandlerContext,
} from "../../../../../../core/tenant/tenant-guard";
import { InvitationService } from "../../../../../../core/tenant/invitation.service";
import { ApiResponse } from "../../../../../../core/http/api-response";

/**
 * POST /api/v1/invitations/:id/revoke
 * Revoke a pending organization invitation.
 */
export const POST = withTenantContext(
  async (
    ctx: GuardedTenantHandlerContext,
    routeCtx?: Record<string, unknown>,
  ) => {
    const params = (await (routeCtx?.params as Promise<{ id: string }>)) || {
      id: "",
    };
    const revoked = await InvitationService.revokeInvitation(
      params.id,
      ctx.tenant.userId,
    );

    return ApiResponse.success({
      message: "Invitation revoked",
      invitation: revoked,
    });
  },
);
