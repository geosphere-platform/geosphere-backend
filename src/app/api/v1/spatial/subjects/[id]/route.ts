import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { realtimeEngine } from "../../realtime-shared";

export const GET = withAuth(
  async (ctx: AuthContext, context?: Record<string, unknown>) => {
    const params = (await context?.params) as { id: string } | undefined;
    const id = params?.id ?? "";
    const tenantId = ctx.user.orgId ?? "default-tenant-0000";

    const subject = await realtimeEngine.getSubject(
      { tenantId, userId: ctx.user.sub, role: ctx.user.role },
      id,
    );

    return ApiResponse.success(subject, 200);
  },
);

export const PATCH = withAuth(
  async (ctx: AuthContext, context?: Record<string, unknown>) => {
    const params = (await context?.params) as { id: string } | undefined;
    const id = params?.id ?? "";
    const tenantId = ctx.user.orgId ?? "default-tenant-0000";
    const body = await ctx.request.json();

    const updated = await realtimeEngine.updateSubject(
      { tenantId, userId: ctx.user.sub, role: ctx.user.role },
      id,
      body,
    );

    return ApiResponse.success(updated, 200);
  },
);

export const DELETE = withAuth(
  async (ctx: AuthContext, context?: Record<string, unknown>) => {
    const params = (await context?.params) as { id: string } | undefined;
    const id = params?.id ?? "";
    const tenantId = ctx.user.orgId ?? "default-tenant-0000";

    await realtimeEngine.deleteSubject(
      { tenantId, userId: ctx.user.sub, role: ctx.user.role },
      id,
    );

    return ApiResponse.success({ deleted: true, id }, 200);
  },
);
