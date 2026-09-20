import {
  isValidCoordinate,
  isValidPointGeometry,
  createSpatialEntity,
  spatialEntityToGeoJson,
} from "@/core/gis";

export function runGisCoreUnitTests() {
  // 1. Coordinate Validation
  if (!isValidCoordinate([77.209, 28.6139])) {
    throw new Error("GIS Core: Valid [lng, lat] coordinate rejected");
  }
  if (isValidCoordinate([200, 28.6139])) {
    throw new Error("GIS Core: Invalid longitude > 180 accepted");
  }
  if (isValidCoordinate([77.209, -95])) {
    throw new Error("GIS Core: Invalid latitude < -90 accepted");
  }

  // 2. Point Geometry Validation
  if (
    !isValidPointGeometry({ type: "Point", coordinates: [77.209, 28.6139] })
  ) {
    throw new Error("GIS Core: Valid Point geometry rejected");
  }

  // 3. SpatialEntity Creation
  const entity = createSpatialEntity({
    id: "entity-001",
    tenantId: "tenant-acme",
    entityType: "building",
    geometry: { type: "Point", coordinates: [77.209, 28.6139] },
    properties: { name: "Headquarters", floors: 12 },
  });

  if (entity.entityType !== "building" || entity.tenantId !== "tenant-acme") {
    throw new Error("GIS Core: SpatialEntity properties mismatch");
  }

  // 4. GeoJSON Conversion
  const geojson = spatialEntityToGeoJson(entity);
  if (
    geojson.type !== "Feature" ||
    geojson.properties.entityType !== "building"
  ) {
    throw new Error("GIS Core: GeoJSON conversion failed");
  }

  return true;
}
