/**
 * GeoSphere Realtime & Event Streaming SDK Core Contracts
 * Framework-Neutral Communication, Transport Abstraction, Event Delivery & Subscription Engine
 */

export type GeoSphereRealtimeConnectionState =
  | "IDLE"
  | "CONNECTING"
  | "CONNECTED"
  | "RECONNECTING"
  | "DISCONNECTING"
  | "DISCONNECTED"
  | "FAILED";

export type GeoSphereRealtimeConnectionHealthState = "HEALTHY" | "DEGRADED" | "UNHEALTHY" | "UNKNOWN";

export interface GeoSphereRealtimeConnectionHealth {
  status: GeoSphereRealtimeConnectionHealthState;
  latencyMs: number;
  lastHeartbeatIso?: string;
  lastEventIso?: string;
  reconnectCount: number;
  connectionDurationSeconds: number;
}

export interface GeoSphereRealtimeEventEnvelope<P = unknown> {
  eventId: string;
  eventType: string;
  timestamp: string;
  channel: string;
  topic: string;
  source?: string;
  version: string;
  correlationId?: string;
  sequence?: number;
  payload: P;
  metadata?: Record<string, unknown>;
}

export type GeoSphereRealtimeSubscriptionState = "REQUESTED" | "ACTIVE" | "PAUSED" | "FAILED" | "CANCELLED";

export interface GeoSphereRealtimeSubscription {
  id: string;
  channel: string;
  topic: string;
  filter?: Record<string, unknown>;
  status: GeoSphereRealtimeSubscriptionState;
  createdAt: string;
}

export type GeoSphereRealtimeDeliveryState = "RECEIVED" | "PROCESSING" | "ACKNOWLEDGED" | "FAILED" | "DROPPED" | "DUPLICATE";

export type GeoSphereRealtimePresence = "ONLINE" | "AWAY" | "OFFLINE" | "UNKNOWN";

export type GeoSphereRealtimeCapability =
  | "WEBSOCKET"
  | "SSE"
  | "PUB_SUB"
  | "EVENT_FILTERING"
  | "ACKNOWLEDGED_DELIVERY"
  | "EVENT_REPLAY"
  | "PRESENCE"
  | "HEARTBEAT"
  | "RECONNECT_BACKOFF";

export interface GeoSphereRealtimeProviderInfo {
  name: string;
  version: string;
}

export interface GeoSphereRealtimeProvider {
  getProviderInfo(): GeoSphereRealtimeProviderInfo;
  getCapabilities(): GeoSphereRealtimeCapability[];
  connect(endpointUrl?: string): Promise<void>;
  disconnect(): Promise<void>;
  subscribe(channel: string, topic: string, filter?: Record<string, unknown>): Promise<GeoSphereRealtimeSubscription>;
  unsubscribe(subscriptionId: string): Promise<void>;
  publish(event: GeoSphereRealtimeEventEnvelope): Promise<void>;
  acknowledge(eventId: string): Promise<void>;
  getConnectionState(): GeoSphereRealtimeConnectionState;
  getHealth(): GeoSphereRealtimeConnectionHealth;
}

export class GeoSphereRealtimeError extends Error {
  constructor(
    public readonly code:
      | "CONNECTION_FAILED"
      | "CONNECTION_TIMEOUT"
      | "UNAUTHORIZED"
      | "FORBIDDEN"
      | "SUBSCRIPTION_FAILED"
      | "PUBLISH_FAILED"
      | "RATE_LIMITED"
      | "PAYLOAD_TOO_LARGE"
      | "SERVER_UNAVAILABLE"
      | "RECONNECT_EXHAUSTED"
      | "REPLAY_UNAVAILABLE"
      | "UNSUPPORTED_CAPABILITY"
      | "MALFORMED_EVENT"
      | "INCOMPATIBLE_EVENT_VERSION"
      | "UNKNOWN_ERROR",
    message: string,
    public readonly details?: unknown
  ) {
    super(`[REALTIME_ERROR:${code}] ${message}`);
    this.name = "GeoSphereRealtimeError";
  }
}

