/**
 * GeoSphere Routing SDK Core Contracts & Multi-Platform Domain Models
 * Framework-Neutral Route Calculation Engine & Provider Abstraction Boundary
 * Consumes GeoSphere GIS SDK Contracts from Step 8
 */
import { GeoSphereLocationSDK } from "./location.contracts.js";
import { GeoSphereDistanceCalculator } from "./tracking.contracts.js";
export class GeoSphereRoutingError extends Error {
    code;
    details;
    constructor(code, message, details) {
        super(`[ROUTING_ERROR:${code}] ${message}`);
        this.code = code;
        this.details = details;
        this.name = "GeoSphereRoutingError";
    }
}
export function validateCoordinate(coord, contextLabel = "Coordinate") {
    if (!Array.isArray(coord) || coord.length < 2 || isNaN(coord[0]) || isNaN(coord[1])) {
        throw new GeoSphereRoutingError("INVALID_COORDINATE", `${contextLabel} must be a valid [lng, lat] array.`);
    }
    const [lng, lat] = coord;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw new GeoSphereRoutingError("INVALID_COORDINATE", `${contextLabel} values out of geographic bounds: [${lng}, ${lat}].`);
    }
}
export function normalizeWaypoint(input, nameFallback) {
    if (Array.isArray(input)) {
        validateCoordinate(input, nameFallback);
        return { name: nameFallback, coordinate: input };
    }
    validateCoordinate(input.coordinate, input.name || nameFallback);
    return {
        id: input.id || `wp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: input.name || nameFallback,
        coordinate: input.coordinate
    };
}
/**
 * Production-Safe Deterministic Mock Routing Provider for Tests & Offline Usage
 */
export class GeoSphereMockRoutingProvider {
    name = "GeoSphereDeterministicMockProvider";
    version = "1.0.0";
    getCapabilities() {
        return ["ROUTE_CALCULATION", "ALTERNATIVE_ROUTES", "WAYPOINTS", "DRIVING", "WALKING", "CYCLING", "TRUCK", "MOTORCYCLE", "TURN_INSTRUCTIONS"];
    }
    async calculateRoute(request) {
        const originWp = normalizeWaypoint(request.origin, "Origin");
        const destWp = normalizeWaypoint(request.destination, "Destination");
        const waypoints = [originWp];
        if (request.waypoints && request.waypoints.length > 0) {
            request.waypoints.forEach((wp, i) => {
                waypoints.push(normalizeWaypoint(wp, `Waypoint ${i + 1}`));
            });
        }
        waypoints.push(destWp);
        const profile = request.options?.profile || "driving";
        const speedFactorMs = profile === "walking" ? 1.4 : profile === "cycling" ? 4.5 : 15.0; // speed in m/s
        const legs = [];
        let totalDist = 0;
        let totalDur = 0;
        const allCoords = [];
        for (let i = 0; i < waypoints.length - 1; i++) {
            const startWp = waypoints[i];
            const endWp = waypoints[i + 1];
            const legDist = GeoSphereDistanceCalculator.haversineMeters(startWp.coordinate[1], startWp.coordinate[0], endWp.coordinate[1], endWp.coordinate[0]);
            const legDur = Math.round(legDist / speedFactorMs);
            totalDist += legDist;
            totalDur += legDur;
            const legSteps = [
                {
                    instruction: `Head towards ${endWp.name}`,
                    distanceMeters: Math.round(legDist),
                    durationSeconds: legDur,
                    startCoordinate: startWp.coordinate,
                    endCoordinate: endWp.coordinate,
                    maneuver: { type: "depart", modifier: "straight" }
                }
            ];
            legs.push({
                startWaypoint: startWp,
                endWaypoint: endWp,
                distanceMeters: Math.round(legDist),
                durationSeconds: legDur,
                steps: legSteps,
                geometry: {
                    type: "LineString",
                    coordinates: [startWp.coordinate, endWp.coordinate]
                }
            });
            if (i === 0)
                allCoords.push(startWp.coordinate);
            allCoords.push(endWp.coordinate);
        }
        const routeId = `route_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const nowIso = new Date().toISOString();
        const summary = {
            totalDistanceMeters: Math.round(totalDist),
            totalDistanceKm: Math.round((totalDist / 1000) * 100) / 100,
            totalDurationSeconds: totalDur,
            totalDurationMinutes: Math.round((totalDur / 60) * 10) / 10,
            legCount: legs.length,
            stepCount: legs.reduce((acc, leg) => acc + leg.steps.length, 0),
            profile,
            providerName: this.name
        };
        const primaryRoute = {
            id: routeId,
            request,
            geometry: { type: "LineString", coordinates: allCoords },
            summary,
            legs,
            waypoints,
            createdAt: nowIso
        };
        const alternativeRoutes = [];
        if (request.options?.alternatives) {
            const altRoute = {
                ...primaryRoute,
                id: `${routeId}_alt1`,
                summary: {
                    ...summary,
                    totalDistanceMeters: Math.round(totalDist * 1.15),
                    totalDistanceKm: Math.round(((totalDist * 1.15) / 1000) * 100) / 100,
                    totalDurationSeconds: Math.round(totalDur * 1.12),
                    totalDurationMinutes: Math.round(((totalDur * 1.12) / 60) * 10) / 10
                }
            };
            alternativeRoutes.push(altRoute);
        }
        return {
            primaryRoute,
            alternativeRoutes: alternativeRoutes.length > 0 ? alternativeRoutes : undefined,
            providerName: this.name,
            evaluatedAt: nowIso
        };
    }
}
export class GeoSphereRoutingSDK {
    config;
    provider;
    selectedRoute = null;
    listeners = new Map();
    locationSdk;
    constructor(config = {}, provider, locationSdk) {
        this.config = config;
        this.provider = provider || new GeoSphereMockRoutingProvider();
        this.locationSdk = locationSdk;
    }
    async initialize(provider) {
        if (provider) {
            this.provider = provider;
        }
    }
    setProvider(provider) {
        this.provider = provider;
    }
    getProviderInfo() {
        return { name: this.provider.name, version: this.provider.version };
    }
    getCapabilities() {
        return this.provider.getCapabilities();
    }
    hasCapability(capability) {
        return this.getCapabilities().includes(capability);
    }
    async calculateRoute(request) {
        this.notifyListeners("routing.requestStarted", { request });
        try {
            const response = await this.provider.calculateRoute(request);
            this.selectedRoute = response.primaryRoute;
            this.notifyListeners("routing.requestCompleted", { response });
            return response;
        }
        catch (err) {
            this.notifyListeners("routing.requestFailed", { error: err });
            throw err;
        }
    }
    async calculateRouteFromCurrentLocation(destination, options) {
        if (!this.locationSdk) {
            this.locationSdk = new GeoSphereLocationSDK();
            await this.locationSdk.initialize();
        }
        const currentLoc = await this.locationSdk.getCurrentLocation();
        const origin = [currentLoc.longitude, currentLoc.latitude];
        return this.calculateRoute({
            origin,
            destination,
            options
        });
    }
    selectRoute(route) {
        this.selectedRoute = route;
        this.notifyListeners("routing.routeSelected", { route });
    }
    getSelectedRoute() {
        return this.selectedRoute;
    }
    subscribe(onEvent) {
        const subId = `route_sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
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
        this.selectedRoute = null;
    }
    notifyListeners(type, payload) {
        this.listeners.forEach((listener) => {
            try {
                listener({ type, payload });
            }
            catch (err) {
                console.error("[ROUTING_LISTENER_ERROR] Listener error:", err);
            }
        });
    }
}
//# sourceMappingURL=routing.contracts.js.map