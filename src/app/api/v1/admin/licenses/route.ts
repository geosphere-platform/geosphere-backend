import { ApiResponse } from "@/core/http/api-response";
import { withAuth, withPermission, AuthContext } from "@/core/auth/guards";
import { licenseService } from "@/core/sdk/license.service";
import { PERMISSIONS } from "@/core/constants";

/**
 * GET /api/v1/admin/licenses
 * Admin: list all licenses across the platform
 */
export const GET = withAuth(
  withPermission(PERMISSIONS.PLAN_MANAGE)(async (_ctx: AuthContext) => {
    const licenses = await licenseService.listAllLicenses();
    return ApiResponse.success(licenses);
  }),
);

/**
 * POST /api/v1/admin/licenses
 * Admin: create a new SDK license for an organization.
 *
 * Returns rawLicenseKey ONCE — it must be securely delivered to the customer.
 * The raw key is NOT stored in the database.
 */
export const POST = withAuth(
  withPermission(PERMISSIONS.PLAN_MANAGE)(async (ctx: AuthContext) => {
    const body = await ctx.request.json();
    const performedBy = ctx.user.sub;

    if (!body.organizationId || !body.productId) {
      return ApiResponse.error(
        "organizationId and productId are required",
        400,
        "BAD_REQUEST",
      );
    }

    const { license, rawLicenseKey } = await licenseService.createLicense({
      organizationId: body.organizationId,
      productId: body.productId,
      licenseType: body.licenseType,
      subscriptionId: body.subscriptionId,
      featureCodes: body.featureCodes,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      metadata: body.metadata,
      performedBy,
    });

    return ApiResponse.success(
      {
        license,
        rawLicenseKey,
        securityNotice:
          "The rawLicenseKey is shown ONLY once. Present it to the customer now and it cannot be retrieved again.",
      },
      201,
    );
  }),
);
