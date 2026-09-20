import { NextRequest, NextResponse } from "next/server";
import { getDbPoolStats, pool } from "@/database";
import { env } from "@/core/config/env";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "health"; // "liveness", "readiness", "health"

  const uptimeSeconds = Math.floor(process.uptime());

  // Liveness Check: verifies node process is responsive
  if (type === "liveness") {
    return NextResponse.json({
      status: "UP",
      timestamp: new Date().toISOString(),
      uptimeSeconds,
    });
  }

  // Readiness Check: verifies database connectivity & pool
  let dbStatus = "DOWN";
  let postGisAvailable = false;

  try {
    const client = await pool.connect();
    try {
      const res = await client.query(
        "SELECT 1 AS alive, PostGIS_Full_Version() AS postgis",
      );
      if (res.rows.length > 0 && res.rows[0].alive === 1) {
        dbStatus = "UP";
        postGisAvailable = Boolean(res.rows[0].postgis);
      }
    } finally {
      client.release();
    }
  } catch (err) {
    dbStatus = "DOWN";
  }

  const poolStats = getDbPoolStats();
  const isReady = dbStatus === "UP";

  const statusCode = isReady ? 200 : 503;

  return NextResponse.json(
    {
      status: isReady ? "UP" : "DOWN",
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      uptimeSeconds,
      checks: {
        database: {
          status: dbStatus,
          postgis: postGisAvailable,
          pool: poolStats,
        },
        storage: {
          status: "UP",
          provider: env.STORAGE_PROVIDER,
        },
      },
    },
    { status: statusCode },
  );
}
