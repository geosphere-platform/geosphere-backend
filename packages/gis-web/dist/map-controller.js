"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeoSphereMapController = void 0;
const Map_js_1 = __importDefault(require("ol/Map.js"));
const View_js_1 = __importDefault(require("ol/View.js"));
const Tile_js_1 = __importDefault(require("ol/layer/Tile.js"));
const Vector_js_1 = __importDefault(require("ol/layer/Vector.js"));
const OSM_js_1 = __importDefault(require("ol/source/OSM.js"));
const Vector_js_2 = __importDefault(require("ol/source/Vector.js"));
const Feature_js_1 = __importDefault(require("ol/Feature.js"));
const Point_js_1 = __importDefault(require("ol/geom/Point.js"));
const LineString_js_1 = __importDefault(require("ol/geom/LineString.js"));
const Polygon_js_1 = __importDefault(require("ol/geom/Polygon.js"));
const proj_js_1 = require("ol/proj.js");
class GeoSphereMapController {
    map;
    vectorSource;
    vectorLayer;
    constructor(config) {
        const centerLonLat = config.center || [0, 0];
        this.vectorSource = new Vector_js_2.default();
        this.vectorLayer = new Vector_js_1.default({
            source: this.vectorSource
        });
        this.map = new Map_js_1.default({
            target: config.target,
            layers: [
                new Tile_js_1.default({
                    source: new OSM_js_1.default()
                }),
                this.vectorLayer
            ],
            view: new View_js_1.default({
                center: (0, proj_js_1.fromLonLat)(centerLonLat),
                zoom: config.zoom || 10
            })
        });
    }
    addMarker(id, lng, lat, properties) {
        const feature = new Feature_js_1.default({
            geometry: new Point_js_1.default((0, proj_js_1.fromLonLat)([lng, lat])),
            id,
            ...properties
        });
        feature.setId(id);
        this.vectorSource.addFeature(feature);
        return feature;
    }
    addPolyline(id, coordinates) {
        const projectedCoords = coordinates.map((c) => (0, proj_js_1.fromLonLat)(c));
        const feature = new Feature_js_1.default({
            geometry: new LineString_js_1.default(projectedCoords),
            id
        });
        feature.setId(id);
        this.vectorSource.addFeature(feature);
        return feature;
    }
    addPolygon(id, coordinates) {
        const projectedRings = coordinates.map((ring) => ring.map((c) => (0, proj_js_1.fromLonLat)(c)));
        const feature = new Feature_js_1.default({
            geometry: new Polygon_js_1.default(projectedRings),
            id
        });
        feature.setId(id);
        this.vectorSource.addFeature(feature);
        return feature;
    }
    clearFeatures() {
        this.vectorSource.clear();
    }
    getExtentBBOX() {
        const extent = this.map.getView().calculateExtent(this.map.getSize());
        const min = (0, proj_js_1.toLonLat)([extent[0], extent[1]]);
        const max = (0, proj_js_1.toLonLat)([extent[2], extent[3]]);
        return [min[0], min[1], max[0], max[1]];
    }
    destroy() {
        this.map.setTarget(undefined);
    }
}
exports.GeoSphereMapController = GeoSphereMapController;
//# sourceMappingURL=map-controller.js.map