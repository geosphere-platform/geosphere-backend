import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { geofenceEngine } from "@/app/api/v1/spatial/operations-shared";

export const POST = withAuth(async (ctx: AuthContext) => {
  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const body = await ctx.request.json();

  const transitionType = geofenceEngine.evaluateTransition(
    body.previousState,
    body.currentState,
  );

  const event = geofenceEngine.createTransitionEvent(
    {
      tenantId,
      userId: ctx.user.sub,
      role: ctx.user.role,
    },
    body.geofenceId ?? "gf-default-01",
    body.subjectId ?? "subject-01",
    body.previousState,
    body.currentState,
    body.metadata ?? {},
  );

  return ApiResponse.success({ transition: transitionType, event }, 200);
});
