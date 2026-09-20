/**
 * Global TypeScript type definitions for GeoSphere Platform.
 * This file is included via tsconfig.json include array.
 */

// API response wrapper types
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

// Generic async task result
export type AsyncResult<T, E = Error> =
  { ok: true; value: T } | { ok: false; error: E };
