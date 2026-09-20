import { apiKeyService } from "../../core/developer/api-key.service";
import { applicationService } from "../../core/developer/application.service";

export function runDeveloperApiKeyUnitTests() {
  console.log("Testing Developer API Key Service...");

  const testOrgId = "00000000-0000-0000-0000-000000000001";
  let appId: string;
  let rawKey: string;
  let keyId: string;

  return (async () => {
    // 1. Setup app
    const app = await applicationService.createApplication({
      organizationId: testOrgId,
      name: "API Key Test App",
      environment: "DEVELOPMENT",
    });
    appId = app.id;

    // 2. Create Key
    const result = await apiKeyService.createApiKey({
      applicationId: appId,
      organizationId: testOrgId,
      name: "Test Dev Key",
      environment: "DEVELOPMENT",
    });

    if (!result.rawSecretKey.startsWith("gsk_dev_")) {
      throw new Error("Raw secret key prefix format invalid");
    }
    if (!result.apiKeyRecord.hash) {
      throw new Error("API Key hash missing");
    }

    rawKey = result.rawSecretKey;
    keyId = result.apiKeyRecord.keyId;

    // 3. Verify Key
    const verify = await apiKeyService.verifyApiKey(rawKey);
    if (!verify.isValid || verify.apiKey?.keyId !== keyId) {
      throw new Error("API Key verification failed");
    }

    // 4. Verify Invalid Key
    const invalidVerify = await apiKeyService.verifyApiKey(
      "gsk_dev_invalidkey123456",
    );
    if (invalidVerify.isValid) {
      throw new Error("Invalid API key verification falsely succeeded");
    }

    // 5. Rotate Key
    const rotateResult = await apiKeyService.rotateApiKey(keyId, testOrgId);
    if (
      !rotateResult.rawSecretKey ||
      rotateResult.apiKeyRecord.keyId === keyId
    ) {
      throw new Error("API Key rotation failed");
    }

    // Old key verification should fail as revoked
    const oldVerify = await apiKeyService.verifyApiKey(rawKey);
    if (oldVerify.isValid) {
      throw new Error("Old rotated key was not revoked");
    }

    // New key verification should pass
    const newVerify = await apiKeyService.verifyApiKey(
      rotateResult.rawSecretKey,
    );
    if (!newVerify.isValid) {
      throw new Error("New rotated key verification failed");
    }
  })();
}
