import assert from "node:assert";
import {
  GISSDK,
  SDKError,
  SDKErrorCode,
  normalizeBackendError,
  SDKLogger,
  MemoryTokenProvider,
  TenantContextManager,
  GeoJSONUtil,
  SDKEventEmitter,
} from "@gis-sdk/core";

export async function runGisSdkCoreUnitTests() {
  console.log("------------------------------------------");
  console.log("RUNNING GIS SDK CORE UNIT TESTS");
  console.log("------------------------------------------");

  let passed = 0;
  let failed = 0;

  function runTest(name: string, fn: () => void) {
    try {
      fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (e: any) {
      console.log(`  ✗ ${name}`);
      console.log(`    Error: ${e.message}`);
      failed++;
    }
  }

  // 1. SDK Singleton Configuration
  runTest("GISSDK configuration and singleton initialization", () => {
    GISSDK.reset();
    assert.strictEqual(
      GISSDK.isInitialized(),
      false,
      "Should not be initialized initially",
    );

    const sdk = GISSDK.configure({
      apiBaseUrl: "http://localhost:3500",
      organizationId: "org_unit_test",
      workspaceId: "ws_unit_test",
      accessToken: "sample_token",
    });

    assert.strictEqual(
      GISSDK.isInitialized(),
      true,
      "SDK should be initialized after configure()",
    );
    assert.strictEqual(
      sdk.getConfig().organizationId,
      "org_unit_test",
      "Org ID should match configuration",
    );
    assert.strictEqual(
      sdk.getTenantManager().workspace,
      "ws_unit_test",
      "Workspace ID should match",
    );
  });

  // 2. Tenant Context Manager
  runTest("TenantContextManager validation and getters", () => {
    const mgr = new TenantContextManager("org_abc", "ws_xyz");
    assert.strictEqual(
      mgr.organization,
      "org_abc",
      "Organization property should match",
    );
    assert.strictEqual(
      mgr.workspace,
      "ws_xyz",
      "Workspace property should match",
    );

    mgr.setTenantContext("org_123", "ws_456");
    assert.strictEqual(
      mgr.getContext().organizationId,
      "org_123",
      "Context updated organizationId",
    );
  });

  // 3. Token Provider
  runTest("MemoryTokenProvider set and get token", async () => {
    const provider = new MemoryTokenProvider("initial_token");
    const token = await provider.getAccessToken();
    assert.strictEqual(token, "initial_token", "Initial token matches");

    provider.setAccessToken("new_token");
    const updated = await provider.getAccessToken();
    assert.strictEqual(updated, "new_token", "Updated token matches");
  });

  // 4. Normalized SDK Error Mapping
  runTest(
    "Error normalization converts HTTP status codes to SDKErrorCode",
    () => {
      const err401 = normalizeBackendError({
        statusCode: 401,
        message: "Unauthorized",
      });
      assert.strictEqual(
        err401.code,
        SDKErrorCode.AUTHENTICATION_ERROR,
        "401 maps to AUTHENTICATION_ERROR",
      );

      const err403 = normalizeBackendError({
        statusCode: 403,
        message: "Tenant restriction active",
      });
      assert.strictEqual(
        err403.code,
        SDKErrorCode.TENANT_CONTEXT_ERROR,
        "Tenant 403 maps to TENANT_CONTEXT_ERROR",
      );

      const err400 = normalizeBackendError({
        statusCode: 400,
        message: "Invalid payload",
      });
      assert.strictEqual(
        err400.code,
        SDKErrorCode.VALIDATION_ERROR,
        "400 maps to VALIDATION_ERROR",
      );
    },
  );

  // 5. SDK Logger Redaction
  runTest("SDKLogger sanitizes sensitive token and credential fields", () => {
    let loggedMeta: any[] = [];
    const mockLogger = {
      debug: () => {},
      info: (msg: string, ...meta: any[]) => {
        loggedMeta = meta;
      },
      warn: () => {},
      error: () => {},
    };

    const logger = new SDKLogger(mockLogger);
    logger.info("User session created", {
      accessToken: "SECRET_JWT_123",
      username: "john",
    });

    assert.strictEqual(
      loggedMeta[0].accessToken,
      "[REDACTED]",
      "Access token must be redacted",
    );
    assert.strictEqual(
      loggedMeta[0].username,
      "john",
      "Non-sensitive property preserved",
    );
  });

  // 6. GeoJSON Parsing and Validation
  runTest("GeoJSONUtil validates and builds FeatureCollection", () => {
    const pointGeom = {
      type: "Point" as const,
      coordinates: [73.8567, 18.5204],
    };
    assert.strictEqual(
      GeoJSONUtil.isValidGeometry(pointGeom),
      true,
      "Point geometry is valid",
    );

    const feature = GeoJSONUtil.createFeature(
      pointGeom,
      { name: "Pune Center" },
      "f_101",
    );
    assert.strictEqual(
      GeoJSONUtil.isValidFeature(feature),
      true,
      "Created feature is valid",
    );

    const fc = GeoJSONUtil.createFeatureCollection([feature]);
    assert.strictEqual(
      GeoJSONUtil.isValidFeatureCollection(fc),
      true,
      "FeatureCollection is valid",
    );

    const parsed = GeoJSONUtil.parse(JSON.stringify(fc));
    assert.strictEqual(
      parsed.type,
      "FeatureCollection",
      "Parsed object is FeatureCollection",
    );
  });

  // 7. SDK Event Emitter
  runTest("SDKEventEmitter listener subscribe and emit", () => {
    const emitter = new SDKEventEmitter();
    let receivedPayload: any = null;

    const unbind = emitter.on("testEvent", (data) => {
      receivedPayload = data;
    });

    emitter.emit("testEvent", { value: 42 });
    assert.strictEqual(
      receivedPayload?.value,
      42,
      "Payload received by event listener",
    );

    unbind();
    emitter.emit("testEvent", { value: 99 });
    assert.strictEqual(
      receivedPayload?.value,
      42,
      "Unbound listener should not trigger",
    );
  });

  console.log(
    `Core Unit Tests Complete: ${passed} passed, ${failed} failed.\n`,
  );
  if (failed > 0) throw new Error(`${failed} SDK Core unit tests failed.`);
}
