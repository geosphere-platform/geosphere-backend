/**
 * GeoSphere Spatial Analysis SDK Core Contracts
 * Framework-Neutral GIS Measurement, Spatial Relations, Geometry & Spatial Query Engine
 * Consumes GeoSphere GIS SDK Contracts (Step 8)
 */
import { GeoSphereDistanceCalculator } from "./tracking.contracts.js";
export class GeoSphereSpatialAnalysisError extends Error {
    code;
    details;
    constructor(code, message, details) {
        super(`[SPATIAL_ANALYSIS_ERROR:${code}] ${message}`);
        this.code = code;
        this.details = details;
        this.name = "GeoSphereSpatialAnalysisError";
    }
}
export class GeoSphereMockSpatialAnalysisProvider {
    getProviderInfo() {
        return { name: "GeoSphereMockSpatialAnalysisProvider", version: "1.0.0" };
    }
    getCapabilities() {
        return [
            "DISTANCE",
            "AREA",
            "LENGTH",
            "BEARING",
            "CENTROID",
            "EXTENT",
            "VALIDATION",
            "SIMPLIFICATION",
            "BUFFER",
            "INTERSECTION",
            "UNION",
            "DIFFERENCE",
            "SPATIAL_RELATIONSHIPS",
            "NEAREST",
            "SPATIAL_QUERY",
            "CLUSTERING"
        ];
    }
    async calculateDistance(geomA, geomB) {
        if (!geomA || !geomB || geomA.type !== "Point" || geomB.type !== "Point") {
            throw new GeoSphereSpatialAnalysisError("INVALID_GEOMETRY", "Distance calculation requires two valid Point geometries.");
        }
        const dist = GeoSphereDistanceCalculator.haversineMeters(geomA.coordinates[1], geomA.coordinates[0], geomB.coordinates[1], geomB.coordinates[0]);
        return {
            value: Math.round(dist * 100) / 100,
            unit: "meters",
            type: "distance",
            sourceGeometryType: "Point",
            targetGeometryType: "Point"
        };
    }
    async calculateArea(geom) {
        if (!geom || geom.type !== "Polygon" || !geom.coordinates || geom.coordinates.length === 0) {
            throw new GeoSphereSpatialAnalysisError("INVALID_GEOMETRY", "Area calculation requires a valid Polygon geometry.");
        }
        // Deterministic Shoelace formula approximation for planar / spherical polygon ring
        const ring = geom.coordinates[0];
        let area = 0;
        for (let i = 0; i < ring.length - 1; i++) {
            const p1 = ring[i];
            const p2 = ring[i + 1];
            area += (p2[0] - p1[0]) * (p2[1] + p1[1]);
        }
        const sqMeters = Math.abs(area) * 111319.5 * 111319.5 * 0.5; // conversion factor approximation
        return {
            value: Math.round(sqMeters * 100) / 100,
            unit: "square_meters",
            type: "area",
            sourceGeometryType: "Polygon"
        };
    }
    async calculateLength(geom) {
        if (!geom || geom.type !== "LineString" || !geom.coordinates || geom.coordinates.length < 2) {
            throw new GeoSphereSpatialAnalysisError("INVALID_GEOMETRY", "Length calculation requires a LineString with at least two coordinates.");
        }
        let totalLen = 0;
        for (let i = 0; i < geom.coordinates.length - 1; i++) {
            const p1 = geom.coordinates[i];
            const p2 = geom.coordinates[i + 1];
            totalLen += GeoSphereDistanceCalculator.haversineMeters(p1[1], p1[0], p2[1], p2[0]);
        }
        return {
            value: Math.round(totalLen * 100) / 100,
            unit: "meters",
            type: "length",
            sourceGeometryType: "LineString"
        };
    }
    async calculateBearing(start, end) {
        if (!start || !end || start.length < 2 || end.length < 2) {
            throw new GeoSphereSpatialAnalysisError("INVALID_GEOMETRY", "Bearing calculation requires valid start and end coordinates.");
        }
        const lat1 = (start[1] * Math.PI) / 180;
        const lat2 = (end[1] * Math.PI) / 180;
        const dLon = ((end[0] - start[0]) * Math.PI) / 180;
        const y = Math.sin(dLon) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
        let brng = (Math.atan2(y, x) * 180) / Math.PI;
        brng = (brng + 360) % 360;
        return {
            value: Math.round(brng * 100) / 100,
            unit: "degrees",
            type: "bearing"
        };
    }
    async calculateCentroid(geom) {
        if (!geom) {
            throw new GeoSphereSpatialAnalysisError("INVALID_GEOMETRY", "Centroid calculation requires a valid geometry.");
        }
        if (geom.type === "Point")
            return geom.coordinates;
        const coords = geom.type === "LineString" ? geom.coordinates : geom.coordinates[0];
        let sumLng = 0;
        let sumLat = 0;
        coords.forEach((c) => {
            sumLng += c[0];
            sumLat += c[1];
        });
        return [Math.round((sumLng / coords.length) * 100000) / 100000, Math.round((sumLat / coords.length) * 100000) / 100000];
    }
    async calculateExtent(geom) {
        if (!geom) {
            throw new GeoSphereSpatialAnalysisError("INVALID_GEOMETRY", "Extent calculation requires a valid geometry.");
        }
        const coords = geom.type === "Point" ? [geom.coordinates] : geom.type === "LineString" ? geom.coordinates : geom.coordinates[0];
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        coords.forEach((c) => {
            if (c[0] < minX)
                minX = c[0];
            if (c[1] < minY)
                minY = c[1];
            if (c[0] > maxX)
                maxX = c[0];
            if (c[1] > maxY)
                maxY = c[1];
        });
        return { minX, minY, maxX, maxY };
    }
    async validateGeometry(geom) {
        if (!geom || typeof geom !== "object") {
            return { isValid: false, errors: ["Geometry object is null or undefined."] };
        }
        const g = geom;
        if (!g.type || !g.coordinates) {
            return { isValid: false, errors: ["Geometry is missing required 'type' or 'coordinates' properties."] };
        }
        return { isValid: true, errors: [], geometryType: g.type };
    }
    async simplifyGeometry(geom, tolerance) {
        if (!geom) {
            throw new GeoSphereSpatialAnalysisError("INVALID_GEOMETRY", "Simplification requires a valid geometry.");
        }
        return JSON.parse(JSON.stringify(geom)); // Retains valid structure
    }
    async buffer(geom, options) {
        if (!geom) {
            throw new GeoSphereSpatialAnalysisError("INVALID_GEOMETRY", "Buffer calculation requires a valid geometry.");
        }
        const centroid = await this.calculateCentroid(geom);
        const d = (options.distanceMeters || 100) / 111319.5; // deg approx
        const ring = [
            [centroid[0] - d, centroid[1] - d],
            [centroid[0] + d, centroid[1] - d],
            [centroid[0] + d, centroid[1] + d],
            [centroid[0] - d, centroid[1] + d],
            [centroid[0] - d, centroid[1] - d]
        ];
        return {
            type: "Polygon",
            coordinates: [ring]
        };
    }
    async intersection(geomA, geomB) {
        return geomA; // Mock intersection polygon
    }
    async union(geomA, geomB) {
        return geomA; // Mock union polygon
    }
    async difference(geomA, geomB) {
        return geomA; // Mock difference polygon
    }
    async relate(geomA, geomB, relation) {
        if (relation === "DISJOINT")
            return false;
        return true; // Mock true relation
    }
    async nearest(point, features) {
        if (!features || features.length === 0)
            return null;
        let closestFeat = features[0];
        let minDistance = Infinity;
        features.forEach((feat) => {
            if (feat.geometry && feat.geometry.type === "Point") {
                const d = GeoSphereDistanceCalculator.haversineMeters(point[1], point[0], feat.geometry.coordinates[1], feat.geometry.coordinates[0]);
                if (d < minDistance) {
                    minDistance = d;
                    closestFeat = feat;
                }
            }
        });
        return {
            feature: closestFeat,
            distanceMeters: Math.round(minDistance),
            nearestPoint: closestFeat.geometry.coordinates
        };
    }
    async cluster(points, options) {
        if (!points || points.length === 0)
            return [];
        return [
            {
                id: "cluster_001",
                center: points[0],
                count: points.length,
                memberIds: points.map((_, i) => `pt_${i}`)
            }
        ];
    }
}
export class GeoSphereSpatialAnalysisSDK {
    config;
    provider;
    listeners = new Map();
    constructor(config = {}, provider) {
        this.config = config;
        this.provider = provider || new GeoSphereMockSpatialAnalysisProvider();
    }
    async initialize() { }
    getProviderInfo() {
        return this.provider.getProviderInfo();
    }
    getCapabilities() {
        return this.provider.getCapabilities();
    }
    hasCapability(capability) {
        return this.getCapabilities().includes(capability);
    }
    async calculateDistance(geomA, geomB) {
        const res = await this.provider.calculateDistance(geomA, geomB);
        this.notifyListeners("spatialAnalysis.measured", { type: "distance", result: res });
        return res;
    }
    async calculateArea(geom) {
        const res = await this.provider.calculateArea(geom);
        this.notifyListeners("spatialAnalysis.measured", { type: "area", result: res });
        return res;
    }
    async calculateLength(geom) {
        const res = await this.provider.calculateLength(geom);
        this.notifyListeners("spatialAnalysis.measured", { type: "length", result: res });
        return res;
    }
    async calculateBearing(start, end) {
        return this.provider.calculateBearing(start, end);
    }
    async calculateCentroid(geom) {
        return this.provider.calculateCentroid(geom);
    }
    async calculateExtent(geom) {
        return this.provider.calculateExtent(geom);
    }
    async validateGeometry(geom) {
        return this.provider.validateGeometry(geom);
    }
    async simplifyGeometry(geom, tolerance) {
        return this.provider.simplifyGeometry(geom, tolerance);
    }
    async buffer(geom, options) {
        const res = await this.provider.buffer(geom, options);
        this.notifyListeners("spatialAnalysis.buffered", { options, result: res });
        return res;
    }
    async intersection(geomA, geomB) {
        return this.provider.intersection(geomA, geomB);
    }
    async union(geomA, geomB) {
        return this.provider.union(geomA, geomB);
    }
    async difference(geomA, geomB) {
        return this.provider.difference(geomA, geomB);
    }
    async relate(geomA, geomB, relation) {
        return this.provider.relate(geomA, geomB, relation);
    }
    async nearest(point, features) {
        return this.provider.nearest(point, features);
    }
    async cluster(points, options) {
        return this.provider.cluster(points, options);
    }
    subscribe(onEvent) {
        const subId = `sa_sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        this.listeners.set(subId, onEvent);
        return {
            id: subId,
            unsubscribe: () => {
                this.listeners.delete(subId);
            }
        };
    }
    destroy() {
        this.listeners.clear();
    }
    notifyListeners(type, payload) {
        this.listeners.forEach((listener) => {
            try {
                listener({ type, payload });
            }
            catch (err) {
                console.error("[SPATIAL_ANALYSIS_LISTENER_ERROR] Listener error:", err);
            }
        });
    }
}
//# sourceMappingURL=spatial-analysis.contracts.js.map