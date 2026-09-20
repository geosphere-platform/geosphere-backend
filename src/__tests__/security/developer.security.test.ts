import { applicationService } from "../../core/developer/application.service";
import { apiKeyService } from "../../core/developer/api-key.service";
import { developerAuthMiddleware } from "../../core/developer/developer-auth.middleware";

export function runDeveloperSecurityTests() {
  console.log(
    "Testing Developer Security & Cross-Tenant Boundary Enforcement...",
  );

  const orgAId = "00000000-0000-0000-0000-000000000001";
  const orgBId = "00000000-0000-0000-0000-000000000002";

  return (async () => {
    // Setup Org A app and key
    const appA = await applicationService.createApplication({
      organizationId: orgAId,
      name: "Security Test App Org A",
      environment: "DEVELOPMENT",
      allowedOrigins: ["https://customer-a.com"],
      scopeCodes: ["gis:read"],
    });

    const keyA = await apiKeyService.createApiKey({
      applicationId: appA.id,
      organizationId: orgAId,
      name: "Key Org A",
      environment: "DEVELOPMENT",
    });

    // Test 1: Missing API Key fails
    const reqNoKey = new Request("http://localhost:3000/api/v1/spatial/search");
    const auth1 = await developerAuthMiddleware.authenticateRequest(reqNoKey);
    if (auth1.success)
      throw new Error("Security check failed: Request without key succeeded");

    // Test 2: Invalid API Key fails
    const reqInvalidKey = new Request(
      "http://localhost:3000/api/v1/spatial/search",
      {
        headers: { "X-API-Key": "gsk_dev_boguskey123" },
      },
    );
    const auth2 =
      await developerAuthMiddleware.authenticateRequest(reqInvalidKey);
    if (auth2.success)
      throw new Error(
        "Security check failed: Request with invalid key succeeded",
      );

    // Test 3: Missing Required Scope fails
    const reqScope = new Request(
      "http://localhost:3000/api/v1/tracking/write",
      {
        headers: { "X-API-Key": keyA.rawSecretKey },
      },
    );
    const auth3 = await developerAuthMiddleware.authenticateRequest(reqScope, {
      requiredScope: "tracking:write",
    });
    if (auth3.success || auth3.code !== "SCOPE_REQUIRED") {
      throw new Error("Security check failed: Missing scope was not blocked");
    }

    // Test 4: Environment Mismatch (Dev key -> Prod environment requirement)
    const reqEnv = new Request(
      "http://localhost:3000/api/v1/production/resource",
      {
        headers: { "X-API-Key": keyA.rawSecretKey },
      },
    );
    const auth4 = await developerAuthMiddleware.authenticateRequest(reqEnv, {
      requiredEnvironment: "PRODUCTION",
    });
    if (auth4.success || auth4.code !== "ENVIRONMENT_MISMATCH") {
      throw new Error(
        "Security check failed: Environment mismatch was not blocked",
      );
    }

    // Test 5: CORS Origin Restriction (Malicious origin)
    const reqCors = new Request("http://localhost:3000/api/v1/spatial/search", {
      headers: {
        "X-API-Key": keyA.rawSecretKey,
        Origin: "https://malicious-attacker.com",
      },
    });
    const auth5 = await developerAuthMiddleware.authenticateRequest(reqCors);
    if (auth5.success || auth5.code !== "ORIGIN_NOT_ALLOWED") {
      throw new Error(
        "Security check failed: Unauthorized CORS origin was not blocked",
      );
    }

    // Test 6: Revoked Key fails
    await apiKeyService.revokeApiKey(keyA.apiKeyRecord.keyId, orgAId);
    const reqRevoked = new Request(
      "http://localhost:3000/api/v1/spatial/search",
      {
        headers: { "X-API-Key": keyA.rawSecretKey },
      },
    );
    const auth6 = await developerAuthMiddleware.authenticateRequest(reqRevoked);
    if (auth6.success || auth6.code !== "CREDENTIAL_REVOKED") {
      throw new Error("Security check failed: Revoked key was not blocked");
    }
  })();
}
