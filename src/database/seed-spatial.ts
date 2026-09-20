/**
 * Development GIS Sample Data Generator — Phase 6
 *
 * Generates business-agnostic PostGIS spatial sample features:
 * Points ("Point A", "Point B"), LineStrings ("Sample Route"), Polygons ("Sample Zone").
 * Strictly development-only data.
 */

import { db, pool } from "./index";
import { PostGisSpatialRepository } from "@/core/gis/infrastructure/postgis-spatial.repository";
import { Geometry } from "@/core/gis/types/geometry";

const repo = new PostGisSpatialRepository(db);
const DEV_TENANT_ID = "00000000-0000-0000-0000-000000000001";

const SAMPLE_FEATURES: Array<{
  id: string;
  tenantId: string;
  type: string;
  geometry: Geometry;
  properties: Record<string, unknown>;
  metadata: Record<string, unknown>;
  srid: "EPSG:4326";
}> = [
  {
    id: "00000000-0000-4000-a000-000000000001",
    tenantId: DEV_TENANT_ID,
    type: "point_of_interest",
    geometry: { type: "Point", coordinates: [73.8567, 18.5204] },
    properties: {
      name: "Point A",
      category: "Stationary Facility",
      tier: "High",
    },
    metadata: { environment: "dev", sample: true },
    srid: "EPSG:4326",
  },
  {
    id: "00000000-0000-4000-a000-000000000002",
    tenantId: DEV_TENANT_ID,
    type: "point_of_interest",
    geometry: { type: "Point", coordinates: [72.8777, 19.076] },
    properties: { name: "Point B", category: "Hub Facility", tier: "Medium" },
    metadata: { environment: "dev", sample: true },
    srid: "EPSG:4326",
  },
  {
    id: "00000000-0000-4000-a000-000000000003",
    tenantId: DEV_TENANT_ID,
    type: "corridor",
    geometry: {
      type: "LineString",
      coordinates: [
        [73.8567, 18.5204],
        [73.1812, 18.9894],
        [72.8777, 19.076],
      ],
    },
    properties: { name: "Sample Route", distanceMeters: 148000, laneCount: 6 },
    metadata: { environment: "dev", sample: true },
    srid: "EPSG:4326",
  },
  {
    id: "00000000-0000-4000-a000-000000000004",
    tenantId: DEV_TENANT_ID,
    type: "perimeter_zone",
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [73.78, 18.58],
          [73.92, 18.58],
          [73.92, 18.48],
          [73.78, 18.48],
          [73.78, 18.58],
        ],
      ],
    },
    properties: { name: "Sample Zone", areaSqMeters: 125000000, active: true },
    metadata: { environment: "dev", sample: true },
    srid: "EPSG:4326",
  },
];

export async function seedSpatialData() {
  console.log("⏳ Seeding generic PostGIS spatial features...");
  try {
    for (const feature of SAMPLE_FEATURES) {
      await repo.create(feature);
    }
    console.log(
      `✅ Successfully seeded ${SAMPLE_FEATURES.length} generic spatial features.`,
    );
  } catch (err) {
    console.error("❌ Failed to seed spatial features:", err);
  } finally {
    await pool.end();
  }
}

if (require.main === module || process.argv[1]?.includes("seed-spatial")) {
  seedSpatialData();
}
