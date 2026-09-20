import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";

// In-memory idempotency tracker & sync store
const processedOperations: Map<string, any> = new Map();

export const POST = withAuth(async (ctx: AuthContext) => {
  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const userId = ctx.user.sub;
  const body = await ctx.request.json();

  const {
    deviceId,
    clientOperationId,
    operations,
    conflictStrategy = "SERVER_WINS",
  } = body;

  if (!deviceId || !clientOperationId) {
    return ApiResponse.error(
      "Missing deviceId or clientOperationId",
      400,
      "BAD_REQUEST",
    );
  }

  // Idempotency check: Return existing result if clientOperationId was already processed
  if (processedOperations.has(clientOperationId)) {
    return ApiResponse.success(
      {
        tenantId,
        deviceId,
        clientOperationId,
        isDuplicate: true,
        status: "IDEMPOTENT_SUCCESS",
        result: processedOperations.get(clientOperationId),
      },
      200,
    );
  }

  const results = {
    created: [] as string[],
    updated: [] as string[],
    deleted: [] as string[],
    conflicts: [] as any[],
    failed: [] as any[],
  };

  const opsList = Array.isArray(operations) ? operations : [];

  for (const op of opsList) {
    const {
      opId,
      entityType,
      entityId,
      operation,
      clientVersion,
      serverVersion,
      payload,
    } = op;

    // Concurrency conflict check: If clientVersion < serverVersion
    if (serverVersion && clientVersion < serverVersion) {
      if (conflictStrategy === "SERVER_WINS") {
        results.conflicts.push({
          opId,
          entityId,
          reason: "STALE_VERSION",
          resolvedVersion: serverVersion,
          actionTaken: "SERVER_WINS_DISCARDED_CLIENT",
        });
        continue;
      } else if (conflictStrategy === "CLIENT_WINS") {
        results.updated.push(entityId);
      } else {
        results.conflicts.push({
          opId,
          entityId,
          reason: "MANUAL_RESOLVE_REQUIRED",
          clientVersion,
          serverVersion,
        });
        continue;
      }
    }

    if (operation === "CREATE") {
      results.created.push(entityId || `ent_${Date.now()}`);
    } else if (operation === "UPDATE") {
      results.updated.push(entityId);
    } else if (operation === "DELETE") {
      results.deleted.push(entityId);
    }
  }

  const responsePayload = {
    tenantId,
    deviceId,
    clientOperationId,
    syncedAt: new Date().toISOString(),
    results,
  };

  // Cache operation for idempotency protection
  processedOperations.set(clientOperationId, responsePayload);

  return ApiResponse.success(responsePayload, 200);
});

export const GET = withAuth(async (ctx: AuthContext) => {
  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const { searchParams } = new URL(ctx.request.url);
  const sinceToken =
    searchParams.get("syncToken") || searchParams.get("since") || "0";

  // Delta download payload
  const deltaPayload = {
    tenantId,
    syncToken: String(Date.now()),
    serverTime: new Date().toISOString(),
    changes: {
      features: [
        {
          id: "feat_101",
          entityType: "ASSET",
          geometry: { type: "Point", coordinates: [-74.006, 40.7128] },
          properties: { name: "Transformer Station #4", status: "ACTIVE" },
          version: 2,
          updatedAt: new Date().toISOString(),
        },
      ],
      deletions: [],
    },
  };

  return ApiResponse.success(deltaPayload, 200);
});
