/**
 * Framework-Independent TrackBuilder Engine
 *
 * Takes raw LocationEvents and constructs deterministic, validated Track domain objects
 * with distance calculations, segment gap detection, speed statistics, and GeoJSON LineString geometry.
 *
 * MUST NOT depend on OpenLayers, React, Next.js, or vehicle-specific tracking logic.
 */

import { LocationEvent } from "../../location/types/location.types";
import { calculateDistance } from "../../utils/spatial-utils";
import { LineStringGeometry, MultiLineStringGeometry, Coordinate } from "../../types/geometry";
import {
  Track,
  TrackPoint,
  TrackSegment,
  TrackStatistics,
  TrackSpeedStatistics,
  TrackingOptions,
} from "../types/tracking.types";

export class TrackBuilder {
  private options: Required<TrackingOptions>;

  constructor(options?: TrackingOptions) {
    this.options = {
      minDistanceThresholdMeters: 0,
      maxGapDurationSeconds: 300, // 5 minutes default gap threshold
      maxAccuracyThresholdMeters: 500, // Filter wild accuracy outliers
      deduplicationStrategy: "filter-identical-coordinates",
      speedCalculationMode: "provider-first",
      ...options,
    };
  }

  /**
   * Processes an array of LocationEvents and builds a complete Track object.
   */
  public buildTrack(
    trackId: string,
    entityId: string,
    locationEvents: LocationEvent[],
    metadata: Record<string, unknown> = {}
  ): Track {
    if (!locationEvents || locationEvents.length === 0) {
      return this.createEmptyTrack(trackId, entityId, metadata);
    }

    // 1. Sort LocationEvents deterministically by timestampMs
    const sortedEvents = [...locationEvents].sort((a, b) => a.timestampMs - b.timestampMs);

    // 2. Filter & Deduplicate events
    const processedEvents = this.filterAndDeduplicate(sortedEvents);

    if (processedEvents.length === 0) {
      return this.createEmptyTrack(trackId, entityId, metadata);
    }

    // 3. Build TrackPoints with distance and speed deltas
    const trackPoints: TrackPoint[] = [];
    let previousPoint: TrackPoint | null = null;
    let sequence = 1;

    for (const evt of processedEvents) {
      const coord: Coordinate = [evt.location.longitude, evt.location.latitude];
      let distFromPrev = 0;
      let timeFromPrevMs = 0;
      let calcSpeedMs: number | null = null;

      if (previousPoint) {
        distFromPrev = calculateDistance(previousPoint.coordinate, coord);
        timeFromPrevMs = Math.max(0, evt.timestampMs - previousPoint.timestampMs);

        // Filter min distance threshold if configured
        if (this.options.minDistanceThresholdMeters > 0 && distFromPrev < this.options.minDistanceThresholdMeters) {
          continue;
        }

        if (timeFromPrevMs > 0) {
          calcSpeedMs = distFromPrev / (timeFromPrevMs / 1000);
        }
      }

      const point: TrackPoint = {
        sequence: sequence++,
        locationEvent: evt,
        coordinate: coord,
        timestamp: evt.timestamp,
        timestampMs: evt.timestampMs,
        accuracy: evt.location.accuracy ?? null,
        altitude: evt.location.altitude ?? null,
        speedProvider: evt.location.speed ?? null,
        speedCalculated: calcSpeedMs,
        heading: evt.location.heading ?? null,
        distanceFromPreviousMeters: distFromPrev,
        timeFromPreviousMs: timeFromPrevMs,
        metadata: evt.metadata ? { ...evt.metadata } : {},
      };

      trackPoints.push(point);
      previousPoint = point;
    }

    if (trackPoints.length === 0) {
      return this.createEmptyTrack(trackId, entityId, metadata);
    }

    // 4. Segment Track points based on maxGapDurationSeconds
    const segments = this.segmentTrackPoints(trackPoints);

    // 5. Generate GeoJSON LineString / MultiLineString Geometry
    const geometry = this.createTrackGeometry(segments);

    // 6. Compute Track Statistics
    const statistics = this.computeTrackStatistics(trackPoints, segments);

    const startTime = trackPoints[0].timestamp;
    const endTime = trackPoints[trackPoints.length - 1].timestamp;
    const entityType = trackPoints[0].locationEvent.entityType || "generic-asset";

    return {
      id: trackId,
      entityId,
      entityType,
      startTime,
      endTime,
      points: trackPoints,
      segments,
      geometry,
      statistics,
      status: "completed",
      metadata: { ...metadata },
    };
  }

