import { SSRFGuard } from "../../core/gis/rules/security/ssrf-guard";
import {
  InvalidWebhookUrlError,
  AutomationDepthExceededError,
} from "../../core/errors/spatial-errors";
import { RULE_LIMITS } from "../../core/gis/rules/validation/rule-validator";
import assert from "assert";

export async function runRulesSecurityTests() {
  // ── 1. SSRF GUARD SECURITY TESTS ───────────────────────────────────────────

  // Restricted Localhost & Loopback Addresses
  const FORBIDDEN_URLS = [
    "http://localhost/admin",
    "http://127.0.0.1:8080/webhook",
    "http://0.0.0.0/test",
    "http://[::1]/status",
    "http://10.0.0.5/private-api",
    "http://172.16.0.10:9000/internal",
    "http://192.168.1.1/router",
    "http://169.254.169.254/latest/meta-data/", // AWS Cloud Metadata Endpoint
    "http://169.254.169.254/metadata/v1.json", // Azure Metadata Endpoint
    "ftp://example.com/file", // Non-HTTP protocol
    "gopher://example.com/",
  ];

  for (const forbiddenUrl of FORBIDDEN_URLS) {
    let thrown = false;
    try {
      SSRFGuard.validateUrl(forbiddenUrl);
    } catch (err) {
      if (err instanceof InvalidWebhookUrlError) {
        thrown = true;
      }
    }
    assert.strictEqual(
      thrown,
      true,
      `Expected SSRFGuard to block restricted URL '${forbiddenUrl}'`,
    );
  }

  // Permitted Public Webhook Destination URLs
  const VALID_URLS = [
    "https://api.external-partner.com/hooks/v1/events",
    "https://hooks.slack.com/services/T00/B00/X00",
    "https://webhook.site/abc-123",
  ];

  for (const validUrl of VALID_URLS) {
    try {
      SSRFGuard.validateUrl(validUrl);
    } catch (err: any) {
      throw new Error(
        `SSRFGuard incorrectly blocked valid public URL '${validUrl}': ${err.message}`,
      );
    }
  }

  // ── 2. RECURSION & AUTOMATION DEPTH LIMIT TESTS ─────────────────────────────
  assert.strictEqual(RULE_LIMITS.MAX_AUTOMATION_DEPTH, 5);

  const depthError = new AutomationDepthExceededError(6);
  assert.strictEqual(depthError.statusCode, 429);
  assert.strictEqual(depthError.errorCode, "AUTOMATION_DEPTH_EXCEEDED");
}
