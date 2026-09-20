import { HTTPClient } from "../http/index.js";
import { APIResponse } from "../types/index.js";
import { GeoSphereRulesSDK, GeoSphereRulesConfig, GeoSphereRulesProvider, GeoSphereRule } from "../contracts/rules.contracts.js";

export class RulesModule {
  constructor(private http: HTTPClient) {}

  public async listRules(): Promise<APIResponse<GeoSphereRule[]>> {
    return this.http.get<GeoSphereRule[]>("/api/rules");
  }

  public async getRule(ruleId: string): Promise<APIResponse<GeoSphereRule>> {
    return this.http.get<GeoSphereRule>(`/api/rules/${ruleId}`);
  }

  public createRulesSDK(
    config?: GeoSphereRulesConfig,
    provider?: GeoSphereRulesProvider
  ): GeoSphereRulesSDK {
    return new GeoSphereRulesSDK(config, provider);
  }
}

export * from "../contracts/rules.contracts.js";
export * from "../contracts/rules-ui.contracts.js";
