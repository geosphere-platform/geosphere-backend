import {
  withTenantContext,
  GuardedTenantHandlerContext,
} from "../../../../../core/tenant/tenant-guard";
import { OrganizationService } from "../../../../../core/tenant/organization.service";
import { ApiResponse } from "../../../../../core/http/api-response";

/**
 * GET /api/v1/organizations/current
 * Return active organization context, user membership, active role, and permissions summary.
 */
export const GET = withTenantContext(
  async (ctx: GuardedTenantHandlerContext) => {
    const org = await OrganizationService.getOrganizationById(
      ctx.tenant.organizationId,
      ctx.tenant,
    );

    return ApiResponse.success({
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        status: org.status,
        ownerId: org.ownerId,
        timezone: org.timezone,
        locale: org.locale,
        defaultSettings: org.defaultSettings,
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
      },
      membership: ctx.tenant.membership,
      activeRole: ctx.tenant.membership.role,
      permissions: ctx.tenant.permissions,
      isPlatformAdmin: ctx.tenant.isPlatformAdmin,
    });
  },
);
