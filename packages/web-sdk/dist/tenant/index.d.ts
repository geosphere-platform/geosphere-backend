import { HTTPClient } from "../http/index.js";
import { Tenant, APIResponse } from "../types/index.js";
export declare class TenantModule {
    private http;
    constructor(http: HTTPClient);
    getTenant(tenantId: string): Promise<APIResponse<Tenant>>;
    listTenants(): Promise<APIResponse<Tenant[]>>;
    switchTenant(tenantId: string): void;
}
//# sourceMappingURL=index.d.ts.map