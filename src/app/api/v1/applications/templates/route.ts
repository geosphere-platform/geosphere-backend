import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { INITIAL_APPLICATION_TEMPLATES } from "@/database/seed-application-builder";

export const GET = withAuth(async (ctx: AuthContext) => {
  return ApiResponse.success({ templates: INITIAL_APPLICATION_TEMPLATES }, 200);
});
