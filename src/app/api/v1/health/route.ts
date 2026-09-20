import { ApiResponse } from "@/core/http/api-response";

/**
 * GET /api/v1/health
 * System health check endpoint.
 */
export async function GET() {
  return ApiResponse.success({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "geosphere-platform",
    version: process.env.npm_package_version ?? "1.0.0",
  });
}
