import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { realtimeEngine } from "@/app/api/v1/spatial/realtime-shared";
import { LocationUpdate } from "@/core/gis/realtime/location-update.model";

export const POST = withAuth(async (ctx: AuthContext) => {
  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const userId = ctx.user.sub;
  const body = await ctx.request.json();

  const { deviceId, locations } = body;

  if (!deviceId || !Array.isArray(locations) || locations.length === 0) {
    return ApiResponse.error(
      "Missing deviceId or non-empty locations array",
      400,
      "BAD_REQUEST",
    );
  }

  // Map incoming mobile location updates to normalized domain updates
  const updates: LocationUpdate[] = locations
    .filter((loc: any) => typeof loc.latitude === "number" && typeof loc.longitude === "number")
    .map((loc: any) => ({
      subjectId: String(deviceId),
      latitude: loc.latitude,
      longitude: loc.longitude,
      timestamp: loc.timestamp ? new Date(loc.timestamp).toISOString() : new Date().toISOString(),
      accuracy: typeof loc.accuracy === "number" ? loc.accuracy : undefined,
      altitude: typeof loc.altitude === "number" ? loc.altitude : undefined,
      speed: typeof loc.speed === "number" ? loc.speed : undefined,
      heading: typeof loc.heading === "number" ? loc.heading : undefined,
      source: "mobile",
      metadata: {
        ...(typeof loc.metadata === "object" && loc.metadata !== null ? loc.metadata : {}),
        deviceId: String(deviceId),
        uploadedBy: userId,
      },
    }));

  if (updates.length === 0) {
    return ApiResponse.error(
      "No valid location coordinates found in request payload",
      422,
      "UNPROCESSABLE_ENTITY",
    );
  }

  // Ingest batch into PostGIS and evaluate geofences + publish real-time events
  const ingestResult = await realtimeEngine.ingestBatch(
    {
      tenantId,
      userId,
      role: ctx.user.role,
    },
    updates,
  );

  const lastAccepted = ingestResult.results.find((r) => r.accepted);

  return ApiResponse.success(
    {
      tenantId,
      userId,
      deviceId,
      receivedCount: locations.length,
      processedCount: ingestResult.processed,
      acceptedCount: ingestResult.accepted,
      lastLocationTimestamp: lastAccepted?.timestamp || new Date().toISOString(),
      status: ingestResult.accepted > 0 ? "INGESTED" : "REJECTED",
      records: ingestResult.results,
    },
    200,
  );
});

