export class TenantModule {
    http;
    constructor(http) {
        this.http = http;
    }
    async getTenant(tenantId) {
        return this.http.get(`/api/tenants/${tenantId}`);
    }
    async listTenants() {
        return this.http.get("/api/tenants");
    }
    switchTenant(tenantId) {
        this.http.setTenantId(tenantId);
    }
}
//# sourceMappingURL=index.js.map