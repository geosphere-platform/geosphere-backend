import { GeoSphereRulesSDK } from "../contracts/rules.contracts.js";
export class RulesModule {
    http;
    constructor(http) {
        this.http = http;
    }
    async listRules() {
        return this.http.get("/api/rules");
    }
    async getRule(ruleId) {
        return this.http.get(`/api/rules/${ruleId}`);
    }
    createRulesSDK(config, provider) {
        return new GeoSphereRulesSDK(config, provider);
    }
}
export * from "../contracts/rules.contracts.js";
export * from "../contracts/rules-ui.contracts.js";
//# sourceMappingURL=index.js.map