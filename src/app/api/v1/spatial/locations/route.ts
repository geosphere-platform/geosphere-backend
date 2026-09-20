import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { realtimeEngine } from "../realtime-shared";
import { gpsAdapterRegistry } from "@/core/gis/realtime/adapters";

export const POST = withAuth(async (ctx: AuthContext) => {
  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const body = await ctx.request.json();

  // If payload is already a standard single LocationUpdate with required fields
  if (body && typeof body === "object" && !Array.isArray(body) && body.subjectId && typeof body.latitude === "number") {
    const filterRes = gpsAdapterRegistry.filterAndDeduplicate(tenantId, [body]);
    if (filterRes.accepted.length === 0) {
      return ApiResponse.success({
        accepted: false,
        subjectId: body.subjectId,
        duplicate: filterRes.duplicates > 0,
        stale: filterRes.stale > 0,
      }, 200);
    }

    const result = await realtimeEngine.ingestLocation(
      { tenantId, userId: ctx.user.sub, role: ctx.user.role },
      filterRes.accepted[0],
    );
    return ApiResponse.success(result, 200);
  }

  // Parse via modular GPS adapter registry
  const protocol = ctx.request.headers.get("x-gps-protocol") || undefined;
  const parsedUpdates = gpsAdapterRegistry.parse({
    protocol,
    data: body,
    tenantId,
  });

  const { accepted, duplicates, stale } = gpsAdapterRegistry.filterAndDeduplicate(tenantId, parsedUpdates);

  const results = [];
  for (const update of accepted) {
    try {
      const res = await realtimeEngine.ingestLocation(
        { tenantId, userId: ctx.user.sub, role: ctx.user.role },
        update,
      );
      results.push(res);
    } catch {
      // Continue batch processing
    }
  }

  return ApiResponse.success({
    processedCount: results.length,
    duplicateCount: duplicates,
    staleCount: stale,
    results: Array.isArray(body) ? results : results[0] ?? null,
  }, 200);
});

