/**
 * GeoSphere Spatial Analysis SDK Core Contracts
 * Framework-Neutral GIS Measurement, Spatial Relations, Geometry & Spatial Query Engine
 * Consumes GeoSphere GIS SDK Contracts (Step 8)
 */

import { BoundingBoxTuple, GeoSphereCoordinate, GeoSphereFeature, LineStringGeometry, PointGeometry, PolygonGeometry } from "./gis.contracts.js";
import { GeoSphereDistanceCalculator } from "./tracking.contracts.js";

export type GeoSphereSpatialRelation =
  | "CONTAINS"
  | "WITHIN"
  | "INTERSECTS"
  | "OVERLAPS"
  | "TOUCHES"
  | "CROSSES"
  | "DISJOINT";

export interface GeoSphereMeasurementResult {
  value: number;
  unit: "meters" | "kilometers" | "square_meters" | "square_kilometers" | "degrees";
  type: "distance" | "area" | "length" | "bearing";
  sourceGeometryType?: string;
  targetGeometryType?: string;
}

export interface GeoSphereExtent {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface GeoSphereValidationResult {
  isValid: boolean;
  errors: string[];
  geometryType?: string;
}

export interface GeoSphereBufferOptions {
  distanceMeters: number;
  resolution?: number;
}

export interface GeoSphereClusterOptions {
  clusterRadiusPixels?: number;
  minClusterSize?: number;
}

export interface GeoSphereCluster {
  id: string;
  center: GeoSphereCoordinate;
  count: number;
  memberIds: string[];
}

export interface GeoSphereNearestFeatureResult {
  feature: GeoSphereFeature;
  distanceMeters: number;
  nearestPoint: GeoSphereCoordinate;
}

export type GeoSphereSpatialAnalysisCapability =
  | "DISTANCE"
  | "AREA"
  | "LENGTH"
  | "BEARING"
  | "CENTROID"
  | "EXTENT"
  | "VALIDATION"
  | "SIMPLIFICATION"
  | "BUFFER"
  | "INTERSECTION"
  | "UNION"
  | "DIFFERENCE"
  | "SPATIAL_RELATIONSHIPS"
  | "NEAREST"
  | "SPATIAL_QUERY"
  | "CLUSTERING";

export interface GeoSphereSpatialAnalysisProviderInfo {
  name: string;
  version: string;
}

export interface IGeoSphereSpatialAnalysisProvider {
  getProviderInfo(): GeoSphereSpatialAnalysisProviderInfo;
  getCapabilities(): GeoSphereSpatialAnalysisCapability[];
  calculateDistance(geomA: PointGeometry, geomB: PointGeometry): Promise<GeoSphereMeasurementResult>;
  calculateArea(geom: PolygonGeometry): Promise<GeoSphereMeasurementResult>;
  calculateLength(geom: LineStringGeometry): Promise<GeoSphereMeasurementResult>;
  calculateBearing(start: GeoSphereCoordinate, end: GeoSphereCoordinate): Promise<GeoSphereMeasurementResult>;
  calculateCentroid(geom: PointGeometry | LineStringGeometry | PolygonGeometry): Promise<GeoSphereCoordinate>;
  calculateExtent(geom: PointGeometry | LineStringGeometry | PolygonGeometry): Promise<GeoSphereExtent>;
  validateGeometry(geom: unknown): Promise<GeoSphereValidationResult>;
  simplifyGeometry(geom: LineStringGeometry | PolygonGeometry, tolerance: number): Promise<LineStringGeometry | PolygonGeometry>;
  buffer(geom: PointGeometry | LineStringGeometry | PolygonGeometry, options: GeoSphereBufferOptions): Promise<PolygonGeometry>;
  intersection(geomA: PolygonGeometry, geomB: PolygonGeometry): Promise<PolygonGeometry | null>;
  union(geomA: PolygonGeometry, geomB: PolygonGeometry): Promise<PolygonGeometry>;
  difference(geomA: PolygonGeometry, geomB: PolygonGeometry): Promise<PolygonGeometry | null>;
  relate(geomA: PointGeometry | PolygonGeometry, geomB: PolygonGeometry, relation: GeoSphereSpatialRelation): Promise<boolean>;
  nearest(point: GeoSphereCoordinate, features: GeoSphereFeature[]): Promise<GeoSphereNearestFeatureResult | null>;
  cluster(points: GeoSphereCoordinate[], options?: GeoSphereClusterOptions): Promise<GeoSphereCluster[]>;
}

export class GeoSphereSpatialAnalysisError extends Error {
  constructor(
    public readonly code:
      | "INVALID_GEOMETRY"
      | "UNSUPPORTED_OPERATION"
      | "CALCULATION_FAILED"
      | "PROVIDER_UNAVAILABLE"
      | "UNKNOWN_ERROR",
    message: string,
    public readonly details?: unknown
  ) {
    super(`[SPATIAL_ANALYSIS_ERROR:${code}] ${message}`);
    this.name = "GeoSphereSpatialAnalysisError";
  }
}

export class GeoSphereMockSpatialAnalysisProvider implements IGeoSphereSpatialAnalysisProvider {
  public getProviderInfo(): GeoSphereSpatialAnalysisProviderInfo {
    return { name: "GeoSphereMockSpatialAnalysisProvider", version: "1.0.0" };
  }

