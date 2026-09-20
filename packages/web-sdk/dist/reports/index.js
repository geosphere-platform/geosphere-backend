export class ReportsModule {
    http;
    constructor(http) {
        this.http = http;
    }
    async generateReport(type, params) {
        return this.http.post("/api/reports/generate", { type, params });
    }
}
//# sourceMappingURL=index.js.map