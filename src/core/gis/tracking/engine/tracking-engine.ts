/**
 * Framework-Independent Core Tracking Engine
 *
 * Manages live tracking sessions, ingests normalized LocationEvents, builds real-time Track
 * primitives, computes travel statistics, and broadcasts Track update streams.
 *
 * MUST NOT depend on OpenLayers, React, Next.js, or vehicle-specific tracking logic.
 */

import { LocationEvent } from "../../location/types/location.types";
import {
  Track,
  TrackingSession,
  TrackingSessionState,
  TrackingOptions,
} from "../types/tracking.types";
import { TrackBuilder } from "../builder/track-builder";

export type TrackUpdateListener = (track: Track) => void;
export type TrackingSessionStateListener = (session: TrackingSession) => void;

export interface TrackingSubscription {
  id: string;
  unsubscribe: () => void;
}

export class TrackingEngine {
  private builder: TrackBuilder;
  private currentSession: TrackingSession | null = null;
  private currentLocationEvents: LocationEvent[] = [];
  private currentTrack: Track | null = null;

  private trackListeners: Set<TrackUpdateListener> = new Set();
  private sessionStateListeners: Set<TrackingSessionStateListener> = new Set();

  constructor(options?: TrackingOptions) {
    this.builder = new TrackBuilder(options);
  }

  public setOptions(options: Partial<TrackingOptions>): void {
    this.builder = new TrackBuilder(options);
    if (this.currentTrack && this.currentLocationEvents.length > 0) {
      this.rebuildTrack();
    }
  }

  public startSession(
    entityId: string,
    entityType: string = "generic-asset",
    metadata: Record<string, unknown> = {}
  ): TrackingSession {
    const sessionId = `trk-session-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    this.currentSession = {
      sessionId,
      entityId,
      entityType,
      state: "ACTIVE",
      startTime: nowIso,
      metadata: { ...metadata },
    };

    this.currentLocationEvents = [];
    this.currentTrack = this.builder.buildTrack(sessionId, entityId, [], metadata);

    this.notifySessionStateListeners();
    return { ...this.currentSession };
  }

  public pauseSession(): void {
    if (!this.currentSession || this.currentSession.state !== "ACTIVE") return;
    this.currentSession.state = "PAUSED";
    this.notifySessionStateListeners();
  }

  public resumeSession(): void {
    if (!this.currentSession || this.currentSession.state !== "PAUSED") return;
    this.currentSession.state = "ACTIVE";
    this.notifySessionStateListeners();
  }

  public stopSession(): Track | null {
    if (!this.currentSession) return null;

    this.currentSession.state = "COMPLETED";
    this.currentSession.endTime = new Date().toISOString();
    this.notifySessionStateListeners();

    const finalTrack = this.currentTrack ? { ...this.currentTrack } : null;
    return finalTrack;
  }

  public ingestLocationEvent(event: LocationEvent): Track | null {
    if (!this.currentSession || this.currentSession.state !== "ACTIVE") {
      return null;
    }

    if (event.entityId !== this.currentSession.entityId) {
      // Ignore location events belonging to a different entity
      return null;
    }

    this.currentLocationEvents.push(event);
    this.rebuildTrack();
    return this.currentTrack ? { ...this.currentTrack } : null;
  }

  public ingestLocationBatch(events: LocationEvent[]): Track | null {
    if (!this.currentSession || this.currentSession.state !== "ACTIVE") {
      return null;
    }

    for (const evt of events) {
      if (evt.entityId === this.currentSession.entityId) {
        this.currentLocationEvents.push(evt);
      }
    }

    this.rebuildTrack();
    return this.currentTrack ? { ...this.currentTrack } : null;
  }

  public buildTrackFromHistory(
    trackId: string,
    entityId: string,
    events: LocationEvent[],
    metadata: Record<string, unknown> = {}
  ): Track {
    const entityEvents = events.filter((e) => e.entityId === entityId);
    return this.builder.buildTrack(trackId, entityId, entityEvents, metadata);
  }

  public getActiveTrack(): Track | null {
    return this.currentTrack ? { ...this.currentTrack } : null;
  }

  public getSession(): TrackingSession | null {
    return this.currentSession ? { ...this.currentSession } : null;
  }

  public subscribeTrack(listener: TrackUpdateListener): TrackingSubscription {
    this.trackListeners.add(listener);
    if (this.currentTrack) {
      try {
        listener(this.currentTrack);
      } catch {
        // Suppress listener callback errors
      }
    }
    const subId = `track-sub-${Math.random().toString(36).substring(2, 9)}`;
    return {
      id: subId,
      unsubscribe: () => {
        this.trackListeners.delete(listener);
      },
    };
  }

  public onSessionStateChange(listener: TrackingSessionStateListener): TrackingSubscription {
    this.sessionStateListeners.add(listener);
    if (this.currentSession) {
      try {
        listener({ ...this.currentSession });
      } catch {
        // Suppress listener callback errors
      }
    }
    const subId = `session-sub-${Math.random().toString(36).substring(2, 9)}`;
    return {
      id: subId,
      unsubscribe: () => {
        this.sessionStateListeners.delete(listener);
      },
    };
  }

  private rebuildTrack(): void {
    if (!this.currentSession) return;
    this.currentTrack = this.builder.buildTrack(
      this.currentSession.sessionId,
      this.currentSession.entityId,
      this.currentLocationEvents,
      this.currentSession.metadata
    );
    this.notifyTrackListeners();
  }

  private notifyTrackListeners(): void {
    if (!this.currentTrack) return;
    for (const listener of this.trackListeners) {
      try {
        listener(this.currentTrack);
      } catch {
        // Suppress listener callback errors
      }
    }
  }

  private notifySessionStateListeners(): void {
    if (!this.currentSession) return;
    for (const listener of this.sessionStateListeners) {
      try {
        listener({ ...this.currentSession });
      } catch {
        // Suppress listener callback errors
      }
    }
  }
}