export class GeoSphereMockRealtimeProvider implements GeoSphereRealtimeProvider {
  private state: GeoSphereRealtimeConnectionState = "IDLE";
  private subscriptions = new Map<string, GeoSphereRealtimeSubscription>();
  private lastHeartbeat = new Date().toISOString();
  private reconnectCount = 0;
  private startTime = Date.now();

  public getProviderInfo(): GeoSphereRealtimeProviderInfo {
    return { name: "GeoSphereMockRealtimeProvider", version: "1.0.0" };
  }

  public getCapabilities(): GeoSphereRealtimeCapability[] {
    return [
      "WEBSOCKET",
      "SSE",
      "PUB_SUB",
      "EVENT_FILTERING",
      "ACKNOWLEDGED_DELIVERY",
      "EVENT_REPLAY",
      "PRESENCE",
      "HEARTBEAT",
      "RECONNECT_BACKOFF"
    ];
  }

  public async connect(endpointUrl?: string): Promise<void> {
    this.state = "CONNECTING";
    await new Promise((r) => setTimeout(r, 20));
    this.state = "CONNECTED";
    this.lastHeartbeat = new Date().toISOString();
  }

  public async disconnect(): Promise<void> {
    this.state = "DISCONNECTING";
    await new Promise((r) => setTimeout(r, 10));
    this.state = "DISCONNECTED";
  }

  public async subscribe(
    channel: string,
    topic: string,
    filter?: Record<string, unknown>
  ): Promise<GeoSphereRealtimeSubscription> {
    if (this.state !== "CONNECTED") {
      throw new GeoSphereRealtimeError("CONNECTION_FAILED", "Cannot subscribe while disconnected.");
    }
    const subId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const sub: GeoSphereRealtimeSubscription = {
      id: subId,
      channel,
      topic,
      filter,
      status: "ACTIVE",
      createdAt: new Date().toISOString()
    };
    this.subscriptions.set(subId, sub);
    return sub;
  }

  public async unsubscribe(subscriptionId: string): Promise<void> {
    this.subscriptions.delete(subscriptionId);
  }

  public async publish(event: GeoSphereRealtimeEventEnvelope): Promise<void> {
    if (this.state !== "CONNECTED") {
      throw new GeoSphereRealtimeError("CONNECTION_FAILED", "Cannot publish while disconnected.");
    }
    if (JSON.stringify(event.payload).length > 1024 * 1024) {
      throw new GeoSphereRealtimeError("PAYLOAD_TOO_LARGE", "Event payload exceeds maximum limit of 1MB.");
    }
  }

  public async acknowledge(eventId: string): Promise<void> {}

  public getConnectionState(): GeoSphereRealtimeConnectionState {
    return this.state;
  }

  public getHealth(): GeoSphereRealtimeConnectionHealth {
    return {
      status: this.state === "CONNECTED" ? "HEALTHY" : "UNHEALTHY",
      latencyMs: 15,
      lastHeartbeatIso: this.lastHeartbeat,
      reconnectCount: this.reconnectCount,
      connectionDurationSeconds: Math.round((Date.now() - this.startTime) / 1000)
    };
  }
}

export interface GeoSphereRealtimeConfig {
  endpointUrl?: string;
  autoReconnect?: boolean;
  maxReconnectRetries?: number;
  heartbeatIntervalMs?: number;
  maxPayloadSizeBytes?: number;
  embeddedMode?: boolean;
}

export class GeoSphereRealtimeSDK {
  private provider: GeoSphereRealtimeProvider;
  private listeners: Map<string, (event: { type: string; payload: unknown }) => void> = new Map();
  private eventHandlers: Map<string, (envelope: GeoSphereRealtimeEventEnvelope) => void> = new Map();
  private processedEventIds = new Set<string>();

  constructor(
    private config: GeoSphereRealtimeConfig = {},
    provider?: GeoSphereRealtimeProvider
  ) {
    this.provider = provider || new GeoSphereMockRealtimeProvider();
    this.config.autoReconnect = this.config.autoReconnect ?? true;
    this.config.maxReconnectRetries = this.config.maxReconnectRetries ?? 5;
    this.config.heartbeatIntervalMs = this.config.heartbeatIntervalMs ?? 30000;
  }

