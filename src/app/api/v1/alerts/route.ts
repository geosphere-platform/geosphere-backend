import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { ruleExecutionService } from "../rules-shared";
import { AlertStatus, AlertSeverity } from "@/core/gis/rules/types/rule.types";

export const GET = withAuth(async (ctx: AuthContext) => {
  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const { searchParams } = new URL(ctx.request.url);

  const status = (searchParams.get("status") as AlertStatus) || undefined;
  const severity = (searchParams.get("severity") as AlertSeverity) || undefined;
  const subjectId = searchParams.get("subjectId") || undefined;
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  const result = await ruleExecutionService.listAlerts(
    { tenantId, userId: ctx.user.sub, role: ctx.user.role },
    { status, severity, subjectId, limit, offset },
  );

  return ApiResponse.success(result, 200);
});
