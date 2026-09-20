/**
 * GIS Map SDK — Viewport Spatial Data Loader
 *
 * Business-agnostic viewport spatial data loader for OpenLayers & Map SDK layers.
 * Listens to viewport bounds changes, debounces requests, and cancels rapidly
 * moving viewport requests using AbortController.
 */

export interface ViewportBounds {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

export interface ViewportLoaderOptions {
  apiEndpoint?: string;
  debounceMs?: number;
  authToken?: string;
  type?: string;
  onDataLoaded?: (geoJson: Record<string, unknown>) => void;
  onError?: (error: Error) => void;
}

export class ViewportSpatialLoader {
  private apiEndpoint: string;
  private debounceMs: number;
  private authToken?: string;
  private type?: string;
  private onDataLoaded?: (geoJson: Record<string, unknown>) => void;
  private onError?: (error: Error) => void;

  private currentAbortController: AbortController | null = null;
  private debounceTimer: NodeJS.Timeout | null = null;
  private lastBBoxKey: string = "";

  constructor(options: ViewportLoaderOptions = {}) {
    this.apiEndpoint = options.apiEndpoint ?? "/api/v1/spatial/search/bbox";
    this.debounceMs = options.debounceMs ?? 300;
    this.authToken = options.authToken;
    this.type = options.type;
    this.onDataLoaded = options.onDataLoaded;
    this.onError = options.onError;
  }

  public setAuthToken(token: string): void {
    this.authToken = token;
  }

  public setFeatureType(type?: string): void {
    this.type = type;
  }

  /**
   * Called whenever map extent/viewport changes
   */
  public onViewportChanged(bounds: ViewportBounds): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.fetchViewportData(bounds);
    }, this.debounceMs);
  }

  /**
   * Immediately fetches spatial features within the bounding box
   */
  public async fetchViewportData(
    bounds: ViewportBounds,
  ): Promise<Record<string, unknown> | null> {
    const roundedMinLng = Math.round(bounds.minLng * 10000) / 10000;
    const roundedMinLat = Math.round(bounds.minLat * 10000) / 10000;
    const roundedMaxLng = Math.round(bounds.maxLng * 10000) / 10000;
    const roundedMaxLat = Math.round(bounds.maxLat * 10000) / 10000;

    const bboxKey = `${roundedMinLng},${roundedMinLat},${roundedMaxLng},${roundedMaxLat}:${this.type ?? ""}`;
    if (bboxKey === this.lastBBoxKey) {
      return null; // Skip duplicate fetch
    }

    // Cancel previous inflight viewport request
    if (this.currentAbortController) {
      this.currentAbortController.abort();
    }

    this.currentAbortController = new AbortController();
    const signal = this.currentAbortController.signal;

    try {
      const url = new URL(
        this.apiEndpoint,
        typeof window !== "undefined"
          ? window.location.origin
          : "http://localhost:3500",
      );
      url.searchParams.set("minLongitude", roundedMinLng.toString());
      url.searchParams.set("minLatitude", roundedMinLat.toString());
      url.searchParams.set("maxLongitude", roundedMaxLng.toString());
      url.searchParams.set("maxLatitude", roundedMaxLat.toString());
      if (this.type) {
        url.searchParams.set("type", this.type);
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (this.authToken) {
        headers["Authorization"] = `Bearer ${this.authToken}`;
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        headers,
        signal,
      });

      if (!response.ok) {
        throw new Error(
          `Spatial API error ${response.status}: ${response.statusText}`,
        );
      }

      const data = await response.json();
      this.lastBBoxKey = bboxKey;

      const payload = data.data ?? data;
      if (this.onDataLoaded) {
        this.onDataLoaded(payload);
      }

      return payload;
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return null; // Ignore aborted requests silently
      }

      const error =
        err instanceof Error ? err : new Error("Unknown viewport load failure");
      if (this.onError) {
        this.onError(error);
      }
      return null;
    } finally {
      if (this.currentAbortController?.signal === signal) {
        this.currentAbortController = null;
      }
    }
  }

  public destroy(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    if (this.currentAbortController) {
      this.currentAbortController.abort();
    }
  }
}
