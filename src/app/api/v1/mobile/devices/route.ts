import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";

// In-memory fallback / mock store for device management testing when DB connection is simulated
const devicesStore: Map<string, any> = new Map();

export const GET = withAuth(async (ctx: AuthContext) => {
  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const userId = ctx.user.sub;

  const userDevices = Array.from(devicesStore.values()).filter(
    (d) => d.tenantId === tenantId && d.userId === userId,
  );

  return ApiResponse.success(
    {
      tenantId,
      userId,
      devices: userDevices,
      total: userDevices.length,
    },
    200,
  );
});

export const POST = withAuth(async (ctx: AuthContext) => {
  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const userId = ctx.user.sub;
  const body = await ctx.request.json();

  const { deviceId, deviceName, platform, osVersion, appVersion, pushToken } =
    body;

  if (!deviceId || !platform) {
    return ApiResponse.error(
      "Missing deviceId or platform parameter",
      400,
      "BAD_REQUEST",
    );
  }

  const deviceRecord = {
    id: `dev_${Date.now()}`,
    tenantId,
    userId,
    deviceId,
    deviceName: deviceName || "Mobile Device",
    platform: platform.toUpperCase(),
    osVersion: osVersion || "1.0",
    appVersion: appVersion || "1.0.0",
    pushToken: pushToken || null,
    status: "ACTIVE",
    lastSeenAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  devicesStore.set(deviceId, deviceRecord);

  return ApiResponse.success(deviceRecord, 201);
});

export const DELETE = withAuth(async (ctx: AuthContext) => {
  const { searchParams } = new URL(ctx.request.url);
  const deviceId = searchParams.get("deviceId");

  if (!deviceId) {
    return ApiResponse.error(
      "Missing deviceId query parameter",
      400,
      "BAD_REQUEST",
    );
  }

  const existing = devicesStore.get(deviceId);
  if (existing) {
    existing.status = "REVOKED";
    devicesStore.set(deviceId, existing);
  }

  return ApiResponse.success(
    {
      deviceId,
      status: "REVOKED",
      revokedAt: new Date().toISOString(),
    },
    200,
  );
});
