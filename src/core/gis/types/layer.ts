/**
 * GIS Core — Generic Map Layer Model
 *
 * Supports Vector, Raster, Tile, Cluster, and Heatmap layer definitions.
 */

export type GISLayerType = "vector" | "raster" | "tile" | "cluster" | "heatmap";

export interface GISLayer {
  id: string;
  name: string;
  type: GISLayerType;
  visible: boolean;
  opacity: number;
  zIndex: number;
  minZoom?: number;
  maxZoom?: number;
  metadata?: Record<string, unknown>;
}

export function createGISLayer(
  params: Partial<GISLayer> & { id: string; name: string },
): GISLayer {
  return {
    id: params.id,
    name: params.name,
    type: params.type ?? "vector",
    visible: params.visible ?? true,
    opacity: params.opacity ?? 1.0,
    zIndex: params.zIndex ?? 1,
    minZoom: params.minZoom,
    maxZoom: params.maxZoom,
    metadata: params.metadata ?? {},
  };
}
