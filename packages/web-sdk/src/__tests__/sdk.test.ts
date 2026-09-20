import { GeoSphereClient } from "../client.js";
import { GeoSphereError, GeoSphereErrorCode } from "../errors/index.js";

declare const process: { exit(code?: number): never };

async function runTests() {
  console.log("Running @geosphere/web-sdk unit verification tests...");

  const client = new GeoSphereClient({
    baseUrl: "https://api.geosphere.local",
    tenantId: "tenant_test_123",
    applicationId: "app_test_456"
  });

  if (!client.auth || !client.gis || !client.location || !client.geofences) {
    throw new Error("SDK initialization missing expected module property");
  }

  client.setAccessToken("test_token_123");

  const err = new GeoSphereError("Test error", GeoSphereErrorCode.UNAUTHORIZED, 401);
  if (err.code !== GeoSphereErrorCode.UNAUTHORIZED || err.statusCode !== 401) {
    throw new Error("SDK Error normalized structure test failed");
  }

  console.log("✅ @geosphere/web-sdk tests passed successfully!");
}

runTests().catch((e) => {
  console.error("❌ @geosphere/web-sdk test failed:", e);
  process.exit(1);
});
