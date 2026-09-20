/**
 * GeoSphere Maps SDK — Temporal & Time Slider Engine
 *
 * Controls temporal feature filtering, playback state, speed multipliers, and time windowing.
 */

import { MapFeature } from "../types";

export interface TemporalConfig {
  timeProperty?: string;
  startTime: number;
  endTime: number;
  speedMultiplier?: number;
  windowMs?: number;
  loop?: boolean;
}

export type TemporalTickListener = (currentTimestampMs: number, activeFeatures: MapFeature[]) => void;

export class TemporalEngine {
  private config: Required<TemporalConfig>;
  private currentTimestampMs: number;
  private isPlaying: boolean = false;
  private animationFrameId: number | null = null;
  private lastFrameRealTimeMs: number = 0;
  private listeners: Set<TemporalTickListener> = new Set();

  constructor(config: TemporalConfig) {
    this.config = {
      timeProperty: "timestamp",
      speedMultiplier: 1,
      windowMs: 60000, // 1 minute window default
      loop: false,
      ...config,
    };
    this.currentTimestampMs = this.config.startTime;
  }

  public onTick(listener: TemporalTickListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public play(): void {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.lastFrameRealTimeMs = Date.now();
    this.tick();
  }

  public pause(): void {
    this.isPlaying = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public seek(timestampMs: number): void {
    this.currentTimestampMs = Math.max(
      this.config.startTime,
      Math.min(this.config.endTime, timestampMs),
    );
    this.notifyListeners([]);
  }

  public setSpeed(speedMultiplier: number): void {
    this.config.speedMultiplier = speedMultiplier;
  }

  public getCurrentTime(): number {
    return this.currentTimestampMs;
  }

  public isPlaybackActive(): boolean {
    return this.isPlaying;
  }

  /**
   * Filter features within the active temporal window [current - windowMs, current].
   */
  public filterFeatures(features: MapFeature[]): MapFeature[] {
    const timeProp = this.config.timeProperty;
    const windowStart = this.currentTimestampMs - this.config.windowMs;
    const windowEnd = this.currentTimestampMs;

    return features.filter((f) => {
      const tsVal = f.properties ? f.properties[timeProp] : undefined;
      if (tsVal === undefined || tsVal === null) return true;

      const timeMs = typeof tsVal === "number" ? tsVal : new Date(String(tsVal)).getTime();
      return !isNaN(timeMs) && timeMs >= windowStart && timeMs <= windowEnd;
    });
  }

  private tick(): void {
    if (!this.isPlaying) return;

    const now = Date.now();
    const deltaRealMs = now - this.lastFrameRealTimeMs;
    this.lastFrameRealTimeMs = now;

    this.currentTimestampMs += deltaRealMs * this.config.speedMultiplier;

    if (this.currentTimestampMs >= this.config.endTime) {
      if (this.config.loop) {
        this.currentTimestampMs = this.config.startTime;
      } else {
        this.currentTimestampMs = this.config.endTime;
        this.pause();
        return;
      }
    }

    this.notifyListeners([]);

    if (typeof requestAnimationFrame !== "undefined") {
      this.animationFrameId = requestAnimationFrame(() => this.tick());
    } else {
      setTimeout(() => this.tick(), 16);
    }
  }

  private notifyListeners(activeFeatures: MapFeature[]): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.currentTimestampMs, activeFeatures);
      } catch (e) {
        console.error("[TemporalEngine] Error in listener:", e);
      }
    });
  }
}
