import {
  GISSDK,
  ApiClient,
  Coordinates,
  GeoJSONGeometry,
  SDKEventEmitter,
} from "@gis-sdk/core";

export type GeofenceType = "circle" | "polygon" | "multi-polygon" | "corridor";
export type GeofenceEventType = "ENTER" | "EXIT" | "DWELL";

export interface GeofenceDefinition {
  id?: string;
  name: string;
  type: GeofenceType;
  enabled?: boolean;
  center?: Coordinates;
  radiusMeters?: number;
  geometry?: GeoJSONGeometry;
  corridorWidthMeters?: number;
  metadata?: Record<string, any>;
}

export interface GeofenceEventPayload {
  eventType: GeofenceEventType;
  geofenceId: string;
  entityId: string;
  coordinates: Coordinates;
  timestamp: string;
}

export class GeofenceSDK {
  private apiClient: ApiClient;
  private eventBus: SDKEventEmitter = new SDKEventEmitter();

  constructor(apiClient?: ApiClient) {
    this.apiClient = apiClient || GISSDK.getInstance().getApiClient();
  }

  public async createGeofence(
    definition: GeofenceDefinition,
  ): Promise<GeofenceDefinition> {
    return this.apiClient.post("/api/v1/geofences", definition);
  }

  public async updateGeofence(
    id: string,
    updates: Partial<GeofenceDefinition>,
  ): Promise<GeofenceDefinition> {
    return this.apiClient.put(`/api/v1/geofences/${id}`, updates);
  }

  public async deleteGeofence(id: string): Promise<void> {
    return this.apiClient.delete(`/api/v1/geofences/${id}`);
  }

  public async enableGeofence(id: string): Promise<void> {
    return this.apiClient.put(`/api/v1/geofences/${id}/enable`);
  }

  public async disableGeofence(id: string): Promise<void> {
    return this.apiClient.put(`/api/v1/geofences/${id}/disable`);
  }

  public async listGeofences(): Promise<GeofenceDefinition[]> {
    try {
      const res: any = await this.apiClient.get("/api/v1/geofences");
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      if (res && Array.isArray(res.geofences)) return res.geofences;
      return [];
    } catch {
      return [];
    }
  }

  public async checkPoint(
    point: Coordinates,
    geofenceId?: string,
  ): Promise<{ inside: boolean; geofences: GeofenceDefinition[] }> {
    try {
      const res: any = await this.apiClient.post("/api/v1/geofences/check", {
        latitude: point.latitude,
        longitude: point.longitude,
        geofenceId,
      });
      if (res && typeof res.inside === "boolean") {
        return {
          inside: res.inside,
          geofences: Array.isArray(res.geofences) ? res.geofences : [],
        };
      }
      return { inside: false, geofences: [] };
    } catch {
      return { inside: false, geofences: [] };
    }
  }

  public onGeofenceEvent(
    eventType: GeofenceEventType,
    callback: (payload: GeofenceEventPayload) => void,
  ): () => void {
    return this.eventBus.on(eventType, callback);
  }

  public emitGeofenceEvent(payload: GeofenceEventPayload): void {
    this.eventBus.emit(payload.eventType, payload);
  }
}
