import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { realtimeEngine } from "../realtime-shared";

export const GET = withAuth(async (ctx: AuthContext) => {
  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const { searchParams } = new URL(ctx.request.url);

  const type = searchParams.get("type") || undefined;
  const activeOnly = searchParams.get("active") === "true";
  const limit = parseInt(searchParams.get("limit") || "100", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  const result = await realtimeEngine.listSubjects(
    { tenantId, userId: ctx.user.sub, role: ctx.user.role },
    { type, activeOnly, limit, offset },
  );

  return ApiResponse.success(result, 200);
});

export const POST = withAuth(async (ctx: AuthContext) => {
  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const body = await ctx.request.json();

  const created = await realtimeEngine.createSubject(
    { tenantId, userId: ctx.user.sub, role: ctx.user.role },
    {
      type: body.type,
      externalId: body.externalId,
      name: body.name,
      metadata: body.metadata,
      active: body.active,
    },
  );

  return ApiResponse.success(created, 201);
});
