import { HTTPClient } from "../http/index.js";
import { Entitlement, APIResponse } from "../types/index.js";
export declare class EntitlementsModule {
    private http;
    constructor(http: HTTPClient);
    getEntitlements(): Promise<APIResponse<Entitlement[]>>;
    checkEntitlement(code: string): Promise<APIResponse<{
        enabled: boolean;
    }>>;
}
//# sourceMappingURL=index.d.ts.map