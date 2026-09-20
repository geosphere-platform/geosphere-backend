import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./index";

async function runMigrations() {
  console.log("⏳ Running database migrations...");

  try {
    await migrate(db, {
      migrationsFolder: "./src/database/migrations",
    });
    console.log("✅ Database migrations completed successfully!");
  } catch (error) {
    console.error("❌ Database migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
