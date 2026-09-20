/**
 * GeoSphere Geofencing SDK Core Contracts & Multi-Platform Domain Models
 * Framework-Neutral Spatial Evaluation Engine (Circle & Polygon Geofences)
 * Consumes GeoSphere Location SDK from Step 10 & GIS SDK Contracts from Step 8
 */
import { GeoSphereLocationSDK } from "./location.contracts.js";
import { GeoSphereDistanceCalculator } from "./tracking.contracts.js";
export function validateGeofenceGeometry(geometry) {
    if (!geometry || typeof geometry !== "object") {
        throw new Error("[GEOFENCE_ERROR:INVALID_GEOMETRY] Geofence geometry must be a valid object.");
    }
    if (geometry.type === "circle") {
        const { center, radiusMeters } = geometry;
        if (!Array.isArray(center) || center.length < 2 || isNaN(center[0]) || isNaN(center[1])) {
            throw new Error("[GEOFENCE_ERROR:INVALID_GEOMETRY] Circle center must be valid [lng, lat] coordinates.");
        }
        if (center[1] < -90 || center[1] > 90 || center[0] < -180 || center[0] > 180) {
            throw new Error("[GEOFENCE_ERROR:INVALID_GEOMETRY] Circle center coordinates out of geographic bounds.");
        }
        if (typeof radiusMeters !== "number" || isNaN(radiusMeters) || radiusMeters <= 0) {
            throw new Error("[GEOFENCE_ERROR:INVALID_GEOMETRY] Circle radius must be greater than 0 meters.");
        }
    }
    else if (geometry.type === "polygon") {
        const { coordinates } = geometry;
        if (!Array.isArray(coordinates) || coordinates.length === 0 || !Array.isArray(coordinates[0])) {
            throw new Error("[GEOFENCE_ERROR:INVALID_GEOMETRY] Polygon coordinates must contain at least one linear ring.");
        }
        const outerRing = coordinates[0];
        if (outerRing.length < 3) {
            throw new Error("[GEOFENCE_ERROR:INVALID_GEOMETRY] Polygon linear ring must contain at least 3 vertices.");
        }
        outerRing.forEach((pt, idx) => {
            if (!Array.isArray(pt) || pt.length < 2 || isNaN(pt[0]) || isNaN(pt[1])) {
                throw new Error(`[GEOFENCE_ERROR:INVALID_GEOMETRY] Invalid coordinate vertex at index ${idx}.`);
            }
            if (pt[1] < -90 || pt[1] > 90 || pt[0] < -180 || pt[0] > 180) {
                throw new Error(`[GEOFENCE_ERROR:INVALID_GEOMETRY] Polygon vertex at index ${idx} out of geographic bounds.`);
            }
        });
    }
    else {
        throw new Error(`[GEOFENCE_ERROR:UNSUPPORTED_GEOMETRY] Geofence type ${geometry.type} is unsupported.`);
    }
}
export function pointInCircle(point, center, radiusMeters) {
    const distMeters = GeoSphereDistanceCalculator.haversineMeters(point.latitude, point.longitude, center[1], // center lat
    center[0] // center lng
    );
    return distMeters <= radiusMeters;
}
export function pointInPolygon(point, ring) {
    let inside = false;
    const x = point.longitude;
    const y = point.latitude;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i][0];
        const yi = ring[i][1];
        const xj = ring[j][0];
        const yj = ring[j][1];
        const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
        if (intersect)
            inside = !inside;
    }
    return inside;
}
export function evaluateGeofenceState(point, geofence) {
    const geom = geofence.geometry;
    let isInside = false;
    if (geom.type === "circle") {
        isInside = pointInCircle(point, geom.center, geom.radiusMeters);
    }
    else if (geom.type === "polygon") {
        isInside = pointInPolygon(point, geom.coordinates[0]);
    }
    return isInside ? "INSIDE" : "OUTSIDE";
}
export class GeoSphereGeofencingSDK {
    globalConfig;
    geofences = new Map();
    geofenceStates = new Map();
    dwellTimers = new Map();
    listeners = new Map();
    locationSdk;
    locationSubId = null;
    constructor(globalConfig = {}, locationSdk) {
        this.globalConfig = globalConfig;
        // Consumes Location SDK from Step 10 (Zero Duplicate Location Engine)
        this.locationSdk = locationSdk || new GeoSphereLocationSDK();
    }
    async initialize(locationSdk) {
        if (locationSdk) {
            this.locationSdk = locationSdk;
        }
        await this.locationSdk.initialize();
        // Auto-evaluate incoming location stream
        const sub = this.locationSdk.subscribe((location) => {
            this.evaluateLocation(location);
        });
        this.locationSubId = sub.id;
    }
    registerGeofence(geofence) {
        validateGeofenceGeometry(geofence.geometry);
        const existing = this.geofences.get(geofence.id);
        const initialGeofence = {
            ...geofence,
            enabled: geofence.enabled ?? true,
            state: existing ? existing.state : "UNKNOWN"
        };
        this.geofences.set(geofence.id, initialGeofence);
        if (!existing) {
            this.geofenceStates.set(geofence.id, "UNKNOWN");
        }
    }
    updateGeofence(geofenceId, updates) {
        const existing = this.geofences.get(geofenceId);
        if (!existing) {
            throw new Error(`[GEOFENCE_ERROR:NOT_FOUND] Geofence with id ${geofenceId} not found.`);
        }
        if (updates.geometry) {
            validateGeofenceGeometry(updates.geometry);
        }
        const updated = {
            ...existing,
            ...updates,
            id: existing.id // Immutable id
        };
        this.geofences.set(geofenceId, updated);
    }
    removeGeofence(geofenceId) {
        this.geofences.delete(geofenceId);
        this.geofenceStates.delete(geofenceId);
        this.clearDwellTimer(geofenceId);
    }
    enableGeofence(geofenceId) {
        const existing = this.geofences.get(geofenceId);
        if (existing) {
            existing.enabled = true;
        }
    }
    disableGeofence(geofenceId) {
        const existing = this.geofences.get(geofenceId);
        if (existing) {
            existing.enabled = false;
            this.clearDwellTimer(geofenceId);
        }
    }
    getGeofence(geofenceId) {
        return this.geofences.get(geofenceId);
    }
    listGeofences() {
        return Array.from(this.geofences.values());
    }
    getCapabilities() {
        return ["CIRCLE", "POLYGON", "MULTIPOLYGON", "ENTER_EXIT", "DWELL", "MULTIPLE_GEOFENCES", "OVERLAPPING_GEOFENCES"];
    }
    hasCapability(capability) {
        return this.getCapabilities().includes(capability);
    }
    evaluateLocation(location, subjectId = "device") {
        const generatedEvents = [];
        this.geofences.forEach((geofence) => {
            if (!geofence.enabled)
                return;
            const effectiveConfig = { ...this.globalConfig, ...geofence.config };
            // Accuracy Filter
            if (effectiveConfig.accuracyThresholdMeters && location.accuracy && location.accuracy > effectiveConfig.accuracyThresholdMeters) {
                return;
            }
            const prevState = this.geofenceStates.get(geofence.id) || "UNKNOWN";
            const currentState = evaluateGeofenceState(location, geofence);
            const nowIso = new Date().toISOString();
            if (prevState !== currentState && prevState !== "UNKNOWN") {
                const eventType = currentState === "INSIDE" ? "geofence.enter" : "geofence.exit";
                const evt = {
                    id: `evt_geo_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    geofenceId: geofence.id,
                    geofenceName: geofence.name,
                    subjectId,
                    previousState: prevState,
                    currentState,
                    eventType,
                    location,
                    timestamp: nowIso,
                    metadata: geofence.metadata
                };
                this.geofenceStates.set(geofence.id, currentState);
                geofence.state = currentState;
                generatedEvents.push(evt);
                this.notifyListeners(evt);
                // Reset dwell timer on exit
                if (currentState === "OUTSIDE") {
                    this.clearDwellTimer(geofence.id);
                }
            }
            else if (prevState === "UNKNOWN") {
                this.geofenceStates.set(geofence.id, currentState);
                geofence.state = currentState;
            }
            // Dwell Evaluation
            if (currentState === "INSIDE" && effectiveConfig.dwellConfig?.enabled) {
                this.evaluateDwell(geofence, location, subjectId, effectiveConfig.dwellConfig, generatedEvents);
            }
        });
        return generatedEvents;
    }
    subscribe(onGeofenceEvent) {
        const subId = `geo_sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        this.listeners.set(subId, onGeofenceEvent);
        return {
            id: subId,
            unsubscribe: () => {
                this.listeners.delete(subId);
            }
        };
    }
    destroy() {
        this.dwellTimers.forEach((timerId) => clearTimeout(timerId));
        this.dwellTimers.clear();
        this.listeners.clear();
        this.geofences.clear();
        this.geofenceStates.clear();
    }
    evaluateDwell(geofence, location, subjectId, dwellConfig, outEvents) {
        if (this.dwellTimers.has(geofence.id))
            return;
        const dwellMs = dwellConfig.dwellDurationSeconds * 1000;
        const timerId = setTimeout(() => {
            const current = this.geofences.get(geofence.id);
            if (current && current.state === "INSIDE" && current.enabled) {
                const dwellEvt = {
                    id: `evt_dwell_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                    geofenceId: geofence.id,
                    geofenceName: geofence.name,
                    subjectId,
                    previousState: "INSIDE",
                    currentState: "INSIDE",
                    eventType: "geofence.dwell",
                    location,
                    timestamp: new Date().toISOString(),
                    dwellDurationSeconds: dwellConfig.dwellDurationSeconds,
                    metadata: geofence.metadata
                };
                outEvents.push(dwellEvt);
                this.notifyListeners(dwellEvt);
            }
            this.dwellTimers.delete(geofence.id);
        }, dwellMs);
        this.dwellTimers.set(geofence.id, timerId);
    }
    clearDwellTimer(geofenceId) {
        const timerId = this.dwellTimers.get(geofenceId);
        if (timerId !== undefined) {
            clearTimeout(timerId);
            this.dwellTimers.delete(geofenceId);
        }
    }
    notifyListeners(event) {
        this.listeners.forEach((listener) => {
            try {
                listener(event);
            }
            catch (err) {
                console.error("[GEOFENCE_LISTENER_ERROR] Listener error:", err);
            }
        });
    }
}
//# sourceMappingURL=geofence.contracts.js.map