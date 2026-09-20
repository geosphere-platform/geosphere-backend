import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z
    .enum(["development", "staging", "production", "test"])
    .default("development"),
  DATABASE_URL: z
    .string()
    .min(1)
    .default("postgres://postgres:postgres@localhost:5432/gis_db"),

  // Database Pool & Timeout Configuration
  DB_MAX_CONNECTIONS: z.coerce.number().default(20),
  DB_IDLE_TIMEOUT_MS: z.coerce.number().default(30000),
  DB_STATEMENT_TIMEOUT_MS: z.coerce.number().default(15000),

  // Security & Authentication
  JWT_SECRET: z
    .string()
    .min(16)
    .default("default-dev-jwt-secret-min-16-chars-long"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CORS_ALLOWED_ORIGINS: z.string().default("*"),

  // Storage Provider Configuration
  STORAGE_PROVIDER: z.enum(["local", "s3"]).default("local"),
  STORAGE_LOCAL_DIR: z.string().default("./uploads"),
  S3_BUCKET_NAME: z.string().optional().default("gis-saas-uploads"),
  S3_REGION: z.string().optional().default("us-east-1"),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),

  // Rate Limiting & Protection
  RATE_LIMIT_REQUESTS_PER_MIN: z.coerce.number().default(120),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),

  // Payload & GeoJSON Limits
  MAX_FILE_SIZE_BYTES: z.coerce.number().default(50 * 1024 * 1024), // 50MB
  MAX_GEOJSON_VERTICES: z.coerce.number().default(50000),

  // Observability & Logging
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  ENABLE_METRICS: z.coerce.boolean().default(true),
});

function getParsedEnv() {
  if (typeof window !== "undefined") {
    return {} as z.infer<typeof envSchema>;
  }

  const parsed = envSchema.safeParse({
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    DB_MAX_CONNECTIONS: process.env.DB_MAX_CONNECTIONS,
    DB_IDLE_TIMEOUT_MS: process.env.DB_IDLE_TIMEOUT_MS,
    DB_STATEMENT_TIMEOUT_MS: process.env.DB_STATEMENT_TIMEOUT_MS,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS,
    STORAGE_PROVIDER: process.env.STORAGE_PROVIDER,
    STORAGE_LOCAL_DIR: process.env.STORAGE_LOCAL_DIR,
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
    S3_REGION: process.env.S3_REGION,
    S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
    S3_ENDPOINT: process.env.S3_ENDPOINT,
    RATE_LIMIT_REQUESTS_PER_MIN: process.env.RATE_LIMIT_REQUESTS_PER_MIN,
    RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
    MAX_FILE_SIZE_BYTES: process.env.MAX_FILE_SIZE_BYTES,
    MAX_GEOJSON_VERTICES: process.env.MAX_GEOJSON_VERTICES,
    LOG_LEVEL: process.env.LOG_LEVEL,
    ENABLE_METRICS: process.env.ENABLE_METRICS,
  });

  if (!parsed.success) {
    console.error("❌ Invalid environment variables:", parsed.error.format());
    throw new Error("Invalid environment configuration. Check your .env file.");
  }

  return parsed.data;
}

export const env = getParsedEnv();
export type Env = z.infer<typeof envSchema>;
