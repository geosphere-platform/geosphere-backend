export class FeaturesModule {
    http;
    constructor(http) {
        this.http = http;
    }
    async getFeatures(layerId) {
        return this.http.get(`/api/layers/${layerId}/features`);
    }
    async addFeature(layerId, feature) {
        return this.http.post(`/api/layers/${layerId}/features`, feature);
    }
}
//# sourceMappingURL=index.js.map