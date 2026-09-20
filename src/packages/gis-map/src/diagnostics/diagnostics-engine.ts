/**
 * GeoSphere Maps SDK — Diagnostics, Health Check & Telemetry Engine
 *
 * Tracks FPS, render latency, tile errors, and SDK health status.
 */

import { MapEventEmitter } from "../events/event-emitter";

export interface DiagnosticsMetrics {
  fps: number;
  renderLatencyMs: number;
  tileErrorCount: number;
  activeLayerCount: number;
  activeFeatureCount: number;
  memoryUsageMb?: number;
}

export class MapDiagnosticsEngine {
  private emitter: MapEventEmitter;
  private metrics: DiagnosticsMetrics;
  private frameTimes: number[] = [];
  private lastFrameTimestamp: number = 0;

  constructor(emitter: MapEventEmitter) {
    this.emitter = emitter;
    this.metrics = {
      fps: 60,
      renderLatencyMs: 0,
      tileErrorCount: 0,
      activeLayerCount: 0,
      activeFeatureCount: 0,
    };
  }

  public recordFrame(): void {
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (this.lastFrameTimestamp > 0) {
      const delta = now - this.lastFrameTimestamp;
      this.metrics.renderLatencyMs = delta;
      this.frameTimes.push(delta);
      if (this.frameTimes.length > 60) this.frameTimes.shift();

      const avgDelta = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
      this.metrics.fps = Math.round(1000 / (avgDelta || 16.6));
    }
    this.lastFrameTimestamp = now;
  }

  public recordTileError(layerId: string, error: unknown): void {
    this.metrics.tileErrorCount++;
    this.emitter.emit("onError", {
      code: "TILE_LOAD_ERROR",
      message: `Failed to load tile for layer '${layerId}'`,
      details: error,
    });
  }

  public updateCounts(layerCount: number, featureCount: number): void {
    this.metrics.activeLayerCount = layerCount;
    this.metrics.activeFeatureCount = featureCount;
  }

  public getMetrics(): DiagnosticsMetrics {
    return { ...this.metrics };
  }
}
