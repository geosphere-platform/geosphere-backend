/**
 * RealtimeEventPublisher — Generic Event Delivery Abstraction
 *
 * Provides decoupled event publishing & channel subscription routing for real-time GIS clients.
 * Designed so Redis / Kafka / NATS adapters can be swapped in without modifying domain code.
 */

import { EventEmitter } from "events";
import { RealtimeEventEnvelope } from "./spatial-event.model";

export interface IRealtimeEventPublisher {
  publish<T = Record<string, unknown>>(
    envelope: RealtimeEventEnvelope<T>,
  ): Promise<void>;
  subscribe(
    channel: string,
    listener: (envelope: RealtimeEventEnvelope) => void,
  ): () => void;
  unsubscribe(
    channel: string,
    listener: (envelope: RealtimeEventEnvelope) => void,
  ): void;
  getSubscriberCount(channel: string): number;
}

export class InMemoryRealtimeEventPublisher implements IRealtimeEventPublisher {
  private emitter: EventEmitter;

  constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(500);
  }

  /**
   * Publish real-time event envelope across routing channels:
   * 1. `tenant:{tenantId}`
   * 2. `subject:{subjectId}`
   * 3. `all`
   */
  async publish<T = Record<string, unknown>>(
    envelope: RealtimeEventEnvelope<T>,
  ): Promise<void> {
    const tenantChannel = `tenant:${envelope.tenantId}`;
    const subjectChannel = `subject:${envelope.subjectId}`;

    this.emitter.emit(tenantChannel, envelope);
    this.emitter.emit(subjectChannel, envelope);
    this.emitter.emit("all", envelope);
  }

  /**
   * Subscribe to a real-time event channel
   */
  subscribe(
    channel: string,
    listener: (envelope: RealtimeEventEnvelope) => void,
  ): () => void {
    this.emitter.on(channel, listener);
    return () => this.unsubscribe(channel, listener);
  }

  /**
   * Unsubscribe from a real-time event channel
   */
  unsubscribe(
    channel: string,
    listener: (envelope: RealtimeEventEnvelope) => void,
  ): void {
    this.emitter.off(channel, listener);
  }

  /**
   * Get active subscriber count for channel
   */
  getSubscriberCount(channel: string): number {
    return this.emitter.listenerCount(channel);
  }
}
