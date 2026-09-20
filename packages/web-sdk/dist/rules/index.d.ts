import { HTTPClient } from "../http/index.js";
import { APIResponse } from "../types/index.js";
import { GeoSphereRulesSDK, GeoSphereRulesConfig, GeoSphereRulesProvider, GeoSphereRule } from "../contracts/rules.contracts.js";
export declare class RulesModule {
    private http;
    constructor(http: HTTPClient);
    listRules(): Promise<APIResponse<GeoSphereRule[]>>;
    getRule(ruleId: string): Promise<APIResponse<GeoSphereRule>>;
    createRulesSDK(config?: GeoSphereRulesConfig, provider?: GeoSphereRulesProvider): GeoSphereRulesSDK;
}
export * from "../contracts/rules.contracts.js";
export * from "../contracts/rules-ui.contracts.js";
//# sourceMappingURL=index.d.ts.map