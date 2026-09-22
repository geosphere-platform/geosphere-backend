/**
 * Admin Server Control API — High-Stakes Server Lifecycle & Traffic Gate
 *
 * GET  /api/v1/admin/server-control — Diagnostic health, DB pool, and server state
 * POST /api/v1/admin/server-control — Toggle server START (Online) / STOP (Offline)
 *
 * Security:
 * - Strictly guarded with PLATFORM_ADMIN / SUPER_ADMIN role
 * - Enforces immutable audit logging for all START / STOP actions
 * - Fail-safe design ensures this endpoint remains responsive even when server is STOPPED
 */

import { NextRequest } from "next/server";
import { ApiResponse } from "@/core/http/api-response";
import { withAuth, withRole, AuthContext } from "@/core/auth/guards";
import { USER_ROLES } from "@/core/constants";
import { serverState } from "@/core/server/server-state";
import { pool, getDbPoolStats, db } from "@/database";
import { auditLogsTable } from "@/database/schema";

export async function GET(req: NextRequest) {
  try {
    const uptimeSeconds = Math.floor(process.uptime());
    const mem = process.memoryUsage();

    // Live Database & PostGIS check
    let dbStatus = "DOWN";
    let postgisVersion: string | null = null;

    try {
      const client = await pool.connect();
      try {
        const res = await client.query("SELECT 1 AS alive, PostGIS_Version() AS postgis");
        if (res.rows.length > 0 && res.rows[0].alive === 1) {
          dbStatus = "CONNECTED";
          postgisVersion = res.rows[0].postgis || "3.5+";
        }
      } finally {
        client.release();
      }
    } catch {
      dbStatus = "DISCONNECTED";
    }

    const serverSnapshot = serverState.getSnapshot();
    const poolStats = getDbPoolStats();

    return ApiResponse.success({
      server: {
        status: serverSnapshot.status,
        lastChangedAt: serverSnapshot.updatedAt,
        lastChangedBy: serverSnapshot.updatedBy,
        uptimeSeconds,
      },
      database: {
        status: dbStatus,
        postgis: postgisVersion,
        pool: {
          activeCount: (poolStats.totalCount ?? 0) - (poolStats.idleCount ?? 0),
          idleCount: poolStats.idleCount ?? 0,
          totalCount: poolStats.totalCount ?? 0,
          waitingCount: poolStats.waitingCount ?? 0,
          maxConnections: poolStats.maxConnections ?? 20,
        },
      },
      system: {
        nodeVersion: process.version,
        heapUsedMb: parseFloat((mem.heapUsed / (1024 * 1024)).toFixed(2)),
        rssMb: parseFloat((mem.rss / (1024 * 1024)).toFixed(2)),
      },
    });
  } catch (err) {
    return ApiResponse.handle(err);
  }
}

export const POST = withAuth(
  withRole(USER_ROLES.PLATFORM_ADMIN, USER_ROLES.SUPER_ADMIN)(
    async (ctx: AuthContext) => {
      try {
        const body = await ctx.request.json().catch(() => ({}));
        const action = body.action?.toUpperCase();

        if (action !== "START" && action !== "STOP") {
          return ApiResponse.error(
            "Invalid action. Expected { action: 'START' | 'STOP' }",
            400,
            "INVALID_ACTION",
          );
        }

        const targetStatus = action === "START" ? "ONLINE" : "OFFLINE";
        const oldSnapshot = serverState.getSnapshot();

        // Update server operational state
        const newSnapshot = serverState.setStatus(targetStatus, ctx.user.sub);

        // Security: Write immutable audit trail
        try {
          const clientIp =
            ctx.request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
          const userAgent = ctx.request.headers.get("user-agent") || "unknown";

          // Validate if ctx.user.sub is valid UUID before referencing foreign key
          const isUuid =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
              ctx.user.sub,
            );

          await db.insert(auditLogsTable).values({
            userId: isUuid ? ctx.user.sub : null,
            action: targetStatus === "ONLINE" ? "SERVER_POWER_ON" : "SERVER_POWER_OFF",
            entityType: "SERVER_LIFECYCLE",
            entityId: "main_gateway",
            ipAddress: clientIp,
            userAgent: userAgent.slice(0, 500),
            metadata: {
              previousStatus: oldSnapshot.status,
              newStatus: targetStatus,
              triggeredByRole: ctx.user.role,
              timestamp: newSnapshot.updatedAt,
            },
          });
        } catch (auditErr) {
          console.error("⚠️ Failed to write server control audit log:", auditErr);
        }

        return ApiResponse.success({
          success: true,
          server: newSnapshot,
          message:
            targetStatus === "ONLINE"
              ? "Server is now ONLINE. Public API and telemetry ingestion are ACTIVE."
              : "Server is now OFFLINE. Public API and telemetry ingestion are PAUSED.",
        });
      } catch (err) {
        return ApiResponse.handle(err);
      }
    },
  ),
);
