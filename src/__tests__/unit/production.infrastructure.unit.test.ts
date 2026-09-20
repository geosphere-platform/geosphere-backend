import { FileUploadService } from "@/core/storage/file-upload.service";
import { LocalStorageProvider } from "@/core/storage/local-storage.provider";
import { DatabaseJobQueueProvider } from "@/core/jobs/database-job-queue";
import { JobWorkerProcessor } from "@/core/jobs/job-worker";
import { RateLimiter } from "@/core/rate-limit/rate-limiter";
import { SpatialGeometryValidator } from "@/core/gis/geometry-validator";
import { runDatabaseRestoreTest } from "@/database/scripts/restore-test";

export async function runProductionInfrastructureUnitTests() {
  console.log("🧪 Running Phase 17 Production Infrastructure Unit Tests...");

  // 1. Storage & Magic Number MIME Validation
  const validPng = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00,
  ]);
  const pngVal = FileUploadService.validateFileHeader(validPng, "image.png");
  if (!pngVal.valid || pngVal.detectedMime !== "image/png") {
    throw new Error("File upload validation failed for valid PNG header");
  }

  const localStorage = new LocalStorageProvider("./test_uploads");
  const uploadRes = await localStorage.uploadFile({
    key: "test/doc.txt",
    buffer: Buffer.from("Hello Production Storage"),
    contentType: "text/plain",
  });
  if (!uploadRes.key || !uploadRes.url) {
    throw new Error("LocalStorageProvider upload returned invalid object");
  }

  // 2. Job Queue & Worker Execution
  const queue = new DatabaseJobQueueProvider();
  const worker = new JobWorkerProcessor(queue);

  let processedPayload = false;
  worker.registerHandler("GIS_EXPORT", async (job) => {
    processedPayload = job.payload.format === "geojson";
    return { exportedCount: 42 };
  });

  const enqueuedJob = await queue.enqueueJob({
    tenantId: "tenant_test_p17",
    organizationId: "org_test_p17",
    type: "GIS_EXPORT",
    payload: { format: "geojson" },
  });

  if (enqueuedJob.status !== "PENDING") {
    throw new Error("Enqueued job status must be PENDING");
  }

  const processed = await worker.processNextJob();
  if (!processed || !processedPayload) {
    throw new Error("Job worker failed to process queued job");
  }

  // 3. Sliding Window Rate Limiter
  const limiter = RateLimiter.getInstance();
  limiter.clearAll();

  const testKey = "test_ip_127_0_0_1";
  const rl1 = limiter.consume({
    key: testKey,
    maxRequests: 2,
    windowMs: 10000,
  });
  const rl2 = limiter.consume({
    key: testKey,
    maxRequests: 2,
    windowMs: 10000,
  });
  const rl3 = limiter.consume({
    key: testKey,
    maxRequests: 2,
    windowMs: 10000,
  });

  if (!rl1.allowed || !rl2.allowed || rl3.allowed) {
    throw new Error("RateLimiter failed to enforce sliding window threshold");
  }

  // 4. Geometry Validation & Vertex Cap
  const validPoint = { type: "Point", coordinates: [-73.935242, 40.73061] };
  const valPointRes = SpatialGeometryValidator.validateGeometry(validPoint);
  if (!valPointRes.valid || valPointRes.vertexCount !== 1) {
    throw new Error("GeometryValidator failed valid WGS84 Point verification");
  }

  const invalidCoords = { type: "Point", coordinates: [200, 40.73061] };
  const valInvalidRes =
    SpatialGeometryValidator.validateGeometry(invalidCoords);
  if (valInvalidRes.valid) {
    throw new Error(
      "GeometryValidator allowed out-of-range longitude coordinate",
    );
  }

  // 5. Restore Verification Runner
  const restoreRes = await runDatabaseRestoreTest();
  if (
    restoreRes.rpoMinutes === undefined ||
    restoreRes.rtoMinutes === undefined
  ) {
    throw new Error("Restore test failed to return RPO/RTO metrics");
  }

  console.log("✅ All Phase 17 Production Infrastructure Unit Tests Passed!");
  return true;
}
