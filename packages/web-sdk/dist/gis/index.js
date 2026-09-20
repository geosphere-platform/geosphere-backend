import { GeoSphereGIS } from "../contracts/gis.contracts.js";
export class GISModule {
    http;
    constructor(http) {
        this.http = http;
    }
    createMap(config) {
        return new GeoSphereGIS(config);
    }
    async getSpatialOverview() {
        return this.http.get("/api/gis/overview");
    }
    async spatialQuery(bbox, layerIds) {
        return this.http.post("/api/gis/query", { bbox, layerIds });
    }
}
export * from "../contracts/gis.contracts.js";
export * from "../contracts/gis-ui.contracts.js";
//# sourceMappingURL=index.js.map