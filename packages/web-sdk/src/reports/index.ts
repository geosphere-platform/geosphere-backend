import { HTTPClient } from "../http/index.js";
import { APIResponse } from "../types/index.js";

export class ReportsModule {
  constructor(private http: HTTPClient) {}

  public async generateReport(type: string, params: Record<string, unknown>): Promise<APIResponse<{ reportUrl: string }>> {
    return this.http.post<{ reportUrl: string }>("/api/reports/generate", { type, params });
  }
}