  public getCapabilities(): GeoSphereSpatialAnalysisCapability[] {
    return [
      "DISTANCE",
      "AREA",
      "LENGTH",
      "BEARING",
      "CENTROID",
      "EXTENT",
      "VALIDATION",
      "SIMPLIFICATION",
      "BUFFER",
      "INTERSECTION",
      "UNION",
      "DIFFERENCE",
      "SPATIAL_RELATIONSHIPS",
      "NEAREST",
      "SPATIAL_QUERY",
      "CLUSTERING"
    ];
  }

  public async calculateDistance(geomA: PointGeometry, geomB: PointGeometry): Promise<GeoSphereMeasurementResult> {
    if (!geomA || !geomB || geomA.type !== "Point" || geomB.type !== "Point") {
      throw new GeoSphereSpatialAnalysisError("INVALID_GEOMETRY", "Distance calculation requires two valid Point geometries.");
    }
    const dist = GeoSphereDistanceCalculator.haversineMeters(
      geomA.coordinates[1],
      geomA.coordinates[0],
      geomB.coordinates[1],
      geomB.coordinates[0]
    );
    return {
      value: Math.round(dist * 100) / 100,
      unit: "meters",
      type: "distance",
      sourceGeometryType: "Point",
      targetGeometryType: "Point"
    };
  }

  public async calculateArea(geom: PolygonGeometry): Promise<GeoSphereMeasurementResult> {
    if (!geom || geom.type !== "Polygon" || !geom.coordinates || geom.coordinates.length === 0) {
      throw new GeoSphereSpatialAnalysisError("INVALID_GEOMETRY", "Area calculation requires a valid Polygon geometry.");
    }
    // Deterministic Shoelace formula approximation for planar / spherical polygon ring
    const ring = geom.coordinates[0];
    let area = 0;
    for (let i = 0; i < ring.length - 1; i++) {
      const p1 = ring[i];
      const p2 = ring[i + 1];
      area += (p2[0] - p1[0]) * (p2[1] + p1[1]);
    }
    const sqMeters = Math.abs(area) * 111319.5 * 111319.5 * 0.5; // conversion factor approximation
    return {
      value: Math.round(sqMeters * 100) / 100,
      unit: "square_meters",
      type: "area",
      sourceGeometryType: "Polygon"
    };
  }

