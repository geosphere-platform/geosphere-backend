import {
  withTenantContext,
  GuardedTenantHandlerContext,
} from "../../../../../../core/tenant/tenant-guard";
import { MembershipService } from "../../../../../../core/tenant/membership.service";
import { ApiResponse } from "../../../../../../core/http/api-response";
import { BadRequestError } from "../../../../../../core/errors/errors";

/**
 * GET /api/v1/organizations/:id/members
 * List organization members with pagination, search, role & status filter.
 */
export const GET = withTenantContext(
  async (
    ctx: GuardedTenantHandlerContext,
    routeCtx?: Record<string, unknown>,
  ) => {
    const params = (await (routeCtx?.params as Promise<{ id: string }>)) || {
      id: ctx.tenant.organizationId,
    };
    const { searchParams } = ctx.request.nextUrl;

    const query = {
      page: searchParams.get("page")
        ? parseInt(searchParams.get("page")!, 10)
        : 1,
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!, 10)
        : 20,
      search: searchParams.get("search") || undefined,
      role: searchParams.get("role") || undefined,
      status: searchParams.get("status") || undefined,
    };

    const result = await MembershipService.listMembers(params.id, query);
    return ApiResponse.success(result);
  },
);

/**
 * POST /api/v1/organizations/:id/members
 * Add user directly as member to organization.
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

    if (!body.userId) {
      throw new BadRequestError("userId is required");
    }

    const membership = await MembershipService.addMember(
      params.id,
      body.userId,
      body.role || "MEMBER",
      ctx.tenant.userId,
    );

    return ApiResponse.success(membership, 201);
  },
);
