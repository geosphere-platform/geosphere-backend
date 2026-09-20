export class EntitlementsModule {
    http;
    constructor(http) {
        this.http = http;
    }
    async getEntitlements() {
        return this.http.get("/api/entitlements");
    }
    async checkEntitlement(code) {
        return this.http.get(`/api/entitlements/${code}`);
    }
}
//# sourceMappingURL=index.js.map