  private filterAndDeduplicate(events: LocationEvent[]): LocationEvent[] {
    const results: LocationEvent[] = [];
    let lastEvt: LocationEvent | null = null;

    for (const evt of events) {
      // Accuracy filter
      if (
        evt.location.accuracy !== undefined &&
        evt.location.accuracy !== null &&
        evt.location.accuracy > this.options.maxAccuracyThresholdMeters
      ) {
        continue;
      }

      if (lastEvt) {
        // Deduplication strategies
        if (
          this.options.deduplicationStrategy === "filter-identical-coordinates" &&
          lastEvt.location.latitude === evt.location.latitude &&
          lastEvt.location.longitude === evt.location.longitude &&
          lastEvt.timestampMs === evt.timestampMs
        ) {
          continue;
        }

        if (
          this.options.deduplicationStrategy === "filter-stale-timestamps" &&
          evt.timestampMs <= lastEvt.timestampMs
        ) {
          continue;
        }
      }

      results.push(evt);
      lastEvt = evt;
    }

    return results;
  }

  private segmentTrackPoints(points: TrackPoint[]): TrackSegment[] {
    const segments: TrackSegment[] = [];
    if (points.length === 0) return segments;

    let currentSegmentPoints: TrackPoint[] = [points[0]];
    let segmentIndex = 1;
    const maxGapMs = this.options.maxGapDurationSeconds * 1000;

    for (let i = 1; i < points.length; i++) {
      const pt = points[i];
      if (pt.timeFromPreviousMs > maxGapMs) {
        // Finalize current segment and start a new segment
        segments.push(this.createSegment(segmentIndex++, currentSegmentPoints));
        currentSegmentPoints = [pt];
      } else {
        currentSegmentPoints.push(pt);
      }
    }

    if (currentSegmentPoints.length > 0) {
      segments.push(this.createSegment(segmentIndex++, currentSegmentPoints));
    }

    return segments;
  }

  private createSegment(segmentIndex: number, points: TrackPoint[]): TrackSegment {
    const startTime = points[0].timestamp;
    const endTime = points[points.length - 1].timestamp;
    const durationMs = Math.max(0, points[points.length - 1].timestampMs - points[0].timestampMs);

    let distanceMeters = 0;
    for (const pt of points) {
      distanceMeters += pt.distanceFromPreviousMeters;
    }

    let geometry: LineStringGeometry | null = null;
    if (points.length >= 2) {
      geometry = {
        type: "LineString",
        coordinates: points.map((p) => p.coordinate),
      };
    }

    return {
      segmentIndex,
      startTime,
      endTime,
      durationMs,
      distanceMeters,
      pointCount: points.length,
      points,
      geometry,
    };
  }

  private createTrackGeometry(
    segments: TrackSegment[]
  ): LineStringGeometry | MultiLineStringGeometry | null {
    const validLineStrings = segments
      .map((s) => s.geometry)
      .filter((g): g is LineStringGeometry => g !== null);

    if (validLineStrings.length === 0) return null;
    if (validLineStrings.length === 1) return validLineStrings[0];

    return {
      type: "MultiLineString",
      coordinates: validLineStrings.map((ls) => ls.coordinates),
    };
  }

