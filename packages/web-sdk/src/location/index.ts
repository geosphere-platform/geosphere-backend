import { HTTPClient } from "../http/index.js";
import { LocationTelemetry, APIResponse } from "../types/index.js";
import { GeoSphereLocationSDK, GeoSphereLocationConfig } from "../contracts/location.contracts.js";

export class LocationModule {
  constructor(private http: HTTPClient) {}

  public createLocationSDK(config?: GeoSphereLocationConfig): GeoSphereLocationSDK {
    return new GeoSphereLocationSDK(config);
  }

  public async sendTelemetry(telemetry: LocationTelemetry): Promise<APIResponse<void>> {
    return this.http.post<void>("/api/location/telemetry", telemetry, {
      idempotencyKey: telemetry.id
    });
  }

  public async getHistory(entityId: string, from: string, to: string): Promise<APIResponse<LocationTelemetry[]>> {
    return this.http.get<LocationTelemetry[]>(`/api/location/history/${entityId}`, {
      params: { from, to }
    });
  }
}

export * from "../contracts/location.contracts.js";
export * from "../contracts/location-ui.contracts.js";
