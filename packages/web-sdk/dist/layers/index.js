export class LayersModule {
    http;
    constructor(http) {
        this.http = http;
    }
    async listLayers(mapId) {
        return this.http.get("/api/layers", { params: { mapId } });
    }
    async getLayer(layerId) {
        return this.http.get(`/api/layers/${layerId}`);
    }
    async createLayer(layerData) {
        return this.http.post("/api/layers", layerData);
    }
}
//# sourceMappingURL=index.js.map