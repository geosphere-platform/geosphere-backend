import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { ruleExecutionService } from "../../rules-shared";

export const GET = withAuth(async (ctx: AuthContext) => {
  const tenantId = ctx.user.orgId ?? "default-tenant-0000";

  const metrics = await ruleExecutionService.getOperationalMetrics({
    tenantId,
    userId: ctx.user.sub,
    role: ctx.user.role,
  });

  return ApiResponse.success(metrics, 200);
});