  private computeTrackStatistics(points: TrackPoint[], segments: TrackSegment[]): TrackStatistics {
    let totalDistanceMeters = 0;
    for (const pt of points) {
      totalDistanceMeters += pt.distanceFromPreviousMeters;
    }

    const firstObs = points[0].timestamp;
    const lastObs = points[points.length - 1].timestamp;
    const totalDurationMs = Math.max(0, points[points.length - 1].timestampMs - points[0].timestampMs);
    const totalDurationSeconds = Math.round(totalDurationMs / 1000);

    // Speed statistics
    let minSpeedMs: number | null = null;
    let maxSpeedMs: number | null = null;
    let totalSpeedMs = 0;
    let speedCount = 0;
    let providerCount = 0;
    let calcCount = 0;

    for (const pt of points) {
      let speedToUse: number | null = null;
      if (this.options.speedCalculationMode === "provider-first") {
        speedToUse = pt.speedProvider ?? pt.speedCalculated;
        if (pt.speedProvider !== null) providerCount++;
        else if (pt.speedCalculated !== null) calcCount++;
      } else if (this.options.speedCalculationMode === "calculate-from-distance") {
        speedToUse = pt.speedCalculated ?? pt.speedProvider;
        if (pt.speedCalculated !== null) calcCount++;
        else if (pt.speedProvider !== null) providerCount++;
      } else {
        speedToUse = pt.speedProvider;
        if (pt.speedProvider !== null) providerCount++;
      }

      if (speedToUse !== null && speedToUse >= 0) {
        if (minSpeedMs === null || speedToUse < minSpeedMs) minSpeedMs = speedToUse;
        if (maxSpeedMs === null || speedToUse > maxSpeedMs) maxSpeedMs = speedToUse;
        totalSpeedMs += speedToUse;
        speedCount++;
      }
    }

    const avgSpeedMs = speedCount > 0 ? totalSpeedMs / speedCount : null;
    const toKmh = (ms: number | null) => (ms !== null ? ms * 3.6 : null);

    let speedSource: "provider" | "calculated" | "mixed" | "none" = "none";
    if (providerCount > 0 && calcCount > 0) speedSource = "mixed";
    else if (providerCount > 0) speedSource = "provider";
    else if (calcCount > 0) speedSource = "calculated";

    const speedStats: TrackSpeedStatistics = {
      minSpeedMs,
      maxSpeedMs,
      avgSpeedMs,
      minSpeedKmh: toKmh(minSpeedMs),
      maxSpeedKmh: toKmh(maxSpeedMs),
      avgSpeedKmh: toKmh(avgSpeedMs),
      speedSource,
    };

    const hasGaps = segments.length > 1;
    const dataQualityNotes: string[] = [];
    if (hasGaps) {
      dataQualityNotes.push(`Track split into ${segments.length} segments due to time gaps > ${this.options.maxGapDurationSeconds}s.`);
    }

    return {
      totalDistanceMeters,
      totalDistanceKm: totalDistanceMeters / 1000,
      totalDurationMs,
      totalDurationSeconds,
      pointCount: points.length,
      segmentCount: segments.length,
      speedStats,
      firstObservationAt: firstObs,
      lastObservationAt: lastObs,
      hasGaps,
      dataQualityNotes,
    };
  }

  private createEmptyTrack(
    trackId: string,
    entityId: string,
    metadata: Record<string, unknown>
  ): Track {
    const nowIso = new Date().toISOString();
    return {
      id: trackId,
      entityId,
      entityType: "generic-asset",
      startTime: nowIso,
      endTime: nowIso,
      points: [],
      segments: [],
      geometry: null,
      statistics: {
        totalDistanceMeters: 0,
        totalDistanceKm: 0,
        totalDurationMs: 0,
        totalDurationSeconds: 0,
        pointCount: 0,
        segmentCount: 0,
        speedStats: {
          minSpeedMs: null,
          maxSpeedMs: null,
          avgSpeedMs: null,
          minSpeedKmh: null,
          maxSpeedKmh: null,
          avgSpeedKmh: null,
          speedSource: "none",
        },
        firstObservationAt: null,
        lastObservationAt: null,
        hasGaps: false,
        dataQualityNotes: ["Track contains no location points."],
      },
      status: "completed",
      metadata: { ...metadata },
    };
  }
}
