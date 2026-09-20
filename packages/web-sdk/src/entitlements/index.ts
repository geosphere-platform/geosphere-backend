import { HTTPClient } from "../http/index.js";
import { Entitlement, APIResponse } from "../types/index.js";

export class EntitlementsModule {
  constructor(private http: HTTPClient) {}

  public async getEntitlements(): Promise<APIResponse<Entitlement[]>> {
    return this.http.get<Entitlement[]>("/api/entitlements");
  }

  public async checkEntitlement(code: string): Promise<APIResponse<{ enabled: boolean }>> {
    return this.http.get<{ enabled: boolean }>(`/api/entitlements/${code}`);
  }
}
