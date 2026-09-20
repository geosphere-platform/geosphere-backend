/**
 * Generic Geospatial Operations Engine — Centralized Operational & Safety Limits
 */

export const SPATIAL_OPERATION_LIMITS = {
  /** Maximum allowed buffer distance in meters (100 km) */
  MAX_BUFFER_DISTANCE_METERS: 100_000,

  /** Maximum nearest neighbor features returned in single query */
  MAX_NEAREST_LIMIT: 100,

  /** Maximum radius search distance in meters (500 km) */
  MAX_RADIUS_METERS: 500_000,

  /** Maximum number of geometries that can be merged in single union operation */
  MAX_UNION_GEOMETRIES: 50,

  /** Maximum coordinate points allowed in input geometry payload */
  MAX_GEOMETRY_POINTS: 10_000,

  /** Maximum candidate geofences evaluated in single spatial join/point check */
  MAX_GEOFENCE_CANDIDATES: 1_000,

  /** Maximum page limit for pagination */
  MAX_PAGE_LIMIT: 500,

  /** Default page limit for pagination */
  DEFAULT_PAGE_LIMIT: 50,
} as const;

export type SpatialOperationLimits = typeof SPATIAL_OPERATION_LIMITS;
