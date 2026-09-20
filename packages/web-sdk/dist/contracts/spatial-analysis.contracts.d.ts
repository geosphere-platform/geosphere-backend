/**
 * GeoSphere Spatial Analysis SDK Core Contracts
 * Framework-Neutral GIS Measurement, Spatial Relations, Geometry & Spatial Query Engine
 * Consumes GeoSphere GIS SDK Contracts (Step 8)
 */
import { GeoSphereCoordinate, GeoSphereFeature, LineStringGeometry, PointGeometry, PolygonGeometry } from "./gis.contracts.js";
export type GeoSphereSpatialRelation = "CONTAINS" | "WITHIN" | "INTERSECTS" | "OVERLAPS" | "TOUCHES" | "CROSSES" | "DISJOINT";
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
export type GeoSphereSpatialAnalysisCapability = "DISTANCE" | "AREA" | "LENGTH" | "BEARING" | "CENTROID" | "EXTENT" | "VALIDATION" | "SIMPLIFICATION" | "BUFFER" | "INTERSECTION" | "UNION" | "DIFFERENCE" | "SPATIAL_RELATIONSHIPS" | "NEAREST" | "SPATIAL_QUERY" | "CLUSTERING";
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
export declare class GeoSphereSpatialAnalysisError extends Error {
    readonly code: "INVALID_GEOMETRY" | "UNSUPPORTED_OPERATION" | "CALCULATION_FAILED" | "PROVIDER_UNAVAILABLE" | "UNKNOWN_ERROR";
    readonly details?: unknown | undefined;
    constructor(code: "INVALID_GEOMETRY" | "UNSUPPORTED_OPERATION" | "CALCULATION_FAILED" | "PROVIDER_UNAVAILABLE" | "UNKNOWN_ERROR", message: string, details?: unknown | undefined);
}
export declare class GeoSphereMockSpatialAnalysisProvider implements IGeoSphereSpatialAnalysisProvider {
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
export interface GeoSphereSpatialAnalysisConfig {
    units?: "metric" | "imperial";
    precision?: number;
    tolerance?: number;
    embeddedMode?: boolean;
}
export declare class GeoSphereSpatialAnalysisSDK {
    private config;
    private provider;
    private listeners;
    constructor(config?: GeoSphereSpatialAnalysisConfig, provider?: IGeoSphereSpatialAnalysisProvider);
    initialize(): Promise<void>;
    getProviderInfo(): GeoSphereSpatialAnalysisProviderInfo;
    getCapabilities(): GeoSphereSpatialAnalysisCapability[];
    hasCapability(capability: GeoSphereSpatialAnalysisCapability): boolean;
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
    subscribe(onEvent: (event: {
        type: string;
        payload: unknown;
    }) => void): {
        id: string;
        unsubscribe: () => void;
    };
    destroy(): void;
    private notifyListeners;
}
//# sourceMappingURL=spatial-analysis.contracts.d.ts.map