import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { PERMISSIONS } from "@/core/constants";
import { hasPermission } from "@/core/auth/permissions";
import { ForbiddenError } from "@/core/errors/errors";

export const GET = withAuth(async (ctx: AuthContext) => {
  if (
    !hasPermission(ctx.user.role, PERMISSIONS.TENANT_MANAGE) &&
    !hasPermission(ctx.user.role, PERMISSIONS.ORGANIZATION_MANAGE)
  ) {
    throw new ForbiddenError("Insufficient permissions to manage tenants");
  }

  // Return the active tenant context for the user's organization
  return ApiResponse.success(
    {
      tenant: {
        id: ctx.user.orgId ?? "default-tenant-0000",
        name: "Acme Fleet & Logistics Inc.",
        slug: "acme-fleet",
        plan: "enterprise",
        isActive: true,
      },
    },
    200,
  );
});
