/**
 * GeoSphere Core Routing Engine — Domain Entrypoint
 *
 * Framework-independent Routing & Spatial Network Engine providing route calculation,
 * provider abstractions, OSRMRoutingAdapter, MockRoutingProvider, and RoutingEngine.
 */

export * from "./types/routing.types";
export * from "./provider/routing-provider.interface";
export * from "./adapters/osrm-routing-adapter";
export * from "./engine/routing-engine";
