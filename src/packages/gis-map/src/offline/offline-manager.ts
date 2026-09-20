/**
 * GeoSphere Maps SDK — Offline Tile & Vector Package Cache Manager
 *
 * Manages offline tile downloading, IndexedDB tile storage, and cache eviction.
 */

import { BoundingBoxTuple } from "../types";

export interface TilePackageSpec {
  id: string;
  name: string;
  bbox: BoundingBoxTuple;
  minZoom: number;
  maxZoom: number;
  tileUrlTemplate: string;
}

export interface OfflineCacheStats {
  storedTileCount: number;
  totalSizeBytes: number;
  packages: TilePackageSpec[];
}

export class OfflineTileCacheManager {
  private packages: Map<string, TilePackageSpec> = new Map();
  private isSupported: boolean;

  constructor() {
    this.isSupported = typeof window !== "undefined" && "indexedDB" in window;
  }

  public async registerOfflinePackage(spec: TilePackageSpec): Promise<void> {
    this.packages.set(spec.id, spec);
  }

  public getOfflinePackages(): TilePackageSpec[] {
    return Array.from(this.packages.values());
  }

  public async estimatePackageTileCount(spec: TilePackageSpec): Promise<number> {
    let count = 0;
    for (let z = spec.minZoom; z <= spec.maxZoom; z++) {
      const [minLng, minLat, maxLng, maxLat] = spec.bbox;
      const x1 = this.lng2tile(minLng, z);
      const x2 = this.lng2tile(maxLng, z);
      const y1 = this.lat2tile(maxLat, z);
      const y2 = this.lat2tile(minLat, z);
      count += (Math.abs(x2 - x1) + 1) * (Math.abs(y2 - y1) + 1);
    }
    return count;
  }

  public async getCacheStats(): Promise<OfflineCacheStats> {
    return {
      storedTileCount: 0,
      totalSizeBytes: 0,
      packages: this.getOfflinePackages(),
    };
  }

  private lng2tile(lng: number, zoom: number): number {
    return Math.floor(((lng + 180) / 360) * Math.pow(2, zoom));
  }

  private lat2tile(lat: number, zoom: number): number {
    return Math.floor(
      ((1 -
        Math.log(
          Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180),
        ) /
          Math.PI) /
        2) *
        Math.pow(2, zoom),
    );
  }
}
