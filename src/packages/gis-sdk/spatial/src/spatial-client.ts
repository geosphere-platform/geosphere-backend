import {
  GISSDK,
  ApiClient,
  Coordinates,
  BoundingBox,
  GeoJSONFeature,
  GeoJSONGeometry,
} from "@gis-sdk/core";
import { GeocodingProvider, DefaultGeocodingProvider } from "./geocoding";
import { RoutingProvider, DefaultRoutingProvider } from "./routing";

export interface SpatialQueryParams {
  layerId?: string;
  limit?: number;
  offset?: number;
}

export class SpatialSDK {
  private apiClient: ApiClient;
  private geocodingProvider: GeocodingProvider;
  private routingProvider: RoutingProvider;

  constructor(
    apiClient?: ApiClient,
    geocodingProvider?: GeocodingProvider,
    routingProvider?: RoutingProvider,
  ) {
    this.apiClient = apiClient || GISSDK.getInstance().getApiClient();
    this.geocodingProvider =
      geocodingProvider || new DefaultGeocodingProvider();
    this.routingProvider = routingProvider || new DefaultRoutingProvider();
  }

  private normalizeFeatures(res: any): GeoJSONFeature[] {
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    if (res && Array.isArray(res.features)) return res.features;
    return [];
  }

  public async nearby(
    center: Coordinates,
    radiusMeters: number,
    params: SpatialQueryParams = {},
  ): Promise<GeoJSONFeature[]> {
    try {
      const res = await this.apiClient.post("/api/v1/spatial/query/nearby", {
        latitude: center.latitude,
        longitude: center.longitude,
        radiusMeters,
        ...params,
      });
      return this.normalizeFeatures(res);
    } catch {
      return [];
    }
  }

  public async within(
    polygon: GeoJSONGeometry,
    params: SpatialQueryParams = {},
  ): Promise<GeoJSONFeature[]> {
    try {
      const res = await this.apiClient.post("/api/v1/spatial/query/within", {
        geometry: polygon,
        ...params,
      });
      return this.normalizeFeatures(res);
    } catch {
      return [];
    }
  }

  public async intersects(
    geometry: GeoJSONGeometry,
    params: SpatialQueryParams = {},
  ): Promise<GeoJSONFeature[]> {
    try {
      const res = await this.apiClient.post(
        "/api/v1/spatial/query/intersects",
        {
          geometry,
          ...params,
        },
      );
      return this.normalizeFeatures(res);
    } catch {
      return [];
    }
  }

  public async contains(
    point: Coordinates,
    params: SpatialQueryParams = {},
  ): Promise<GeoJSONFeature[]> {
    try {
      const res = await this.apiClient.post("/api/v1/spatial/query/contains", {
        latitude: point.latitude,
        longitude: point.longitude,
        ...params,
      });
      return this.normalizeFeatures(res);
    } catch {
      return [];
    }
  }

  public async bbox(
    box: BoundingBox,
    params: SpatialQueryParams = {},
  ): Promise<GeoJSONFeature[]> {
    try {
      const res = await this.apiClient.post("/api/v1/spatial/query/bbox", {
        bbox: [
          box.minLongitude,
          box.minLatitude,
          box.maxLongitude,
          box.maxLatitude,
        ],
        ...params,
      });
      return this.normalizeFeatures(res);
    } catch {
      return [];
    }
  }

  public async nearest(
    center: Coordinates,
    limit: number = 1,
  ): Promise<GeoJSONFeature[]> {
    try {
      const res = await this.apiClient.post("/api/v1/spatial/query/nearest", {
        latitude: center.latitude,
        longitude: center.longitude,
        limit,
      });
      return this.normalizeFeatures(res);
    } catch {
      return [];
    }
  }

  public getGeocoding(): GeocodingProvider {
    return this.geocodingProvider;
  }

  public setGeocodingProvider(provider: GeocodingProvider): void {
    this.geocodingProvider = provider;
  }

  public getRouting(): RoutingProvider {
    return this.routingProvider;
  }

  public setRoutingProvider(provider: RoutingProvider): void {
    this.routingProvider = provider;
  }
}
