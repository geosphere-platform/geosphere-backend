/**
 * GIS Map SDK — Map Options & Configuration
 */

import { MapOptions } from "../types";

export const DEFAULT_MAP_OPTIONS: Required<MapOptions> = {
  center: [73.8567, 18.5204], // Pune default
  zoom: 12,
  minZoom: 2,
  maxZoom: 19,
  projection: "EPSG:4326",
  baseTile: "osm",
  controls: {
    zoom: true,
    fullscreen: true,
    scale: true,
    attribution: true,
  },
};

export function createMapOptions(options?: Partial<MapOptions>): MapOptions {
  return {
    ...DEFAULT_MAP_OPTIONS,
    ...options,
    controls: {
      ...DEFAULT_MAP_OPTIONS.controls,
      ...options?.controls,
    },
  };
}
