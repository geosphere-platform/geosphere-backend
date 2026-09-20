import { HTTPClient } from "../http/index.js";
import { AppConfiguration, APIResponse } from "../types/index.js";

export class ConfigurationModule {
  constructor(private http: HTTPClient) {}

  public async getConfiguration(): Promise<APIResponse<AppConfiguration>> {
    return this.http.get<AppConfiguration>("/api/configuration");
  }
}
