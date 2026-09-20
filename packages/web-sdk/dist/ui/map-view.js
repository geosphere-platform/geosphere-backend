/**
 * GeoSphere Web SDK — GIS Map View Component & Controller
 */
export class GeoSphereMapController {
    config;
    constructor(config) {
        this.config = config;
    }
    getMarkers() {
        return this.config.markers;
    }
    addMarker(marker) {
        this.config.markers.push(marker);
    }
    setZoom(zoom) {
        this.config.zoom = zoom;
    }
}
//# sourceMappingURL=map-view.js.map