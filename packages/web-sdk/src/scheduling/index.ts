import { HTTPClient } from "../http/index.js";
import { APIResponse } from "../types/index.js";
import { GeoSphereSchedulingSDK, GeoSphereSchedulingConfig, GeoSphereSchedulingProvider, GeoSphereScheduleEvent } from "../contracts/scheduling.contracts.js";

export class SchedulingModule {
  constructor(private http: HTTPClient) {}

  public async listEvents(): Promise<APIResponse<GeoSphereScheduleEvent[]>> {
    return this.http.get<GeoSphereScheduleEvent[]>("/api/scheduling/events");
  }

  public async getEvent(eventId: string): Promise<APIResponse<GeoSphereScheduleEvent>> {
    return this.http.get<GeoSphereScheduleEvent>(`/api/scheduling/events/${eventId}`);
  }

  public createSchedulingSDK(
    config?: GeoSphereSchedulingConfig,
    provider?: GeoSphereSchedulingProvider
  ): GeoSphereSchedulingSDK {
    return new GeoSphereSchedulingSDK(config, provider);
  }
}

export * from "../contracts/scheduling.contracts.js";
export * from "../contracts/scheduling-ui.contracts.js";
