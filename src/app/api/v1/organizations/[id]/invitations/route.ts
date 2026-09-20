import {
  withTenantContext,
  GuardedTenantHandlerContext,
} from "../../../../../../core/tenant/tenant-guard";
import { InvitationService } from "../../../../../../core/tenant/invitation.service";
import { ApiResponse } from "../../../../../../core/http/api-response";
import { BadRequestError } from "../../../../../../core/errors/errors";

/**
 * GET /api/v1/organizations/:id/invitations
 * List invitations for organization.
 */
export const GET = withTenantContext(
  async (
    ctx: GuardedTenantHandlerContext,
    routeCtx?: Record<string, unknown>,
  ) => {
    const params = (await (routeCtx?.params as Promise<{ id: string }>)) || {
      id: ctx.tenant.organizationId,
    };
    const invitations = await InvitationService.listInvitations(params.id);
    return ApiResponse.success(invitations);
  },
);

/**
 * POST /api/v1/organizations/:id/invitations
 * Create a new member invitation.
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

    if (!body.email) {
      throw new BadRequestError("email is required for invitation");
    }

    const result = await InvitationService.createInvitation(
      params.id,
      {
        email: body.email,
        role: body.role || "MEMBER",
        expiresInHours: body.expiresInHours,
      },
      ctx.tenant.userId,
    );

    return ApiResponse.success(result, 201);
  },
);
