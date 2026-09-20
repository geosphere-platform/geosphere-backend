/**
 * Framework-Independent GeofencingEngine Class
 *
 * Manages spatial evaluation state transitions (ENTER, EXIT, DWELL_START, DWELL_END),
 * consumes normalized LocationEvents, evaluates geofence boundaries deterministically,
 * prevents duplicate transition events, and broadcasts real-time GeofenceEvents.
 *
 * MUST NOT depend on React, Next.js, OpenLayers, Android/iOS UI, database ORMs, or vehicle PII.
 */

import { LocationEvent } from "../../location/types/location.types";
import { Coordinate } from "../../types/geometry";
import {
  Geofence,
  GeofenceState,
  GeofenceEventType,
  GeofenceEvent,
  GeofenceEvaluationResult,
  GeofenceEventListener,
} from "../types/geofence.types";
import { IGeofenceRepository, InMemoryGeofenceRepository } from "../repository/geofence-repository.interface";
import { GeofenceEvaluator } from "../evaluator/geofence-evaluator";

interface EntityGeofenceState {
  state: GeofenceState;
  enteredAtMs: number | null;
  dwellTriggered: boolean;
  lastEvaluatedAt: string;
}

export class GeofencingEngine {
  private readonly repository: IGeofenceRepository;
  private readonly evaluator: GeofenceEvaluator;
  private readonly stateMap = new Map<string, EntityGeofenceState>(); // Key: `${subjectId}:${geofenceId}`
  private readonly listeners = new Set<GeofenceEventListener>();

  constructor(repository?: IGeofenceRepository) {
    this.repository = repository ?? new InMemoryGeofenceRepository();
    this.evaluator = new GeofenceEvaluator();
  }

  public getRepository(): IGeofenceRepository {
    return this.repository;
  }

  public subscribeEvents(listener: GeofenceEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public unsubscribeEvents(listener: GeofenceEventListener): void {
    this.listeners.delete(listener);
  }

  private notifyListeners(event: GeofenceEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error("[GEOFENCE-ENGINE:ERR] Listener throw exception:", err);
      }
    }
  }

  private getCompositeKey(subjectId: string, geofenceId: string): string {
    return `${subjectId}:${geofenceId}`;
  }

  /**
   * Process a normalized LocationEvent against all active geofences
   */
  public async processLocationEvent(locationEvent: LocationEvent): Promise<GeofenceEvent[]> {
    const activeGeofences = await this.repository.listActiveGeofences();
    if (activeGeofences.length === 0) return [];

    const subjectId = locationEvent.entityId;
    const coordinate: Coordinate = [locationEvent.location.longitude, locationEvent.location.latitude];

    const generatedEvents: GeofenceEvent[] = [];

    for (const geofence of activeGeofences) {
      const accuracyThreshold = geofence.options?.accuracyThresholdMeters ?? 500;
      const accuracy = locationEvent.location.accuracy;
      if (accuracy !== null && accuracy !== undefined && accuracy > accuracyThreshold) {
        continue; // Skip evaluation for low-accuracy GPS fixes
      }

      const evalRes = this.evaluator.evaluateCoordinate(
        coordinate,
        geofence,
        subjectId,
        locationEvent.timestamp,
      );

      const events = this.updateEntityState(subjectId, geofence, evalRes, locationEvent);
      for (const evt of events) {
        generatedEvents.push(evt);
        this.notifyListeners(evt);
      }
    }

    return generatedEvents;
  }

  private updateEntityState(
    subjectId: string,
    geofence: Geofence,
    evalRes: GeofenceEvaluationResult,
    locationEvent: LocationEvent,
  ): GeofenceEvent[] {
    const key = this.getCompositeKey(subjectId, geofence.id);
    const existing = this.stateMap.get(key) ?? {
      state: "UNKNOWN",
      enteredAtMs: null,
      dwellTriggered: false,
      lastEvaluatedAt: locationEvent.timestamp,
    };

    const previousState = existing.state;
    const currentState = evalRes.state;
    const nowMs = locationEvent.timestampMs;

    const events: GeofenceEvent[] = [];

    // State Transition: ENTER (OUTSIDE/UNKNOWN -> INSIDE)
    if ((previousState === "OUTSIDE" || previousState === "UNKNOWN") && currentState === "INSIDE") {
      this.stateMap.set(key, {
        state: "INSIDE",
        enteredAtMs: nowMs,
        dwellTriggered: false,
        lastEvaluatedAt: locationEvent.timestamp,
      });

      events.push(
        this.createEvent("ENTER", geofence, subjectId, previousState, currentState, locationEvent),
      );
      return events;
    }

    // State Transition: EXIT (INSIDE -> OUTSIDE)
    if (previousState === "INSIDE" && currentState === "OUTSIDE") {
      let dwellSec: number | undefined = undefined;
      if (existing.dwellTriggered && existing.enteredAtMs !== null) {
        dwellSec = Math.round((nowMs - existing.enteredAtMs) / 1000);
        events.push(
          this.createEvent(
            "DWELL_END",
            geofence,
            subjectId,
            "INSIDE",
            "OUTSIDE",
            locationEvent,
            dwellSec,
          ),
        );
      }

      this.stateMap.set(key, {
        state: "OUTSIDE",
        enteredAtMs: null,
        dwellTriggered: false,
        lastEvaluatedAt: locationEvent.timestamp,
      });

      events.push(
        this.createEvent("EXIT", geofence, subjectId, previousState, currentState, locationEvent),
      );
      return events;
    }

    // Continuous INSIDE — Evaluate DWELL_START if dwellConfig enabled
    if (currentState === "INSIDE") {
      const dwellConfig = geofence.options?.dwellConfig;
      if (dwellConfig && dwellConfig.enabled && !existing.dwellTriggered && existing.enteredAtMs !== null) {
        const dwellElapsedSeconds = (nowMs - existing.enteredAtMs) / 1000;
        if (dwellElapsedSeconds >= dwellConfig.dwellDurationSeconds) {
          this.stateMap.set(key, {
            ...existing,
            dwellTriggered: true,
            lastEvaluatedAt: locationEvent.timestamp,
          });

          events.push(
            this.createEvent(
              "DWELL_START",
              geofence,
              subjectId,
              "INSIDE",
              "INSIDE",
              locationEvent,
              Math.round(dwellElapsedSeconds),
            ),
          );
        }
      } else {
        this.stateMap.set(key, {
          ...existing,
          lastEvaluatedAt: locationEvent.timestamp,
        });
      }
    }

    return events;
  }

  private createEvent(
    eventType: GeofenceEventType,
    geofence: Geofence,
    subjectId: string,
    previousState: GeofenceState,
    currentState: GeofenceState,
    locationEvent: LocationEvent,
    dwellDurationSeconds?: number,
  ): GeofenceEvent {
    return {
      id: `gfe_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      geofenceId: geofence.id,
      geofenceName: geofence.name,
      subjectId,
      previousState,
      currentState,
      eventType,
      locationEvent,
      timestamp: locationEvent.timestamp,
      dwellDurationSeconds,
    };
  }

  /**
   * Get current state for a subject and geofence
   */
  public getEntityState(subjectId: string, geofenceId: string): GeofenceState {
    const key = this.getCompositeKey(subjectId, geofenceId);
    return this.stateMap.get(key)?.state ?? "UNKNOWN";
  }

  /**
   * Clear entity state map
   */
  public resetEntityStates(): void {
    this.stateMap.clear();
  }
}
