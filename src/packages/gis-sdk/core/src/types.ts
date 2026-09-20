export type Environment = "development" | "staging" | "production";

export interface Coordinates {
  latitude: number;
  longitude: number;
  altitude?: number;
}

export interface BoundingBox {
  minLongitude: number;
  minLatitude: number;
  maxLongitude: number;
  maxLatitude: number;
}

export interface GISSDKConfig {
  apiBaseUrl: string;
  organizationId: string;
  workspaceId: string;
  accessToken?: string;
  environment?: Environment;
  logger?: Logger;
  tokenProvider?: TokenProvider;
  retryPolicy?: RetryPolicyConfig;
  timeoutMs?: number;
}

export interface RetryPolicyConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
}

export interface Logger {
  debug(message: string, ...meta: any[]): void;
  info(message: string, ...meta: any[]): void;
  warn(message: string, ...meta: any[]): void;
  error(message: string, ...meta: any[]): void;
}

export interface TokenProvider {
  getAccessToken(): Promise<string | null>;
  refreshAccessToken?(): Promise<string | null>;
  clearToken?(): Promise<void>;
}

export interface GeoJSONGeometry {
  type:
    | "Point"
    | "LineString"
    | "Polygon"
    | "MultiPoint"
    | "MultiLineString"
    | "MultiPolygon"
    | "GeometryCollection";
  coordinates?: any;
  geometries?: GeoJSONGeometry[];
}

export interface GeoJSONFeature<P = Record<string, any>> {
  type: "Feature";
  id?: string | number;
  geometry: GeoJSONGeometry;
  properties: P;
}

export interface GeoJSONFeatureCollection<P = Record<string, any>> {
  type: "FeatureCollection";
  features: GeoJSONFeature<P>[];
}

export interface SDKObservabilityEvent {
  eventType: "request" | "error" | "realtime" | "lifecycle";
  timestamp: string;
  durationMs?: number;
  details?: Record<string, any>;
}