  public async initialize(): Promise<void> {}

  public getProviderInfo(): GeoSphereRealtimeProviderInfo {
    return this.provider.getProviderInfo();
  }

  public getCapabilities(): GeoSphereRealtimeCapability[] {
    return this.provider.getCapabilities();
  }

  public hasCapability(capability: GeoSphereRealtimeCapability): boolean {
    return this.getCapabilities().includes(capability);
  }

  public async connect(): Promise<void> {
    await this.provider.connect(this.config.endpointUrl);
    this.notifyListeners("realtime.connected", { state: this.getConnectionState() });
  }

  public async disconnect(): Promise<void> {
    await this.provider.disconnect();
    this.notifyListeners("realtime.disconnected", { state: this.getConnectionState() });
  }

  public getConnectionState(): GeoSphereRealtimeConnectionState {
    return this.provider.getConnectionState();
  }

  public getHealth(): GeoSphereRealtimeConnectionHealth {
    return this.provider.getHealth();
  }

  public async subscribe(
    channel: string,
    topic: string,
    filter?: Record<string, unknown>
  ): Promise<GeoSphereRealtimeSubscription> {
    const sub = await this.provider.subscribe(channel, topic, filter);
    this.notifyListeners("realtime.subscribed", { subscription: sub });
    return sub;
  }

  public async unsubscribe(subscriptionId: string): Promise<void> {
    await this.provider.unsubscribe(subscriptionId);
    this.notifyListeners("realtime.unsubscribed", { subscriptionId });
  }

  public async publish(event: GeoSphereRealtimeEventEnvelope): Promise<void> {
    await this.provider.publish(event);
    this.notifyListeners("realtime.published", { eventId: event.eventId, eventType: event.eventType });
  }

  public async acknowledge(eventId: string): Promise<void> {
    await this.provider.acknowledge(eventId);
    this.notifyListeners("realtime.acknowledged", { eventId });
  }

  public async replay(fromEventId: string): Promise<GeoSphereRealtimeEventEnvelope[]> {
    if (!this.hasCapability("EVENT_REPLAY")) {
      throw new GeoSphereRealtimeError("REPLAY_UNAVAILABLE", "Event replay capability is unsupported by this provider.");
    }
    return [];
  }

  public handleIncomingEvent(envelope: GeoSphereRealtimeEventEnvelope): GeoSphereRealtimeDeliveryState {
    if (this.processedEventIds.has(envelope.eventId)) {
      return "DUPLICATE";
    }
    this.processedEventIds.add(envelope.eventId);

    this.eventHandlers.forEach((handler) => {
      try {
        handler(envelope);
      } catch (err) {
        console.error("[REALTIME_HANDLER_ERROR] Event handler error:", err);
      }
    });

    this.notifyListeners("realtime.eventReceived", { envelope });
    return "RECEIVED";
  }

  public onEvent(onEnvelope: (envelope: GeoSphereRealtimeEventEnvelope) => void): { id: string; unsubscribe: () => void } {
    const handlerId = `handler_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    this.eventHandlers.set(handlerId, onEnvelope);
    return {
      id: handlerId,
      unsubscribe: () => {
        this.eventHandlers.delete(handlerId);
      }
    };
  }

  public subscribeToLifecycle(onEvent: (event: { type: string; payload: unknown }) => void): { id: string; unsubscribe: () => void } {
    const subId = `rt_sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    this.listeners.set(subId, onEvent);
    return {
      id: subId,
      unsubscribe: () => {
        this.listeners.delete(subId);
      }
    };
  }

  public destroy(): void {
    this.listeners.clear();
    this.eventHandlers.clear();
    this.processedEventIds.clear();
  }

  private notifyListeners(type: string, payload: unknown): void {
    this.listeners.forEach((listener) => {
      try {
        listener({ type, payload });
      } catch (err) {
        console.error("[REALTIME_LISTENER_ERROR] Listener error:", err);
      }
    });
  }
}
