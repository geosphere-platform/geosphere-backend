import assert from "node:assert";
import { SpatialDataService } from "../../core/gis/services/spatial-data.service";
import { PostGisSpatialRepository } from "../../core/gis/infrastructure/postgis-spatial.repository";
import { db } from "../../database";
import {
  validateGeometry,
  validateBBox,
  validateRadius,
  validateCoordinate,
  validateSRID,
  validatePagination,
} from "../../core/gis/validation/spatial-validation";
import {
  InvalidGeometryError,
  InvalidCoordinateError,
  InvalidBBoxError,
  InvalidRadiusError,
  UnauthorizedSpatialAccessError,
  TenantAccessDeniedError,
  SpatialFeatureNotFoundError,
  SpatialResultLimitExceededError,
} from "../../core/errors/spatial-errors";
import { USER_ROLES } from "../../core/constants";

export function runSpatialServiceUnitTests() {
  console.log("   --> Testing Spatial Geometry Validation...");

  // Valid Point
  const validPoint = validateGeometry({
    type: "Point",
    coordinates: [73.8567, 18.5204],
  });
  assert.strictEqual(validPoint.type, "Point");

  // Invalid Coordinate
  assert.throws(() => validateCoordinate([200, 18]), InvalidCoordinateError);
  assert.throws(() => validateCoordinate([73, 100]), InvalidCoordinateError);

  // Unsupported Geometry Type
  assert.throws(
    () => validateGeometry({ type: "Circle", coordinates: [0, 0] }),
    InvalidGeometryError,
  );

  // SRID Validation
  assert.doesNotThrow(() => validateSRID("EPSG:4326"));
  assert.throws(() => validateSRID("EPSG:3857"), InvalidGeometryError);

  console.log("   --> Testing Bounding Box Validation...");
  const validBBox = validateBBox(73.0, 18.0, 74.0, 19.0);
  assert.strictEqual(validBBox.minLng, 73.0);
  assert.throws(() => validateBBox(74.0, 18.0, 73.0, 19.0), InvalidBBoxError); // min > max

  console.log("   --> Testing Search Radius Validation...");
  assert.strictEqual(validateRadius(25, "kilometers"), 25000);
  assert.throws(() => validateRadius(-10, "meters"), InvalidRadiusError);
  assert.throws(() => validateRadius(60000, "meters"), InvalidRadiusError); // > 50km max limit

  console.log("   --> Testing Pagination Boundary Enforcement...");
  assert.deepStrictEqual(validatePagination(100, 0), { limit: 100, offset: 0 });
  assert.throws(
    () => validatePagination(1000, 0),
    SpatialResultLimitExceededError,
  );

  console.log("   --> Testing SpatialDataService & RBAC Isolation...");
  const repo = new PostGisSpatialRepository(db);
  const service = new SpatialDataService(repo);

  const tenantA = "00000000-0000-0000-0000-000000000001";
  const tenantB = "00000000-0000-0000-0000-000000000002";

  // Missing Tenant Context
  assert.rejects(
    async () => service.listFeatures({ tenantId: "" }),
    TenantAccessDeniedError,
  );

  // Insufficient Permission Check
  assert.rejects(
    async () =>
      service.createFeature(
        { tenantId: tenantA, role: USER_ROLES.VIEWER },
        {
          type: "facility",
          geometry: { type: "Point", coordinates: [73.8, 18.5] },
        },
      ),
    UnauthorizedSpatialAccessError,
  );
}
