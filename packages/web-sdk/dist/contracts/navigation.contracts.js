/**
 * GeoSphere Navigation SDK Core Contracts & Multi-Platform Domain Models
 * Framework-Neutral Navigation Session & Route Progress Engine
 * Consumes GeoSphere Routing SDK (Step 13) & Location SDK (Step 10)
 */
import { GeoSphereLocationSDK } from "./location.contracts.js";
import { GeoSphereRoutingSDK } from "./routing.contracts.js";
import { GeoSphereDistanceCalculator } from "./tracking.contracts.js";
export class GeoSphereNavigationSDK {
    config;
    activeSession = null;
    listeners = new Map();
    locationSdk;
    routingSdk;
    lastRerouteTimeMs = 0;
    locationSubId = null;
    constructor(config = {}, routingSdk, locationSdk) {
        this.config = config;
        this.routingSdk = routingSdk || new GeoSphereRoutingSDK();
        this.locationSdk = locationSdk || new GeoSphereLocationSDK();
        // Default configuration thresholds
        this.config.offRouteThresholdMeters = this.config.offRouteThresholdMeters ?? 50;
        this.config.arrivalThresholdMeters = this.config.arrivalThresholdMeters ?? 30;
        this.config.maneuverThresholdMeters = this.config.maneuverThresholdMeters ?? 25;
        this.config.rerouteMinimumIntervalMs = this.config.rerouteMinimumIntervalMs ?? 5000;
        this.config.autoReroute = this.config.autoReroute ?? true;
        this.config.mapFollowMode = this.config.mapFollowMode ?? "NAVIGATION";
    }
    async initialize(routingSdk, locationSdk) {
        if (routingSdk)
            this.routingSdk = routingSdk;
        if (locationSdk)
            this.locationSdk = locationSdk;
        await this.routingSdk.initialize();
        await this.locationSdk.initialize();
        // Auto-consume incoming location updates
        const sub = this.locationSdk.subscribe((location) => {
            this.updateLocation(location);
        });
        this.locationSubId = sub.id;
    }
    getCapabilities() {
        return [
            "NAVIGATION_SESSION",
            "ROUTE_FOLLOWING",
            "MANEUVER_DETECTION",
            "PROGRESS_TRACKING",
            "OFF_ROUTE_DETECTION",
            "AUTO_REROUTING",
            "ARRIVED_DETECTION"
        ];
    }
    hasCapability(capability) {
        return this.getCapabilities().includes(capability);
    }
    startNavigation(route) {
        if (!route || !route.summary || !route.legs || route.legs.length === 0) {
            throw new Error("[NAVIGATION_ERROR:INVALID_ROUTE] Cannot start navigation session with an invalid route.");
        }
        if (this.activeSession && this.activeSession.state === "ACTIVE") {
            throw new Error("[NAVIGATION_ERROR:INVALID_STATE] Cannot start a new navigation session while another is ACTIVE.");
        }
        const sessionId = `nav_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const nowIso = new Date().toISOString();
        const initialProgress = {
            distanceTraveledMeters: 0,
            distanceRemainingMeters: route.summary.totalDistanceMeters,
            durationElapsedSeconds: 0,
            durationRemainingSeconds: route.summary.totalDurationSeconds,
            percentageComplete: 0,
            currentLegIndex: 0,
            currentStepIndex: 0,
            etaIso: new Date(Date.now() + route.summary.totalDurationSeconds * 1000).toISOString()
        };
        const firstLeg = route.legs[0];
        const firstStep = firstLeg.steps[0];
        const secondStep = firstLeg.steps[1] || null;
        const currentManeuver = firstStep
            ? {
                type: firstStep.maneuver?.type?.toUpperCase() || "STRAIGHT",
                instruction: firstStep.instruction,
                distanceToManeuverMeters: firstStep.distanceMeters,
                durationToManeuverSeconds: firstStep.durationSeconds,
                coordinate: firstStep.startCoordinate
            }
            : null;
        const nextManeuver = secondStep
            ? {
                type: secondStep.maneuver?.type?.toUpperCase() || "STRAIGHT",
                instruction: secondStep.instruction,
                distanceToManeuverMeters: secondStep.distanceMeters,
                durationToManeuverSeconds: secondStep.durationSeconds,
                coordinate: secondStep.startCoordinate
            }
            : null;
        this.activeSession = {
            id: sessionId,
            route,
            state: "ACTIVE",
            offRouteState: "ON_ROUTE",
            progress: initialProgress,
            currentManeuver,
            nextManeuver,
            currentLocation: null,
            startTime: nowIso
        };
        this.notifyListeners("navigation.started", { session: this.activeSession });
        return this.activeSession;
    }
    pauseNavigation() {
        if (!this.activeSession || this.activeSession.state !== "ACTIVE") {
            throw new Error("[NAVIGATION_ERROR:INVALID_STATE] Cannot pause navigation when session is not ACTIVE.");
        }
        this.activeSession.state = "PAUSED";
        this.notifyListeners("navigation.paused", { session: this.activeSession });
    }
    resumeNavigation() {
        if (!this.activeSession || this.activeSession.state !== "PAUSED") {
            throw new Error("[NAVIGATION_ERROR:INVALID_STATE] Cannot resume navigation when session is not PAUSED.");
        }
        this.activeSession.state = "ACTIVE";
        this.notifyListeners("navigation.resumed", { session: this.activeSession });
    }
    stopNavigation() {
        if (!this.activeSession)
            return;
        this.activeSession.state = "CANCELLED";
        this.activeSession.endTime = new Date().toISOString();
        this.notifyListeners("navigation.cancelled", { session: this.activeSession });
        this.activeSession = null;
    }
    getActiveSession() {
        return this.activeSession;
    }
    setMapFollowMode(mode) {
        this.config.mapFollowMode = mode;
    }
    getMapFollowMode() {
        return this.config.mapFollowMode || "NAVIGATION";
    }
    updateLocation(location) {
        if (!this.activeSession || this.activeSession.state !== "ACTIVE")
            return;
        this.activeSession.currentLocation = location;
        this.notifyListeners("navigation.positionUpdated", { location });
        const route = this.activeSession.route;
        const destCoord = route.waypoints[route.waypoints.length - 1].coordinate;
        // 1. Arrival Check
        const distToDestination = GeoSphereDistanceCalculator.haversineMeters(location.latitude, location.longitude, destCoord[1], destCoord[0]);
        if (distToDestination <= (this.config.arrivalThresholdMeters || 30)) {
            this.activeSession.state = "ARRIVED";
            this.activeSession.endTime = new Date().toISOString();
            this.activeSession.progress.distanceRemainingMeters = 0;
            this.activeSession.progress.durationRemainingSeconds = 0;
            this.activeSession.progress.percentageComplete = 100;
            this.notifyListeners("navigation.arrived", { session: this.activeSession });
            return;
        }
        if (distToDestination <= 200) {
            this.notifyListeners("navigation.destinationApproaching", { distanceMeters: Math.round(distToDestination) });
        }
        // 2. Route Position & Progress Matching
        const currentLeg = route.legs[this.activeSession.progress.currentLegIndex] || route.legs[0];
        const currentStep = currentLeg.steps[this.activeSession.progress.currentStepIndex] || currentLeg.steps[0];
        const distToStepEnd = GeoSphereDistanceCalculator.haversineMeters(location.latitude, location.longitude, currentStep.endCoordinate[1], currentStep.endCoordinate[0]);
        // Maneuver Progression
        if (distToStepEnd <= (this.config.maneuverThresholdMeters || 25)) {
            if (this.activeSession.progress.currentStepIndex < currentLeg.steps.length - 1) {
                this.activeSession.progress.currentStepIndex++;
                this.updateManeuvers(currentLeg);
            }
            else if (this.activeSession.progress.currentLegIndex < route.legs.length - 1) {
                this.activeSession.progress.currentLegIndex++;
                this.activeSession.progress.currentStepIndex = 0;
                const nextLeg = route.legs[this.activeSession.progress.currentLegIndex];
                this.updateManeuvers(nextLeg);
            }
        }
        // Progress updates
        const totalDist = route.summary.totalDistanceMeters;
        const distRemaining = Math.max(0, distToDestination);
        const distTraveled = Math.max(0, totalDist - distRemaining);
        const pct = totalDist > 0 ? Math.min(100, Math.round((distTraveled / totalDist) * 100)) : 100;
        this.activeSession.progress.distanceTraveledMeters = Math.round(distTraveled);
        this.activeSession.progress.distanceRemainingMeters = Math.round(distRemaining);
        this.activeSession.progress.percentageComplete = pct;
        this.notifyListeners("navigation.progressUpdated", { progress: this.activeSession.progress });
        // 3. Off-Route Detection & Auto-Rerouting Hysteresis
        const distFromRouteSegment = GeoSphereDistanceCalculator.haversineMeters(location.latitude, location.longitude, currentStep.startCoordinate[1], currentStep.startCoordinate[0]);
        if (distFromRouteSegment > (this.config.offRouteThresholdMeters || 50) && distToStepEnd > 100) {
            if (this.activeSession.offRouteState === "ON_ROUTE") {
                this.activeSession.offRouteState = "POSSIBLY_OFF_ROUTE";
            }
            else if (this.activeSession.offRouteState === "POSSIBLY_OFF_ROUTE") {
                this.activeSession.offRouteState = "OFF_ROUTE";
                this.notifyListeners("navigation.offRoute", { distanceMeters: Math.round(distFromRouteSegment) });
                if (this.config.autoReroute) {
                    this.triggerReroute(location, destCoord);
                }
            }
        }
        else {
            this.activeSession.offRouteState = "ON_ROUTE";
        }
    }
    subscribe(onEvent) {
        const subId = `nav_sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
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
        this.activeSession = null;
    }
    updateManeuvers(leg) {
        if (!this.activeSession)
            return;
        const stepIdx = this.activeSession.progress.currentStepIndex;
        const step = leg.steps[stepIdx];
        const nextStep = leg.steps[stepIdx + 1] || null;
        if (step) {
            this.activeSession.currentManeuver = {
                type: step.maneuver?.type?.toUpperCase() || "STRAIGHT",
                instruction: step.instruction,
                distanceToManeuverMeters: step.distanceMeters,
                durationToManeuverSeconds: step.durationSeconds,
                coordinate: step.startCoordinate
            };
        }
        if (nextStep) {
            this.activeSession.nextManeuver = {
                type: nextStep.maneuver?.type?.toUpperCase() || "STRAIGHT",
                instruction: nextStep.instruction,
                distanceToManeuverMeters: nextStep.distanceMeters,
                durationToManeuverSeconds: nextStep.durationSeconds,
                coordinate: nextStep.startCoordinate
            };
        }
        else {
            this.activeSession.nextManeuver = null;
        }
        this.notifyListeners("navigation.maneuverUpdated", {
            current: this.activeSession.currentManeuver,
            next: this.activeSession.nextManeuver
        });
    }
    async triggerReroute(currentLoc, destCoord) {
        const now = Date.now();
        if (now - this.lastRerouteTimeMs < (this.config.rerouteMinimumIntervalMs || 5000))
            return;
        this.lastRerouteTimeMs = now;
        this.notifyListeners("navigation.reroutingStarted", {});
        try {
            const newResponse = await this.routingSdk.calculateRoute({
                origin: [currentLoc.longitude, currentLoc.latitude],
                destination: destCoord,
                options: { profile: this.activeSession?.route.summary.profile || "driving" }
            });
            if (this.activeSession && newResponse.primaryRoute) {
                this.activeSession.route = newResponse.primaryRoute;
                this.activeSession.offRouteState = "RECOVERING";
                this.activeSession.progress.currentLegIndex = 0;
                this.activeSession.progress.currentStepIndex = 0;
                this.updateManeuvers(newResponse.primaryRoute.legs[0]);
                this.activeSession.offRouteState = "ON_ROUTE";
                this.notifyListeners("navigation.reroutingCompleted", { route: newResponse.primaryRoute });
            }
        }
        catch (err) {
            this.notifyListeners("navigation.reroutingFailed", { error: err });
        }
    }
    notifyListeners(type, payload) {
        this.listeners.forEach((listener) => {
            try {
                listener({ type, payload });
            }
            catch (err) {
                console.error("[NAVIGATION_LISTENER_ERROR] Listener error:", err);
            }
        });
    }
}
//# sourceMappingURL=navigation.contracts.js.map