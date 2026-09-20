export class ApplicationModule {
    http;
    constructor(http) {
        this.http = http;
    }
    async getApplication(appId) {
        return this.http.get(`/api/applications/${appId}`);
    }
    async listApplications() {
        return this.http.get("/api/applications");
    }
    switchApplication(appId) {
        this.http.setApplicationId(appId);
    }
}
//# sourceMappingURL=index.js.map