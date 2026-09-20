/**
 * Phase 18 — Vector Tiles & Tile Security Integration Tests
 */

import { MvtTileService } from "@/core/gis/tiles/mvt-tile.service";
import { db } from "@/database";

function assertStrict(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

export async function runVectorTilesIntegrationTests() {
  console.log("🔗 Running Phase 18 Vector Tiles Integration Tests...");

  const mvtService = new MvtTileService(db);
  const tenantA = "11111111-1111-1111-1111-111111111111";
  const tenantB = "22222222-2222-2222-2222-222222222222";

  // 1. Generate tile for Tenant A
  const tileResultA = await mvtService.generateTile(tenantA, {
    layerId: "vehicles",
    z: 10,
    x: 512,
    y: 384,
  });

  assertStrict(
    Buffer.isBuffer(tileResultA.buffer),
    "Tile response should return binary Buffer",
  );
  assertStrict(
    tileResultA.etag.length > 0,
    "Tile response should generate ETag",
  );

  // 2. Tenant B isolation security check
  const tileResultB = await mvtService.generateTile(tenantB, {
    layerId: "vehicles",
    z: 10,
    x: 512,
    y: 384,
  });

  assertStrict(
    tileResultB.etag !== tileResultA.etag || tileResultA.buffer.length === 0,
    "Tenant B tile must be isolated from Tenant A tile",
  );

  console.log("  ✅ Vector Tiles Integration Tests Passed!");
}
