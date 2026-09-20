import { GeoSphereClient } from "../client.js";
import { GeoSphereError, GeoSphereErrorCode } from "../errors/index.js";

declare const process: { exit(code?: number): never };

async function runCoreGisEngineTests() {
  console.log("Running @geosphere/web-sdk Core & GIS Engine isolation tests...");

  const client = new GeoSphereClient({
    baseUrl: "https://api.geosphere.local",
    tenantId: "tenant_test_pure_001",
    applicationId: "app_test_pure_002"
  });

  if (!client.gis || !client.maps || !client.layers || !client.features || !client.geofences) {
    throw new Error("SDK initialization missing expected Core/GIS module facades");
  }

  // Verify client tenant and token context setters
  client.setAccessToken("token_pure_gis_test");
  client.setTenantId("tenant_test_pure_001");
  client.setApplicationId("app_test_pure_002");

  // Verify normalized error instantiation
  const err = new GeoSphereError("Spatial bounds error", GeoSphereErrorCode.VALIDATION_ERROR, 400);
  if (err.code !== GeoSphereErrorCode.VALIDATION_ERROR || err.statusCode !== 400) {
    throw new Error("SDK Error normalized structure test failed");
  }

  console.log("✅ @geosphere/web-sdk Core & GIS Engine tests passed successfully!");
}

runCoreGisEngineTests().catch((e) => {
  console.error("❌ @geosphere/web-sdk Core & GIS Engine test failed:", e);
  process.exit(1);
});
