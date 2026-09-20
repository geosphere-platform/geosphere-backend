/**
 * GeoSphere Core Geofencing Engine — Domain Entrypoint
 *
 * Framework-independent Geofencing Engine providing Circle & Polygon spatial evaluation,
 * transition events (ENTER, EXIT, DWELL_START, DWELL_END), repository abstractions,
 * GeofenceEvaluator, and live GeofencingEngine.
 */

export * from "./types/geofence.types";
export * from "./repository/geofence-repository.interface";
export * from "./evaluator/geofence-evaluator";
export * from "./engine/geofence-engine";
