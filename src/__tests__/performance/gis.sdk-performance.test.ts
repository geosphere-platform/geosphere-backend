import { GISSDK, GeoJSONUtil } from "@gis-sdk/core";
import { LayerManager } from "@gis-sdk/map";
import { TrackingSDK } from "@gis-sdk/tracking";

export async function runGisSdkPerformanceTests() {
  console.log("==========================================");
  console.log("RUNNING GIS SDK PERFORMANCE & BENCHMARK TESTS");
  console.log("==========================================");

  // 1. Benchmark: SDK Initialization Latency
  const initStart = performance.now();
  for (let i = 0; i < 100; i++) {
    GISSDK.configure({
      apiBaseUrl: "http://localhost:3500",
      organizationId: `org_perf_${i}`,
      workspaceId: `ws_perf_${i}`,
      accessToken: "token_perf",
    });
  }
  const initDuration = performance.now() - initStart;
  const avgInitTime = (initDuration / 100).toFixed(3);
  console.log(
    `[PERF] 100 SDK Re-configurations: Total ${initDuration.toFixed(2)}ms | Avg ${avgInitTime}ms/init`,
  );

  // 2. Benchmark: Map Feature Vector Processing (100, 1,000, 10,000 features)
  const counts = [100, 1000, 10000];
  for (const count of counts) {
    const start = performance.now();
    const features = [];
    for (let i = 0; i < count; i++) {
      features.push({
        type: "Feature" as const,
        id: i,
        geometry: {
          type: "Point" as const,
          coordinates: [
            73.8567 + (Math.random() - 0.5) * 0.1,
            18.5204 + (Math.random() - 0.5) * 0.1,
          ],
        },
        properties: { name: `Feature ${i}`, category: "sample" },
      });
    }

    const fc = GeoJSONUtil.createFeatureCollection(features);
    const serialized = GeoJSONUtil.stringify(fc);
    const parsed = GeoJSONUtil.parse(serialized);
    const duration = performance.now() - start;

    console.log(
      `[PERF] Feature Benchmark (${count} features): Vector Processing & Serialization took ${duration.toFixed(2)}ms`,
    );
  }

  // 3. Benchmark: Realtime Entity Location Update Throughput (1,000 entity location updates)
  const tracking = new TrackingSDK();
  const updateStart = performance.now();
  const entityCount = 1000;

  for (let i = 0; i < entityCount; i++) {
    tracking.validateLocationUpdate({
      entityId: `ENTITY_PERF_${i % 100}`,
      latitude: 18.5204 + (Math.random() - 0.5) * 0.05,
      longitude: 73.8567 + (Math.random() - 0.5) * 0.05,
      timestamp: new Date().toISOString(),
      speed: Math.round(Math.random() * 80),
    });
  }
  const updateDuration = performance.now() - updateStart;
  const throughput = Math.round((entityCount / updateDuration) * 1000);

  console.log(
    `[PERF] Entity Tracking Throughput: Processed ${entityCount} updates in ${updateDuration.toFixed(2)}ms (${throughput} updates/sec)`,
  );

  const memoryUsage = process.memoryUsage
    ? (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)
    : "N/A";
  console.log(`[PERF] Memory Heap Usage: ${memoryUsage} MB`);
  console.log("==========================================\n");
}
