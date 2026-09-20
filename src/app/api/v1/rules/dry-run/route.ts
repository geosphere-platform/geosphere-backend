import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { ruleExecutionService } from "../../rules-shared";

export const POST = withAuth(async (ctx: AuthContext) => {
  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const body = await ctx.request.json();

  const result = await ruleExecutionService.dryRun(
    { tenantId, userId: ctx.user.sub, role: ctx.user.role },
    body,
  );

  return ApiResponse.success(result, 200);
});
