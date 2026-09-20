import { NextRequest } from "next/server";
import {
  withTenantContext,
  GuardedTenantHandlerContext,
} from "../../../../../core/tenant/tenant-guard";
import { OrganizationService } from "../../../../../core/tenant/organization.service";
import { ApiResponse } from "../../../../../core/http/api-response";

/**
 * GET /api/v1/organizations/:id
 * Get organization by ID.
 */
export const GET = withTenantContext(
  async (
    ctx: GuardedTenantHandlerContext,
    routeCtx?: Record<string, unknown>,
  ) => {
    const params = (await (routeCtx?.params as Promise<{ id: string }>)) || {
      id: ctx.tenant.organizationId,
    };
    const org = await OrganizationService.getOrganizationById(
      params.id,
      ctx.tenant,
    );
    return ApiResponse.success(org);
  },
);

/**
 * PATCH /api/v1/organizations/:id
 * Update organization profile or settings.
 */
export const PATCH = withTenantContext(
  async (
    ctx: GuardedTenantHandlerContext,
    routeCtx?: Record<string, unknown>,
  ) => {
    const params = (await (routeCtx?.params as Promise<{ id: string }>)) || {
      id: ctx.tenant.organizationId,
    };
    const body = await ctx.request.json();

    const updated = await OrganizationService.updateOrganization(
      params.id,
      {
        name: body.name,
        timezone: body.timezone,
        locale: body.locale,
        defaultSettings: body.defaultSettings,
        metadata: body.metadata,
      },
      ctx.tenant,
    );

    return ApiResponse.success(updated);
  },
);
