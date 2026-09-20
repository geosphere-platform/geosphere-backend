import { HTTPClient } from "../http/index.js";
import { Tenant, APIResponse } from "../types/index.js";

export class TenantModule {
  constructor(private http: HTTPClient) {}

  public async getTenant(tenantId: string): Promise<APIResponse<Tenant>> {
    return this.http.get<Tenant>(`/api/tenants/${tenantId}`);
  }

  public async listTenants(): Promise<APIResponse<Tenant[]>> {
    return this.http.get<Tenant[]>("/api/tenants");
  }

  public switchTenant(tenantId: string): void {
    this.http.setTenantId(tenantId);
  }
}
