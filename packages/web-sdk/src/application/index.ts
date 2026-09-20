import { HTTPClient } from "../http/index.js";
import { Application, APIResponse } from "../types/index.js";

export class ApplicationModule {
  constructor(private http: HTTPClient) {}

  public async getApplication(appId: string): Promise<APIResponse<Application>> {
    return this.http.get<Application>(`/api/applications/${appId}`);
  }

  public async listApplications(): Promise<APIResponse<Application[]>> {
    return this.http.get<Application[]>("/api/applications");
  }

  public switchApplication(appId: string): void {
    this.http.setApplicationId(appId);
  }
}
