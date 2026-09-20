export class ConfigurationModule {
    http;
    constructor(http) {
        this.http = http;
    }
    async getConfiguration() {
        return this.http.get("/api/configuration");
    }
}
//# sourceMappingURL=index.js.map