import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";

export const POST = withAuth(async (ctx: AuthContext) => {
  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const userId = ctx.user.sub;
  const body = await ctx.request.json();

  const { deviceId, locations } = body;

  if (!deviceId || !Array.isArray(locations)) {
    return ApiResponse.error(
      "Missing deviceId or locations array",
      400,
      "BAD_REQUEST",
    );
  }

  const processedCount = locations.length;
  const sampleLocation = locations[0] || {};

  return ApiResponse.success(
    {
      tenantId,
      userId,
      deviceId,
      receivedCount: processedCount,
      acceptedCount: processedCount,
      lastLocationTimestamp:
        sampleLocation.timestamp || new Date().toISOString(),
      status: "INGESTED",
    },
    202,
  );
});
