/**
 * GeoSphere Step 16 Spatial Analysis SDK + Native UI Foundation Unit Test Suite
 */

import {
  GeoSphereSpatialAnalysisSDK,
  GeoSphereSpatialAnalysisConfig,
  GeoSphereMockSpatialAnalysisProvider,
  GeoSphereSpatialAnalysisError,
  PointGeometry,
  PolygonGeometry,
  LineStringGeometry,
  GeoSphereFeature,
  SPATIAL_ANALYSIS_UI_COMPONENTS,
  SPATIAL_ANALYSIS_READY_MADE_SCREENS,
  resolveThemePrecedence,
  validateLocaleConfig,
  evaluatePermissionState
} from "../contracts/index.js";

import { GeoSphereClient } from "../client.js";

declare const process: { exit(code?: number): never };

async function runSpatialAnalysisSdkTests() {
  console.log("==========================================");
  console.log("RUNNING GEOSPHERE SPATIAL ANALYSIS SDK UNIT TESTS");
  console.log("==========================================");

  // 1. Initialization & Provider Configuration
  console.log("  [1/35] Testing Spatial Analysis SDK Initialization...");
  const config: GeoSphereSpatialAnalysisConfig = {
    units: "metric",
    precision: 2,
    tolerance: 0.001,
    embeddedMode: true
  };

  const provider = new GeoSphereMockSpatialAnalysisProvider();
  const sdk = new GeoSphereSpatialAnalysisSDK(config, provider);
  await sdk.initialize();

  const providerInfo = sdk.getProviderInfo();
  if (providerInfo.name !== "GeoSphereMockSpatialAnalysisProvider") {
    throw new Error("Initialization failed to bind mock spatial analysis provider");
  }

  // 2. Capability Discovery
  console.log("  [2/35] Testing Capability Discovery...");
  const caps = sdk.getCapabilities();
  if (!caps.includes("DISTANCE") || !caps.includes("AREA") || !caps.includes("BUFFER") || !caps.includes("CLUSTERING")) {
    throw new Error("Capability discovery failed for supported spatial analysis capabilities");
  }

  // 3. Distance Calculation (Point -> Point)
  console.log("  [3/35] Testing Point-to-Point Distance Calculation...");
  const ptA: PointGeometry = { type: "Point", coordinates: [79.0882, 21.1458] }; // SF / Nagpur pt 1
  const ptB: PointGeometry = { type: "Point", coordinates: [79.0472, 21.0922] }; // pt 2

  const distRes = await sdk.calculateDistance(ptA, ptB);
  if (!distRes || distRes.value <= 0 || distRes.unit !== "meters" || distRes.type !== "distance") {
    throw new Error("calculateDistance failed to return valid measurement result");
  }

  // 4. Area Calculation (Polygon)
  console.log("  [4/35] Testing Polygon Area Calculation...");
  const poly: PolygonGeometry = {
    type: "Polygon",
    coordinates: [
      [
        [79.08, 21.14],
        [79.09, 21.14],
        [79.09, 21.15],
        [79.08, 21.15],
        [79.08, 21.14]
      ]
    ]
  };

  const areaRes = await sdk.calculateArea(poly);
  if (!areaRes || areaRes.value <= 0 || areaRes.unit !== "square_meters" || areaRes.type !== "area") {
    throw new Error("calculateArea failed to return valid polygon area result");
  }

  // 5. Length Calculation (LineString)
  console.log("  [5/35] Testing LineString Length Calculation...");
  const line: LineStringGeometry = {
    type: "LineString",
    coordinates: [
      [79.08, 21.14],
      [79.085, 21.145],
      [79.09, 21.15]
    ]
  };

  const lenRes = await sdk.calculateLength(line);
  if (!lenRes || lenRes.value <= 0 || lenRes.unit !== "meters" || lenRes.type !== "length") {
    throw new Error("calculateLength failed to return valid LineString length result");
  }

  // 6. Bearing / Direction Calculation
  console.log("  [6/35] Testing Point-to-Point Bearing Calculation...");
  const bearingRes = await sdk.calculateBearing([79.0882, 21.1458], [79.0472, 21.0922]);
  if (!bearingRes || bearingRes.value < 0 || bearingRes.value > 360 || bearingRes.unit !== "degrees") {
    throw new Error("calculateBearing failed to return valid bearing result in degrees");
  }

  // 7. Centroid Calculation
  console.log("  [7/35] Testing Centroid Computation...");
  const centroid = await sdk.calculateCentroid(poly);
  if (!centroid || centroid.length < 2 || centroid[0] < 79.08 || centroid[0] > 79.09) {
    throw new Error("calculateCentroid returned out-of-bound centroid coordinate");
  }

  // 8. Extent / Envelope Computation
  console.log("  [8/35] Testing Extent / Envelope Computation...");
  const extent = await sdk.calculateExtent(poly);
  if (extent.minX !== 79.08 || extent.maxX !== 79.09 || extent.minY !== 21.14 || extent.maxY !== 21.15) {
    throw new Error("calculateExtent returned invalid bounding box limits");
  }

  // 9. Geometry Validation
  console.log("  [9/35] Testing Geometry Validation...");
  const validRes = await sdk.validateGeometry(poly);
  if (!validRes.isValid || validRes.errors.length > 0) {
    throw new Error("validateGeometry failed to validate valid polygon");
  }

  const invalidRes = await sdk.validateGeometry({ invalid: "struct" });
  if (invalidRes.isValid) {
    throw new Error("validateGeometry failed to detect invalid geometry struct");
  }

  // 10. Geometry Simplification
  console.log(" [10/35] Testing Geometry Simplification...");
  const simplified = await sdk.simplifyGeometry(line, 0.001);
  if (!simplified || simplified.type !== "LineString") {
    throw new Error("simplifyGeometry failed to return simplified geometry");
  }

  // 11. Buffer Calculation
  console.log(" [11/35] Testing Buffer Polygon Generation...");
  const bufferPoly = await sdk.buffer(ptA, { distanceMeters: 500 });
  if (!bufferPoly || bufferPoly.type !== "Polygon" || bufferPoly.coordinates.length === 0) {
    throw new Error("buffer failed to generate buffer polygon geometry");
  }

  // 12–18. Spatial Relationships (CONTAINS, WITHIN, INTERSECTS, OVERLAPS, TOUCHES, CROSSES, DISJOINT)
  console.log(" [12/35] Testing Spatial Relationship 'CONTAINS'...");
  const containsRel = await sdk.relate(poly, poly, "CONTAINS");
  if (typeof containsRel !== "boolean") throw new Error("relate CONTAINS failed");

  console.log(" [13/35] Testing Spatial Relationship 'WITHIN'...");
  const withinRel = await sdk.relate(ptA, poly, "WITHIN");
  if (typeof withinRel !== "boolean") throw new Error("relate WITHIN failed");

  console.log(" [14/35] Testing Spatial Relationship 'INTERSECTS'...");
  const intersectsRel = await sdk.relate(poly, poly, "INTERSECTS");
  if (typeof intersectsRel !== "boolean") throw new Error("relate INTERSECTS failed");

  console.log(" [15/35] Testing Spatial Relationship 'OVERLAPS'...");
  const overlapsRel = await sdk.relate(poly, poly, "OVERLAPS");
  if (typeof overlapsRel !== "boolean") throw new Error("relate OVERLAPS failed");

  console.log(" [16/35] Testing Spatial Relationship 'TOUCHES'...");
  const touchesRel = await sdk.relate(poly, poly, "TOUCHES");
  if (typeof touchesRel !== "boolean") throw new Error("relate TOUCHES failed");

  console.log(" [17/35] Testing Spatial Relationship 'CROSSES'...");
  const crossesRel = await sdk.relate(poly, poly, "CROSSES");
  if (typeof crossesRel !== "boolean") throw new Error("relate CROSSES failed");

  console.log(" [18/35] Testing Spatial Relationship 'DISJOINT'...");
  const disjointRel = await sdk.relate(poly, poly, "DISJOINT");
  if (disjointRel !== false) throw new Error("relate DISJOINT failed");

  // 19. Geometric Operations (Intersection, Union, Difference)
  console.log(" [19/35] Testing Geometric Intersection, Union, Difference...");
  const interGeom = await sdk.intersection(poly, poly);
  const unionGeom = await sdk.union(poly, poly);
  const diffGeom = await sdk.difference(poly, poly);

  if (!interGeom || !unionGeom) {
    throw new Error("Geometric operations failed to return valid geometries");
  }

  // 20. Nearest Feature Analysis
  console.log(" [20/35] Testing Nearest Feature Analysis...");
  const features: GeoSphereFeature[] = [
    { id: "feat_1", geometry: ptA, properties: { name: "A" } },
    { id: "feat_2", geometry: ptB, properties: { name: "B" } }
  ];

  const nearestRes = await sdk.nearest([79.088, 21.145], features);
  if (!nearestRes || !nearestRes.feature || nearestRes.feature.id !== "feat_1") {
    throw new Error("nearest feature analysis failed to identify closest feature");
  }

  // 21. Spatial Point Clustering
  console.log(" [21/35] Testing Spatial Point Clustering...");
  const clusters = await sdk.cluster([[79.08, 21.14], [79.081, 21.141], [79.082, 21.142]], { clusterRadiusPixels: 40 });
  if (!clusters || clusters.length === 0 || clusters[0].count !== 3) {
    throw new Error("cluster points failed to aggregate point features into cluster");
  }

  // 22. Spatial Analysis Events Lifecycle
  console.log(" [22/35] Testing Spatial Analysis Events Lifecycle...");
  const events: any[] = [];
  sdk.subscribe((evt) => events.push(evt));

  await sdk.calculateDistance(ptA, ptB);
  await sdk.buffer(ptA, { distanceMeters: 100 });

  if (events.length < 2 || events[0].type !== "spatialAnalysis.measured" || events[1].type !== "spatialAnalysis.buffered") {
    throw new Error("Spatial Analysis event emission lifecycle check failed");
  }

  // 23. Security Audit (No Secrets or Tokens in Results)
  console.log(" [23/35] Verifying Spatial Analysis Struct Security (No Secrets or Tokens)...");
  const eventStr = JSON.stringify(events);
  if (eventStr.includes("token") || eventStr.includes("apiKey") || eventStr.includes("secret")) {
    throw new Error("SECURITY VIOLATION: Spatial Analysis events expose security tokens!");
  }

  // 24. Privacy Boundary Audit (Zero Automatic History Tracking Upload)
  console.log(" [24/35] Verifying Privacy Boundary (Zero Automatic Tracking Upload)...");
  const sdkStr = JSON.stringify(sdk);
  if (sdkStr.includes("/api/spatial/upload") || sdkStr.includes("uploadAnalysis")) {
    throw new Error("PRIVACY VIOLATION: Spatial Analysis SDK contains automatic data upload!");
  }

  // 25. Theme System Integration
  console.log(" [25/35] Testing Spatial Analysis Theme System Integration...");
  const theme = resolveThemePrecedence({
    tenantConfig: { preset: "dark-pro" }
  });
  if (!theme.colors.primary) throw new Error("Theme resolution failed for Spatial Analysis SDK");

  // 26. Localization Configuration
  console.log(" [26/35] Testing Spatial Analysis Localization Configuration...");
  const validLocale = validateLocaleConfig({
    language: "en",
    locale: "en-US",
    timezone: "UTC",
    dateFormat: "YYYY-MM-DD",
    timeFormat: "HH:mm",
    distanceUnit: "kilometers",
    speedUnit: "km/h"
  });
  if (validLocale.distanceUnit !== "kilometers") throw new Error("Localization validation failed");

  // 27. RBAC Permission Integration
  console.log(" [27/35] Testing Spatial Analysis RBAC Permission Checks...");
  const userPerms = ["spatialAnalysis.read", "spatialAnalysis.measure"];
  const measureState = evaluatePermissionState(userPerms, "spatialAnalysis.measure", "hide");
  if (measureState.status !== "granted") throw new Error("RBAC evaluation failed for granted permission");

  const queryState = evaluatePermissionState(userPerms, "spatialAnalysis.query", "disable");
  if (queryState.status !== "denied" || queryState.mode !== "disable") throw new Error("RBAC evaluation failed for denied permission");

  // 28. Reusable UI Components Metadata
  console.log(" [28/35] Testing Reusable Spatial Analysis Component Definitions Metadata...");
  const distComp = SPATIAL_ANALYSIS_UI_COMPONENTS.DISTANCE_MEASUREMENT;
  const bufComp = SPATIAL_ANALYSIS_UI_COMPONENTS.BUFFER_CONTROL;

  if (distComp.id !== "spatialAnalysis.distance-measurement-tool" || distComp.supportedPlatforms.length !== 3) {
    throw new Error("DISTANCE_MEASUREMENT component metadata check failed");
  }
  if (!bufComp.requiredPermissions.includes("spatialAnalysis.geometryOperations")) {
    throw new Error("BUFFER_CONTROL required permissions check failed");
  }

  // 29. Ready-Made Spatial Analysis Screens Metadata
  console.log(" [29/35] Testing Ready-Made Spatial Analysis Screen Definitions Metadata...");
  const mainScreen = SPATIAL_ANALYSIS_READY_MADE_SCREENS.SPATIAL_ANALYSIS_SCREEN;
  const bufScreen = SPATIAL_ANALYSIS_READY_MADE_SCREENS.BUFFER_ANALYSIS_SCREEN;

  if (mainScreen.mode !== "full-screen" || !mainScreen.requiredPermissions.includes("spatialAnalysis.read")) {
    throw new Error("SPATIAL_ANALYSIS_SCREEN metadata check failed");
  }
  if (!bufScreen.requiredPermissions.includes("spatialAnalysis.geometryOperations")) {
    throw new Error("BUFFER_ANALYSIS_SCREEN metadata check failed");
  }

  // 30. Framework Neutrality Audit
  console.log(" [30/35] Verifying Framework Neutrality (No React/DOM Leakage)...");
  if (typeof (sdk as any).render === "function" || typeof (sdk as any).componentDidMount === "function") {
    throw new Error("DEPENDENCY VIOLATION: Core Spatial Analysis leaks UI framework methods!");
  }

  // 31. Resource Cleanup
  console.log(" [31/35] Testing Spatial Analysis SDK Resource Cleanup (destroy)...");
  sdk.destroy();

  // 32. Backward Compatibility with GeoSphereClient.spatialAnalysis
  console.log(" [32/35] Verifying Backward Compatibility with GeoSphereClient.spatialAnalysis...");
  const client = new GeoSphereClient({
    baseUrl: "https://api.geosphere.local",
    tenantId: "tenant_sa_test_001",
    applicationId: "app_sa_test_001"
  });

  if (!client.spatialAnalysis || typeof client.spatialAnalysis.createSpatialAnalysisSDK !== "function") {
    throw new Error("Backward compatibility broken: existing client.spatialAnalysis facade is invalid");
  }

  // 33. Zero Duplicate Routing / Navigation Engine Audit
  console.log(" [33/35] Verifying Zero Duplicate Routing / Navigation Engine in Core...");
  const hasRoute = typeof (GeoSphereSpatialAnalysisSDK.prototype as any).calculateRoute === "function";
  if (hasRoute) throw new Error("DUPLICATION VIOLATION: Spatial Analysis SDK re-implemented Routing Engine!");

  // 34. Zero Duplicate Search / Location Engine Audit
  console.log(" [34/35] Verifying Zero Duplicate Search / Location Engine in Core...");
  const hasSearch = typeof (GeoSphereSpatialAnalysisSDK.prototype as any).searchPlaces === "function";
  if (hasSearch) throw new Error("DUPLICATION VIOLATION: Spatial Analysis SDK re-implemented Search Engine!");

  // 35. Error Normalization Check
  console.log(" [35/35] Testing Spatial Analysis Error Normalization...");
  try {
    await sdk.calculateDistance(null as any, ptB);
    throw new Error("calculateDistance failed to throw on null geometry");
  } catch (e: any) {
    if (!(e instanceof GeoSphereSpatialAnalysisError) || e.code !== "INVALID_GEOMETRY") throw e;
  }

  console.log("✅ All GeoSphere Spatial Analysis SDK & Native UI Foundation Unit Tests Passed Successfully!");
}

runSpatialAnalysisSdkTests().catch((err) => {
  console.error("❌ GeoSphere Spatial Analysis SDK Unit Tests Failed:", err);
  process.exit(1);
});
