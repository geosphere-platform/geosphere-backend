import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { ModuleRegistry } from "@/core/modules/registry";

export const GET = withAuth(async (_ctx: AuthContext) => {
  const modules = ModuleRegistry.getAll();
  return ApiResponse.success(
    {
      modules,
      count: modules.length,
    },
    200,
  );
});
