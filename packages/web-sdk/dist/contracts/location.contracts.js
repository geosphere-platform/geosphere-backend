/**
 * GeoSphere Location SDK Core Contracts & Multi-Platform Domain Models
 * Framework-Neutral & Privacy Decoupled (Acquisition ONLY — Zero Automatic Telemetry Upload)
 */
export function validateGeoSphereLocation(location) {
    if (!location || typeof location !== "object") {
        throw new Error("[LOCATION_ERROR:INVALID_LOCATION] Location data must be a valid object.");
    }
    const loc = location;
    if (typeof loc.latitude !== "number" || isNaN(loc.latitude) || loc.latitude < -90 || loc.latitude > 90) {
        throw new Error("[LOCATION_ERROR:INVALID_LOCATION] Invalid latitude. Must be between -90 and 90.");
    }
    if (typeof loc.longitude !== "number" || isNaN(loc.longitude) || loc.longitude < -180 || loc.longitude > 180) {
        throw new Error("[LOCATION_ERROR:INVALID_LOCATION] Invalid longitude. Must be between -180 and 180.");
    }
    return {
        latitude: loc.latitude,
        longitude: loc.longitude,
        accuracy: loc.accuracy ?? null,
        altitude: loc.altitude ?? null,
        altitudeAccuracy: loc.altitudeAccuracy ?? null,
        heading: loc.heading ?? null,
        speed: loc.speed ?? null,
        timestamp: loc.timestamp || new Date().toISOString(),
        source: loc.source || "client-gps",
        isMocked: loc.isMocked ?? false,
        metadata: loc.metadata || {}
    };
}
export function classifyLocationAccuracy(accuracyMeters) {
    if (accuracyMeters === undefined || accuracyMeters === null || isNaN(accuracyMeters))
        return "UNKNOWN";
    if (accuracyMeters <= 5)
        return "VERY_HIGH";
    if (accuracyMeters <= 15)
        return "HIGH";
    if (accuracyMeters <= 50)
        return "MEDIUM";
    return "LOW";
}
export function isLocationStale(location, maxAgeMs = 60000) {
    const locTime = new Date(location.timestamp).getTime();
    if (isNaN(locTime))
        return true;
    return Date.now() - locTime > maxAgeMs;
}
export class GeoSphereLocationSDK {
    config;
    currentState = "INITIALIZING";
    permissionState = "NOT_REQUESTED";
    serviceState = "ENABLED";
    currentLocation = null;
    adapter;
    listeners = new Map();
    updateActive = false;
    constructor(config = {}) {
        this.config = config;
    }
    async initialize(adapter) {
        this.currentState = "INITIALIZING";
        if (adapter) {
            this.adapter = adapter;
            await this.adapter.initialize();
            this.permissionState = await this.adapter.getPermissionState();
            this.serviceState = await this.adapter.getServiceState();
        }
        else {
            this.permissionState = "GRANTED";
            this.serviceState = "ENABLED";
        }
        if (this.serviceState === "DISABLED") {
            this.currentState = "SERVICE_DISABLED";
        }
        else if (this.permissionState === "DENIED" || this.permissionState === "PERMANENTLY_DENIED") {
            this.currentState = "PERMISSION_DENIED";
        }
        else {
            this.currentState = "READY";
        }
    }
    getState() {
        return this.currentState;
    }
    getPermissionState() {
        return this.permissionState;
    }
    getServiceState() {
        return this.serviceState;
    }
    getCapabilities() {
        if (this.adapter) {
            return this.adapter.getCapabilities();
        }
        return ["CURRENT_LOCATION", "CONTINUOUS_UPDATES", "HIGH_ACCURACY", "HEADING", "SPEED", "ALTITUDE"];
    }
    hasCapability(capability) {
        return this.getCapabilities().includes(capability);
    }
    async getCurrentLocation(options) {
        if (this.currentState === "SERVICE_DISABLED") {
            throw new Error("[LOCATION_ERROR:LOCATION_DISABLED] Device location service is disabled.");
        }
        if (this.currentState === "PERMISSION_DENIED") {
            throw new Error("[LOCATION_ERROR:PERMISSION_DENIED] Location permission was denied.");
        }
        this.currentState = "ACQUIRING";
        const effectiveConfig = { ...this.config, ...options };
        if (this.adapter) {
            const raw = await this.adapter.getCurrentLocation(effectiveConfig);
            this.currentLocation = validateGeoSphereLocation(raw);
        }
        else {
            // Mock/Contract location acquisition
            this.currentLocation = validateGeoSphereLocation({
                latitude: 37.7749,
                longitude: -122.4194,
                accuracy: 10,
                altitude: 15,
                heading: 180,
                speed: 5.5,
                timestamp: new Date().toISOString(),
                source: "simulated-gps"
            });
        }
        this.currentState = "AVAILABLE";
        return this.currentLocation;
    }
    startUpdates(options) {
        if (this.updateActive)
            return;
        this.updateActive = true;
        this.currentState = "ACQUIRING";
        const effectiveConfig = { ...this.config, ...options };
        if (this.adapter) {
            this.adapter.startUpdates(effectiveConfig, (location) => {
                const validated = validateGeoSphereLocation(location);
                this.currentLocation = validated;
                this.currentState = "AVAILABLE";
                this.notifyListeners(validated);
            }, (err) => {
                this.currentState = "ERROR";
            });
        }
        else {
            // Simulated continuous stream
            const validated = validateGeoSphereLocation({
                latitude: 37.7749,
                longitude: -122.4194,
                accuracy: 8,
                timestamp: new Date().toISOString(),
                source: "simulated-gps"
            });
            this.currentLocation = validated;
            this.currentState = "AVAILABLE";
            this.notifyListeners(validated);
        }
    }
    stopUpdates() {
        this.updateActive = false;
        if (this.adapter) {
            this.adapter.stopUpdates();
        }
        this.currentState = "STOPPED";
    }
    subscribe(onLocationUpdate) {
        const subId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        this.listeners.set(subId, onLocationUpdate);
        if (this.currentLocation) {
            onLocationUpdate(this.currentLocation);
        }
        return {
            id: subId,
            unsubscribe: () => {
                this.listeners.delete(subId);
            }
        };
    }
    getLastKnownLocation() {
        return this.currentLocation;
    }
    destroy() {
        this.stopUpdates();
        this.listeners.clear();
        if (this.adapter) {
            this.adapter.destroy();
        }
        this.currentLocation = null;
        this.currentState = "STOPPED";
    }
    notifyListeners(location) {
        this.listeners.forEach((listener) => {
            try {
                listener(location);
            }
            catch (err) {
                console.error("[LOCATION_LISTENER_ERROR] Listener error:", err);
            }
        });
    }
}
//# sourceMappingURL=location.contracts.js.map