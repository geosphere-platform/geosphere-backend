import { GeoSphereMapping } from "../contracts/mapping.contracts.js";
export class MapsModule {
    http;
    constructor(http) {
        this.http = http;
    }
    createMapping(config) {
        return new GeoSphereMapping(config);
    }
    async listMaps() {
        return this.http.get("/api/maps");
    }
    async getMap(mapId) {
        return this.http.get(`/api/maps/${mapId}`);
    }
    async createMap(mapData) {
        return this.http.post("/api/maps", mapData);
    }
}
export * from "../contracts/mapping.contracts.js";
export * from "../contracts/mapping-ui.contracts.js";
//# sourceMappingURL=index.js.map