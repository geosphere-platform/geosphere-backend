/**
 * GIS Platform Core — Public Export Entrypoint (@gis/core)
 *
 * Re-exports spatial primitives, domain models, GeoJSON utilities, BoundingBox,
 * geometry validators, geospatial calculations, domain services, layers, event bus,
 * and the Phase 10 GIS Query & Analytics Engine.
 */

export * from "./types/geometry";
export * from "./types/geojson";
export * from "./types/entity";
export * from "./types/map";
export * from "./types/layer";
export * from "./bbox/bounding-box";
export * from "./validation/geometry-validation";
export * from "./utils/spatial-utils";
export * from "./services/gis-services";
export * from "./events/gis-events";
export * from "./operations";
export * from "./realtime";
// Phase 10 — GIS Query, Search & Spatial Analytics Engine
export * from "./query";
