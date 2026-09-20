export class LicensingModule {
    http;
    constructor(http) {
        this.http = http;
    }
    async getLicense() {
        return this.http.get("/api/license");
    }
    async validateLicenseKey(licenseKey) {
        return this.http.post("/api/license/validate", { licenseKey });
    }
}
//# sourceMappingURL=index.js.map