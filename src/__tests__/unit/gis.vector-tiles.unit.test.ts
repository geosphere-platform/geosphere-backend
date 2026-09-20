/**
 * Phase 18 — Vector Tiles Unit Tests
 */

import { MvtTileService } from "@/core/gis/tiles/mvt-tile.service";
import { InMemoryTileCacheProvider } from "@/core/gis/tiles/tile-cache.provider";

function assertStrict(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

export function runVectorTilesUnitTests() {
  console.log("🧪 Running Phase 18 Vector Tiles Unit Tests...");

  // 1. Tile bounding box conversion EPSG:3857
  const bboxZ0 = MvtTileService.tileToBBox3857(0, 0, 0);
  assertStrict(
    Math.abs(bboxZ0[0] - -20037508.34) < 10,
    "Tile 0/0/0 minX should equal -20037508",
  );
  assertStrict(
    Math.abs(bboxZ0[2] - 20037508.34) < 10,
    "Tile 0/0/0 maxX should equal 20037508",
  );

  // 2. Dynamic simplification tolerance calculation
  assertStrict(
    MvtTileService.getSimplificationTolerance(2) === 0.05,
    "Low zoom 2 tolerance should be 0.05",
  );
  assertStrict(
    MvtTileService.getSimplificationTolerance(8) === 0.01,
    "Medium zoom 8 tolerance should be 0.01",
  );
  assertStrict(
    MvtTileService.getSimplificationTolerance(18) === 0,
    "High zoom 18 tolerance should be 0",
  );

  // 3. Tile cache provider ETag & 304 validation
  const cacheProvider = new InMemoryTileCacheProvider(10);
  const sampleBuf = Buffer.from("test-mvt-payload-bytes");
  const etag = cacheProvider.generateETag(sampleBuf);

  assertStrict(etag.startsWith('W/"'), 'ETag should start with W/"');
  assertStrict(
    cacheProvider.isNotModified(etag, etag) === true,
    "Matching ETag header should yield 304 Not Modified",
  );
  assertStrict(
    cacheProvider.isNotModified(etag, 'W/"different"') === false,
    "Mismatching ETag should yield 200 OK",
  );

  // 4. In-memory tile cache get & set
  cacheProvider.set("mvt:tenant1:layer1:5:10:15", sampleBuf, 60);
  const hit = cacheProvider.get("mvt:tenant1:layer1:5:10:15");
  assertStrict(hit !== null, "Cache hit should return non-null entry");
  assertStrict(hit?.etag === etag, "Cached entry ETag should match");

  console.log("  ✅ Vector Tiles Unit Tests Passed!");
}
