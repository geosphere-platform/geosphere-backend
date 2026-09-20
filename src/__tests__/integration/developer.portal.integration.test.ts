import { applicationService } from "../../core/developer/application.service";
import { apiKeyService } from "../../core/developer/api-key.service";
import { developerAuthMiddleware } from "../../core/developer/developer-auth.middleware";

export function runDeveloperPortalIntegrationTests() {
  console.log("Testing Developer Portal Integration Flow...");

  const testOrgId = "00000000-0000-0000-0000-000000000001";

  return (async () => {
    // Step 1: Register Application
    const app = await applicationService.createApplication({
      organizationId: testOrgId,
      name: "Integration App",
      environment: "DEVELOPMENT",
      type: "WEB",
      allowedOrigins: ["http://localhost:3000"],
      scopeCodes: ["gis:read", "layers:read"],
    });

    // Step 2: Generate API Key
    const keyRes = await apiKeyService.createApiKey({
      applicationId: app.id,
      organizationId: testOrgId,
      name: "Integration Key",
      environment: "DEVELOPMENT",
    });

    // Step 3: Authenticate HTTP Request via Middleware
    const mockRequest = new Request(
      "http://localhost:3000/api/v1/spatial/search",
      {
        headers: {
          "X-API-Key": keyRes.rawSecretKey,
          Origin: "http://localhost:3000",
          "X-SDK-Name": "gis-web-sdk",
          "X-SDK-Version": "1.2.0",
        },
      },
    );

    const authResult = await developerAuthMiddleware.authenticateRequest(
      mockRequest,
      {
        requiredScope: "gis:read",
        requiredEnvironment: "DEVELOPMENT",
      },
    );

    if (!authResult.success) {
      throw new Error(`Integration auth failed: ${authResult.error}`);
    }

    if (authResult.context.applicationId !== app.id) {
      throw new Error("Resolved application ID mismatch in auth context");
    }
  })();
}
