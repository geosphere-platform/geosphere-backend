import type { Config } from "drizzle-kit";

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://geosphere_admin:gis_dev_password@localhost:5432/geosphere_db";

export default {
  schema: "./src/database/schema/**/*.ts",
  out: "./src/database/migrations",
  driver: "pg",
  dbCredentials: {
    connectionString: databaseUrl,
  },
} satisfies Config;
