import { withAuth, AuthContext } from "../../../../../../core/auth/guards";
import { InvitationService } from "../../../../../../core/tenant/invitation.service";
import { ApiResponse } from "../../../../../../core/http/api-response";
import { BadRequestError } from "../../../../../../core/errors/errors";

/**
 * POST /api/v1/invitations/:id/accept
 * Accept an organization invitation using token/id.
 */
export const POST = withAuth(
  async (ctx: AuthContext, routeCtx?: Record<string, unknown>) => {
    const params =
      (await (routeCtx?.params as Promise<{ id?: string; token?: string }>)) ||
      {};
    const rawToken = params.id || params.token || "";

    if (!rawToken) {
      throw new BadRequestError("Invitation token is required");
    }

    const result = await InvitationService.acceptInvitation(
      rawToken,
      ctx.user.sub,
    );

    return ApiResponse.success({
      message: "Invitation successfully accepted",
      membership: result.membership,
    });
  },
);
