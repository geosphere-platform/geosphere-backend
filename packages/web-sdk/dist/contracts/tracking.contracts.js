/**
 * GeoSphere Tracking SDK Core Contracts & Multi-Platform Domain Models
 * Framework-Neutral Tracking Session & Telemetry Management
 * Consumes GeoSphere Location SDK from Step 10 (Zero Duplicate Location Acquisition)
 */
import { GeoSphereLocationSDK } from "./location.contracts.js";
export class GeoSphereDistanceCalculator {
    /**
     * Computes Haversine great-circle distance between two geographic coordinates in meters.
     */
    static haversineMeters(lat1, lon1, lat2, lon2) {
        const R = 6371000; // Earth radius in meters
        const rad = Math.PI / 180;
        const dLat = (lat2 - lat1) * rad;
        const dLon = (lon2 - lon1) * rad;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c * 100) / 100;
    }
}
export function classifyTrackingQuality(points) {
    if (!points || points.length === 0)
        return "UNKNOWN";
    const validAccuracies = points
        .map((p) => p.location.accuracy)
        .filter((acc) => typeof acc === "number" && !isNaN(acc));
    if (validAccuracies.length === 0)
        return "FAIR";
    const avgAcc = validAccuracies.reduce((a, b) => a + b, 0) / validAccuracies.length;
    if (avgAcc <= 8)
        return "EXCELLENT";
    if (avgAcc <= 20)
        return "GOOD";
    if (avgAcc <= 50)
        return "FAIR";
    return "POOR";
}
export class GeoSphereTrackingSDK {
    config;
    locationSdk;
    session = null;
    points = [];
    telemetryProvider;
    pauseStartTime = null;
    listeners = new Map();
    locationSubId = null;
    constructor(config = {}, locationSdk) {
        this.config = config;
        // Consumes Location SDK from Step 10 (Zero Duplicate Location Acquisition)
        this.locationSdk = locationSdk || new GeoSphereLocationSDK(config.locationConfig);
    }
    async initialize(telemetryProvider) {
        if (telemetryProvider) {
            this.telemetryProvider = telemetryProvider;
        }
        await this.locationSdk.initialize();
    }
    getLocationSDK() {
        return this.locationSdk;
    }
    getState() {
        return this.session ? this.session.state : "IDLE";
    }
    getSession() {
        return this.session;
    }
    getPoints() {
        return [...this.points];
    }
    getCapabilities() {
        return ["CURRENT_LOCATION", "CONTINUOUS_LOCATION", "PAUSE_RESUME", "DISTANCE_CALCULATION", "TELEMETRY"];
    }
    hasCapability(capability) {
        return this.getCapabilities().includes(capability);
    }
    async start(entityId, entityType = "asset", metadata = {}) {
        if (this.session && (this.session.state === "RUNNING" || this.session.state === "PAUSED")) {
            throw new Error(`[TRACKING_ERROR:INVALID_STATE] Cannot start session. Active session already exists in state ${this.session.state}.`);
        }
        const sessionId = `trk_sess_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const nowIso = new Date().toISOString();
        this.session = {
            sessionId,
            entityId,
            entityType,
            state: "STARTING",
            startTime: nowIso,
            endTime: null,
            activeDurationMs: 0,
            pausedDurationMs: 0,
            pointCount: 0,
            distanceMeters: 0,
            quality: "UNKNOWN",
            metadata
        };
        this.points = [];
        this.session.state = "RUNNING";
        // Subscribe to Location SDK stream
        const sub = this.locationSdk.subscribe((location) => {
            this.handleLocationUpdate(location);
        });
        this.locationSubId = sub.id;
        this.locationSdk.startUpdates(this.config.locationConfig);
        this.notifyListeners();
        return this.session;
    }
    pause() {
        if (!this.session || this.session.state !== "RUNNING") {
            throw new Error(`[TRACKING_ERROR:INVALID_STATE] Cannot pause session unless state is RUNNING.`);
        }
        this.session.state = "PAUSED";
        this.pauseStartTime = Date.now();
        this.notifyListeners();
    }
    resume() {
        if (!this.session || this.session.state !== "PAUSED") {
            throw new Error(`[TRACKING_ERROR:INVALID_STATE] Cannot resume session unless state is PAUSED.`);
        }
        if (this.pauseStartTime) {
            this.session.pausedDurationMs += Date.now() - this.pauseStartTime;
            this.pauseStartTime = null;
        }
        this.session.state = "RUNNING";
        this.notifyListeners();
    }
    stop() {
        if (!this.session || this.session.state === "STOPPED" || this.session.state === "IDLE") {
            if (this.session)
                return this.session;
            throw new Error(`[TRACKING_ERROR:INVALID_STATE] No active tracking session to stop.`);
        }
        if (this.session.state === "PAUSED" && this.pauseStartTime) {
            this.session.pausedDurationMs += Date.now() - this.pauseStartTime;
            this.pauseStartTime = null;
        }
        this.session.state = "STOPPING";
        this.locationSdk.stopUpdates();
        this.session.endTime = new Date().toISOString();
        this.session.state = "STOPPED";
        this.session.quality = classifyTrackingQuality(this.points);
        if (this.telemetryProvider && this.session) {
            this.telemetryProvider.sendTrackingSession(this.session).catch(() => { });
        }
        this.notifyListeners();
        return this.session;
    }
    getStatistics() {
        const totalDist = this.session ? this.session.distanceMeters : 0;
        const activeDur = this.session ? this.calculateActiveDuration() : 0;
        const pausedDur = this.session ? this.session.pausedDurationMs : 0;
        const validAccuracies = this.points
            .map((p) => p.location.accuracy)
            .filter((a) => typeof a === "number" && !isNaN(a));
        const avgAcc = validAccuracies.length > 0 ? validAccuracies.reduce((a, b) => a + b, 0) / validAccuracies.length : null;
        const lastPoint = this.points.length > 0 ? this.points[this.points.length - 1] : null;
        const firstPoint = this.points.length > 0 ? this.points[0] : null;
        const latestSpeedMetersSec = lastPoint?.location.speed ?? lastPoint?.speedCalculated ?? null;
        const latestSpeedKmh = latestSpeedMetersSec !== null ? Math.round(latestSpeedMetersSec * 3.6 * 10) / 10 : null;
        return {
            totalDistanceMeters: totalDist,
            totalDistanceKm: Math.round((totalDist / 1000) * 100) / 100,
            activeDurationMs: activeDur,
            pausedDurationMs: pausedDur,
            pointCount: this.points.length,
            avgAccuracyMeters: avgAcc ? Math.round(avgAcc * 10) / 10 : null,
            latestSpeedKmh,
            firstPointTime: firstPoint?.location.timestamp ?? null,
            latestPointTime: lastPoint?.location.timestamp ?? null
        };
    }
    subscribe(onTrackingUpdate) {
        const subId = `trk_sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        this.listeners.set(subId, onTrackingUpdate);
        if (this.session) {
            onTrackingUpdate(this.session, this.points[this.points.length - 1]);
        }
        return {
            id: subId,
            unsubscribe: () => {
                this.listeners.delete(subId);
            }
        };
    }
    destroy() {
        if (this.session && this.session.state !== "STOPPED") {
            this.stop();
        }
        this.listeners.clear();
        this.points = [];
        this.session = null;
        this.locationSdk.destroy();
    }
    handleLocationUpdate(location) {
        if (!this.session || this.session.state !== "RUNNING")
            return;
        // Accuracy Threshold Filter
        if (this.config.maxAccuracyThresholdMeters && location.accuracy && location.accuracy > this.config.maxAccuracyThresholdMeters) {
            return;
        }
        const prevPoint = this.points.length > 0 ? this.points[this.points.length - 1] : null;
        let distDeltaMeters = 0;
        let timeDeltaMs = 0;
        let speedCalc = null;
        if (prevPoint) {
            distDeltaMeters = GeoSphereDistanceCalculator.haversineMeters(prevPoint.location.latitude, prevPoint.location.longitude, location.latitude, location.longitude);
            // Minimum Distance Filter
            if (this.config.minDistanceMeters && distDeltaMeters < this.config.minDistanceMeters) {
                return;
            }
            timeDeltaMs = new Date(location.timestamp).getTime() - new Date(prevPoint.location.timestamp).getTime();
            if (timeDeltaMs > 0) {
                speedCalc = Math.round((distDeltaMeters / (timeDeltaMs / 1000)) * 100) / 100;
            }
        }
        const newPoint = {
            sequence: this.points.length + 1,
            location,
            distanceFromPreviousMeters: distDeltaMeters,
            timeFromPreviousMs: timeDeltaMs,
            speedCalculated: speedCalc
        };
        this.points.push(newPoint);
        this.session.pointCount = this.points.length;
        this.session.distanceMeters += distDeltaMeters;
        this.session.activeDurationMs = this.calculateActiveDuration();
        this.session.quality = classifyTrackingQuality(this.points);
        if (this.telemetryProvider) {
            this.telemetryProvider.sendTrackingPoint(newPoint, this.session).catch(() => { });
        }
        this.notifyListeners(newPoint);
    }
    calculateActiveDuration() {
        if (!this.session)
            return 0;
        const start = new Date(this.session.startTime).getTime();
        const now = this.session.endTime ? new Date(this.session.endTime).getTime() : Date.now();
        return Math.max(0, now - start - this.session.pausedDurationMs);
    }
    notifyListeners(latestPoint) {
        if (!this.session)
            return;
        this.listeners.forEach((listener) => {
            try {
                listener(this.session, latestPoint);
            }
            catch (err) {
                console.error("[TRACKING_LISTENER_ERROR] Listener error:", err);
            }
        });
    }
}
//# sourceMappingURL=tracking.contracts.js.map