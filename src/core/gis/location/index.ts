/**
 * GeoSphere Core Location Engine — Domain Entrypoint
 *
 * Framework-independent Location Engine providing generic Location domain models,
 * quality assessment, validation, provider contracts, and normalized LocationEvent stream management.
 */

export * from "./types/location.types";
export * from "./validation/location-validator";
export * from "./provider/location-provider.interface";
export * from "./provider/mock-location-provider";
export * from "./provider/web-location-adapter";
export * from "./engine/location-engine";