  public async calculateLength(geom: LineStringGeometry): Promise<GeoSphereMeasurementResult> {
    if (!geom || geom.type !== "LineString" || !geom.coordinates || geom.coordinates.length < 2) {
      throw new GeoSphereSpatialAnalysisError("INVALID_GEOMETRY", "Length calculation requires a LineString with at least two coordinates.");
    }
    let totalLen = 0;
    for (let i = 0; i < geom.coordinates.length - 1; i++) {
      const p1 = geom.coordinates[i];
      const p2 = geom.coordinates[i + 1];
      totalLen += GeoSphereDistanceCalculator.haversineMeters(p1[1], p1[0], p2[1], p2[0]);
    }
    return {
      value: Math.round(totalLen * 100) / 100,
      unit: "meters",
      type: "length",
      sourceGeometryType: "LineString"
    };
  }

  public async calculateBearing(start: GeoSphereCoordinate, end: GeoSphereCoordinate): Promise<GeoSphereMeasurementResult> {
    if (!start || !end || start.length < 2 || end.length < 2) {
      throw new GeoSphereSpatialAnalysisError("INVALID_GEOMETRY", "Bearing calculation requires valid start and end coordinates.");
    }
    const lat1 = (start[1] * Math.PI) / 180;
    const lat2 = (end[1] * Math.PI) / 180;
    const dLon = ((end[0] - start[0]) * Math.PI) / 180;

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    let brng = (Math.atan2(y, x) * 180) / Math.PI;
    brng = (brng + 360) % 360;

    return {
      value: Math.round(brng * 100) / 100,
      unit: "degrees",
      type: "bearing"
    };
  }

  public async calculateCentroid(geom: PointGeometry | LineStringGeometry | PolygonGeometry): Promise<GeoSphereCoordinate> {
    if (!geom) {
      throw new GeoSphereSpatialAnalysisError("INVALID_GEOMETRY", "Centroid calculation requires a valid geometry.");
    }
    if (geom.type === "Point") return geom.coordinates;

    const coords = geom.type === "LineString" ? geom.coordinates : geom.coordinates[0];
    let sumLng = 0;
    let sumLat = 0;
    coords.forEach((c) => {
      sumLng += c[0];
      sumLat += c[1];
    });
    return [Math.round((sumLng / coords.length) * 100000) / 100000, Math.round((sumLat / coords.length) * 100000) / 100000];
  }

  public async calculateExtent(geom: PointGeometry | LineStringGeometry | PolygonGeometry): Promise<GeoSphereExtent> {
    if (!geom) {
      throw new GeoSphereSpatialAnalysisError("INVALID_GEOMETRY", "Extent calculation requires a valid geometry.");
    }
    const coords: GeoSphereCoordinate[] =
      geom.type === "Point" ? [geom.coordinates] : geom.type === "LineString" ? geom.coordinates : geom.coordinates[0];

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    coords.forEach((c) => {
      if (c[0] < minX) minX = c[0];
      if (c[1] < minY) minY = c[1];
      if (c[0] > maxX) maxX = c[0];
      if (c[1] > maxY) maxY = c[1];
    });

    return { minX, minY, maxX, maxY };
  }

  public async validateGeometry(geom: unknown): Promise<GeoSphereValidationResult> {
    if (!geom || typeof geom !== "object") {
      return { isValid: false, errors: ["Geometry object is null or undefined."] };
    }
    const g = geom as any;
    if (!g.type || !g.coordinates) {
      return { isValid: false, errors: ["Geometry is missing required 'type' or 'coordinates' properties."] };
    }
    return { isValid: true, errors: [], geometryType: g.type };
  }

  public async simplifyGeometry(
    geom: LineStringGeometry | PolygonGeometry,
    tolerance: number
  ): Promise<LineStringGeometry | PolygonGeometry> {
    if (!geom) {
      throw new GeoSphereSpatialAnalysisError("INVALID_GEOMETRY", "Simplification requires a valid geometry.");
    }
    return JSON.parse(JSON.stringify(geom)); // Retains valid structure
  }

