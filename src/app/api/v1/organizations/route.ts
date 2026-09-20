import { NextRequest } from "next/server";
import { withAuth, AuthContext } from "../../../../core/auth/guards";
import { OrganizationService } from "../../../../core/tenant/organization.service";
import { ApiResponse } from "../../../../core/http/api-response";
import { BadRequestError } from "../../../../core/errors/errors";

/**
 * GET /api/v1/organizations
 * List all organizations accessible to the authenticated user.
 */
export const GET = withAuth(async (ctx: AuthContext) => {
  const orgs = await OrganizationService.listOrganizationsForUser(ctx.user.sub);
  return ApiResponse.success(orgs);
});

/**
 * POST /api/v1/organizations
 * Create a new Organization (creates Org -> Owner Membership -> Default Workspace).
 */
export const POST = withAuth(async (ctx: AuthContext) => {
  const body = await ctx.request.json();
  if (!body.name || !body.slug) {
    throw new BadRequestError("Organization name and slug are required");
  }

  const result = await OrganizationService.createOrganization(
    {
      name: body.name,
      slug: body.slug,
      timezone: body.timezone,
      locale: body.locale,
      defaultSettings: body.defaultSettings,
      metadata: body.metadata,
    },
    ctx.user.sub,
  );

  return ApiResponse.success(result, 201);
});
