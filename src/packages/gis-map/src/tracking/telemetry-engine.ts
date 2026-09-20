/**
 * GeoSphere Maps SDK — Real-Time Location & Telemetry Tracking Engine
 *
 * Manages live subject positions, heading bearings, velocity, and breadcrumb trails.
 */

import { Coordinate, MapFeature } from "../types";

export interface TelemetryPoint {
  subjectId: string;
  coordinate: Coordinate;
  heading?: number; // degrees 0-360
  speedKmh?: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface SubjectTrack {
  subjectId: string;
  currentPoint: TelemetryPoint;
  history: TelemetryPoint[];
  maxHistoryLength: number;
}

export class TelemetryTrackingEngine {
  private tracks: Map<string, SubjectTrack> = new Map();
  private maxHistoryPerSubject: number;

  constructor(maxHistoryPerSubject: number = 50) {
    this.maxHistoryPerSubject = maxHistoryPerSubject;
  }

  /**
   * Update or ingest a live telemetry point for a subject.
   */
  public updateSubjectLocation(point: TelemetryPoint): SubjectTrack {
    let track = this.tracks.get(point.subjectId);

    if (!track) {
      track = {
        subjectId: point.subjectId,
        currentPoint: point,
        history: [point],
        maxHistoryLength: this.maxHistoryPerSubject,
      };
      this.tracks.set(point.subjectId, track);
    } else {
      track.currentPoint = point;
      track.history.push(point);
      if (track.history.length > track.maxHistoryLength) {
        track.history.shift();
      }
    }

    return track;
  }

  public getTrack(subjectId: string): SubjectTrack | undefined {
    return this.tracks.get(subjectId);
  }

  public getAllTracks(): SubjectTrack[] {
    return Array.from(this.tracks.values());
  }

  /**
   * Generate breadcrumb Polyline MapFeature for a subject's history track.
   */
  public getBreadcrumbFeature(subjectId: string): MapFeature | null {
    const track = this.tracks.get(subjectId);
    if (!track || track.history.length < 2) return null;

    const coords = track.history.map((p) => p.coordinate);
    return {
      id: `trail-${subjectId}`,
      geometry: {
        type: "LineString",
        coordinates: coords,
      },
      properties: {
        subjectId,
        pointCount: coords.length,
      },
      style: {
        strokeColor: "#3b82f6",
        strokeWidth: 4,
        strokeDashArray: [6, 6],
      },
    };
  }

  public clearTrack(subjectId: string): void {
    this.tracks.delete(subjectId);
  }

  public clearAllTracks(): void {
    this.tracks.clear();
  }
}