  public async buffer(
    geom: PointGeometry | LineStringGeometry | PolygonGeometry,
    options: GeoSphereBufferOptions
  ): Promise<PolygonGeometry> {
    if (!geom) {
      throw new GeoSphereSpatialAnalysisError("INVALID_GEOMETRY", "Buffer calculation requires a valid geometry.");
    }
    const centroid = await this.calculateCentroid(geom);
    const d = (options.distanceMeters || 100) / 111319.5; // deg approx

    const ring: GeoSphereCoordinate[] = [
      [centroid[0] - d, centroid[1] - d],
      [centroid[0] + d, centroid[1] - d],
      [centroid[0] + d, centroid[1] + d],
      [centroid[0] - d, centroid[1] + d],
      [centroid[0] - d, centroid[1] - d]
    ];

    return {
      type: "Polygon",
      coordinates: [ring]
    };
  }

  public async intersection(geomA: PolygonGeometry, geomB: PolygonGeometry): Promise<PolygonGeometry | null> {
    return geomA; // Mock intersection polygon
  }

  public async union(geomA: PolygonGeometry, geomB: PolygonGeometry): Promise<PolygonGeometry> {
    return geomA; // Mock union polygon
  }

  public async difference(geomA: PolygonGeometry, geomB: PolygonGeometry): Promise<PolygonGeometry | null> {
    return geomA; // Mock difference polygon
  }

  public async relate(
    geomA: PointGeometry | PolygonGeometry,
    geomB: PolygonGeometry,
    relation: GeoSphereSpatialRelation
  ): Promise<boolean> {
    if (relation === "DISJOINT") return false;
    return true; // Mock true relation
  }

  public async nearest(point: GeoSphereCoordinate, features: GeoSphereFeature[]): Promise<GeoSphereNearestFeatureResult | null> {
    if (!features || features.length === 0) return null;
    let closestFeat = features[0];
    let minDistance = Infinity;

    features.forEach((feat) => {
      if (feat.geometry && feat.geometry.type === "Point") {
        const d = GeoSphereDistanceCalculator.haversineMeters(point[1], point[0], feat.geometry.coordinates[1], feat.geometry.coordinates[0]);
        if (d < minDistance) {
          minDistance = d;
          closestFeat = feat;
        }
      }
    });

    return {
      feature: closestFeat,
      distanceMeters: Math.round(minDistance),
      nearestPoint: (closestFeat.geometry as PointGeometry).coordinates
    };
  }

  public async cluster(points: GeoSphereCoordinate[], options?: GeoSphereClusterOptions): Promise<GeoSphereCluster[]> {
    if (!points || points.length === 0) return [];
    return [
      {
        id: "cluster_001",
        center: points[0],
        count: points.length,
        memberIds: points.map((_, i) => `pt_${i}`)
      }
    ];
  }
}

export interface GeoSphereSpatialAnalysisConfig {
  units?: "metric" | "imperial";
  precision?: number;
  tolerance?: number;
  embeddedMode?: boolean;
}

export class GeoSphereSpatialAnalysisSDK {
  private provider: IGeoSphereSpatialAnalysisProvider;
  private listeners: Map<string, (event: { type: string; payload: unknown }) => void> = new Map();

  constructor(
    private config: GeoSphereSpatialAnalysisConfig = {},
    provider?: IGeoSphereSpatialAnalysisProvider
  ) {
    this.provider = provider || new GeoSphereMockSpatialAnalysisProvider();
  }

  public async initialize(): Promise<void> {}

  public getProviderInfo(): GeoSphereSpatialAnalysisProviderInfo {
    return this.provider.getProviderInfo();
  }

  public getCapabilities(): GeoSphereSpatialAnalysisCapability[] {
    return this.provider.getCapabilities();
  }

  public hasCapability(capability: GeoSphereSpatialAnalysisCapability): boolean {
    return this.getCapabilities().includes(capability);
  }

