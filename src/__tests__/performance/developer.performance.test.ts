import { applicationService } from "../../core/developer/application.service";
import { apiKeyService } from "../../core/developer/api-key.service";
import { developerAuthMiddleware } from "../../core/developer/developer-auth.middleware";

export function runDeveloperPerformanceTests() {
  console.log("Testing Developer Credential Verification Performance...");

  const testOrgId = "00000000-0000-0000-0000-000000000001";

  return (async () => {
    const app = await applicationService.createApplication({
      organizationId: testOrgId,
      name: "Perf App",
      environment: "DEVELOPMENT",
    });

    const key = await apiKeyService.createApiKey({
      applicationId: app.id,
      organizationId: testOrgId,
      name: "Perf Key",
      environment: "DEVELOPMENT",
    });

    const iterations = 50;
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      const req = new Request("http://localhost:3000/api/v1/spatial/search", {
        headers: { "X-API-Key": key.rawSecretKey },
      });
      await developerAuthMiddleware.authenticateRequest(req);
    }

    const totalMs = performance.now() - start;
    const avgMs = totalMs / iterations;

    console.log(
      `\n  ⚡ Perf: ${iterations} API Key Auth iterations completed in ${totalMs.toFixed(2)}ms (Avg: ${avgMs.toFixed(2)}ms/req)`,
    );

    if (avgMs > 150) {
      throw new Error(
        `API Key Verification latency exceeds 150ms limit: ${avgMs.toFixed(2)}ms`,
      );
    }
  })();
}
