import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "@/core/config/env";
import * as schema from "./schema";

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: env.DB_MAX_CONNECTIONS ?? (env.NODE_ENV === "production" ? 20 : 5),
  idleTimeoutMillis: env.DB_IDLE_TIMEOUT_MS ?? 30000,
  connectionTimeoutMillis: 5000,
  statement_timeout: env.DB_STATEMENT_TIMEOUT_MS ?? 15000,
});

pool.on("error", (err) => {
  console.error("❌ Unexpected PostgreSQL connection pool error:", err);
});

export function getDbPoolStats() {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
    maxConnections: env.DB_MAX_CONNECTIONS,
  };
}

export const db = drizzle(pool, { schema });
export type DatabaseClient = typeof db;
export { pool };