  public async calculateDistance(geomA: PointGeometry, geomB: PointGeometry): Promise<GeoSphereMeasurementResult> {
    const res = await this.provider.calculateDistance(geomA, geomB);
    this.notifyListeners("spatialAnalysis.measured", { type: "distance", result: res });
    return res;
  }

  public async calculateArea(geom: PolygonGeometry): Promise<GeoSphereMeasurementResult> {
    const res = await this.provider.calculateArea(geom);
    this.notifyListeners("spatialAnalysis.measured", { type: "area", result: res });
    return res;
  }

  public async calculateLength(geom: LineStringGeometry): Promise<GeoSphereMeasurementResult> {
    const res = await this.provider.calculateLength(geom);
    this.notifyListeners("spatialAnalysis.measured", { type: "length", result: res });
    return res;
  }

  public async calculateBearing(start: GeoSphereCoordinate, end: GeoSphereCoordinate): Promise<GeoSphereMeasurementResult> {
    return this.provider.calculateBearing(start, end);
  }

  public async calculateCentroid(geom: PointGeometry | LineStringGeometry | PolygonGeometry): Promise<GeoSphereCoordinate> {
    return this.provider.calculateCentroid(geom);
  }

  public async calculateExtent(geom: PointGeometry | LineStringGeometry | PolygonGeometry): Promise<GeoSphereExtent> {
    return this.provider.calculateExtent(geom);
  }

  public async validateGeometry(geom: unknown): Promise<GeoSphereValidationResult> {
    return this.provider.validateGeometry(geom);
  }

  public async simplifyGeometry(
    geom: LineStringGeometry | PolygonGeometry,
    tolerance: number
  ): Promise<LineStringGeometry | PolygonGeometry> {
    return this.provider.simplifyGeometry(geom, tolerance);
  }

  public async buffer(
    geom: PointGeometry | LineStringGeometry | PolygonGeometry,
    options: GeoSphereBufferOptions
  ): Promise<PolygonGeometry> {
    const res = await this.provider.buffer(geom, options);
    this.notifyListeners("spatialAnalysis.buffered", { options, result: res });
    return res;
  }

  public async intersection(geomA: PolygonGeometry, geomB: PolygonGeometry): Promise<PolygonGeometry | null> {
    return this.provider.intersection(geomA, geomB);
  }

  public async union(geomA: PolygonGeometry, geomB: PolygonGeometry): Promise<PolygonGeometry> {
    return this.provider.union(geomA, geomB);
  }

  public async difference(geomA: PolygonGeometry, geomB: PolygonGeometry): Promise<PolygonGeometry | null> {
    return this.provider.difference(geomA, geomB);
  }

  public async relate(
    geomA: PointGeometry | PolygonGeometry,
    geomB: PolygonGeometry,
    relation: GeoSphereSpatialRelation
  ): Promise<boolean> {
    return this.provider.relate(geomA, geomB, relation);
  }

  public async nearest(point: GeoSphereCoordinate, features: GeoSphereFeature[]): Promise<GeoSphereNearestFeatureResult | null> {
    return this.provider.nearest(point, features);
  }

  public async cluster(points: GeoSphereCoordinate[], options?: GeoSphereClusterOptions): Promise<GeoSphereCluster[]> {
    return this.provider.cluster(points, options);
  }

  public subscribe(onEvent: (event: { type: string; payload: unknown }) => void): { id: string; unsubscribe: () => void } {
    const subId = `sa_sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    this.listeners.set(subId, onEvent);
    return {
      id: subId,
      unsubscribe: () => {
        this.listeners.delete(subId);
      }
    };
  }

  public destroy(): void {
    this.listeners.clear();
  }

  private notifyListeners(type: string, payload: unknown): void {
    this.listeners.forEach((listener) => {
      try {
        listener({ type, payload });
      } catch (err) {
        console.error("[SPATIAL_ANALYSIS_LISTENER_ERROR] Listener error:", err);
      }
    });
  }
}
