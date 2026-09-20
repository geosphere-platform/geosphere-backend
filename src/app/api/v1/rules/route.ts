import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { ruleExecutionService } from "../rules-shared";
import { TriggerType, RuleStatus } from "@/core/gis/rules/types/rule.types";

export const GET = withAuth(async (ctx: AuthContext) => {
  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const { searchParams } = new URL(ctx.request.url);

  const triggerType =
    (searchParams.get("triggerType") as TriggerType) || undefined;
  const status = (searchParams.get("status") as RuleStatus) || undefined;
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  const result = await ruleExecutionService.listRules(
    { tenantId, userId: ctx.user.sub, role: ctx.user.role },
    { triggerType, status, limit, offset },
  );

  return ApiResponse.success(result, 200);
});

import { withLimit } from "@/core/subscription/guards";

export const POST = withAuth(
  withLimit(
    "MAX_RULES",
    1,
  )(async (ctx: AuthContext) => {
    const tenantId = ctx.user.orgId ?? "default-tenant-0000";
    const body = await ctx.request.json();

    const result = await ruleExecutionService.createRule(
      { tenantId, userId: ctx.user.sub, role: ctx.user.role },
      body,
    );

    return ApiResponse.success(result, 201);
  }),
);
