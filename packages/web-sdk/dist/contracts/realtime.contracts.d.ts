/**
 * GeoSphere Realtime & Event Streaming SDK Core Contracts
 * Framework-Neutral Communication, Transport Abstraction, Event Delivery & Subscription Engine
 */
export type GeoSphereRealtimeConnectionState = "IDLE" | "CONNECTING" | "CONNECTED" | "RECONNECTING" | "DISCONNECTING" | "DISCONNECTED" | "FAILED";
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
export type GeoSphereRealtimeCapability = "WEBSOCKET" | "SSE" | "PUB_SUB" | "EVENT_FILTERING" | "ACKNOWLEDGED_DELIVERY" | "EVENT_REPLAY" | "PRESENCE" | "HEARTBEAT" | "RECONNECT_BACKOFF";
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
export declare class GeoSphereRealtimeError extends Error {
    readonly code: "CONNECTION_FAILED" | "CONNECTION_TIMEOUT" | "UNAUTHORIZED" | "FORBIDDEN" | "SUBSCRIPTION_FAILED" | "PUBLISH_FAILED" | "RATE_LIMITED" | "PAYLOAD_TOO_LARGE" | "SERVER_UNAVAILABLE" | "RECONNECT_EXHAUSTED" | "REPLAY_UNAVAILABLE" | "UNSUPPORTED_CAPABILITY" | "MALFORMED_EVENT" | "INCOMPATIBLE_EVENT_VERSION" | "UNKNOWN_ERROR";
    readonly details?: unknown | undefined;
    constructor(code: "CONNECTION_FAILED" | "CONNECTION_TIMEOUT" | "UNAUTHORIZED" | "FORBIDDEN" | "SUBSCRIPTION_FAILED" | "PUBLISH_FAILED" | "RATE_LIMITED" | "PAYLOAD_TOO_LARGE" | "SERVER_UNAVAILABLE" | "RECONNECT_EXHAUSTED" | "REPLAY_UNAVAILABLE" | "UNSUPPORTED_CAPABILITY" | "MALFORMED_EVENT" | "INCOMPATIBLE_EVENT_VERSION" | "UNKNOWN_ERROR", message: string, details?: unknown | undefined);
}
export declare class GeoSphereMockRealtimeProvider implements GeoSphereRealtimeProvider {
    private state;
    private subscriptions;
    private lastHeartbeat;
    private reconnectCount;
    private startTime;
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
export interface GeoSphereRealtimeConfig {
    endpointUrl?: string;
    autoReconnect?: boolean;
    maxReconnectRetries?: number;
    heartbeatIntervalMs?: number;
    maxPayloadSizeBytes?: number;
    embeddedMode?: boolean;
}
export declare class GeoSphereRealtimeSDK {
    private config;
    private provider;
    private listeners;
    private eventHandlers;
    private processedEventIds;
    constructor(config?: GeoSphereRealtimeConfig, provider?: GeoSphereRealtimeProvider);
    initialize(): Promise<void>;
    getProviderInfo(): GeoSphereRealtimeProviderInfo;
    getCapabilities(): GeoSphereRealtimeCapability[];
    hasCapability(capability: GeoSphereRealtimeCapability): boolean;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    getConnectionState(): GeoSphereRealtimeConnectionState;
    getHealth(): GeoSphereRealtimeConnectionHealth;
    subscribe(channel: string, topic: string, filter?: Record<string, unknown>): Promise<GeoSphereRealtimeSubscription>;
    unsubscribe(subscriptionId: string): Promise<void>;
    publish(event: GeoSphereRealtimeEventEnvelope): Promise<void>;
    acknowledge(eventId: string): Promise<void>;
    replay(fromEventId: string): Promise<GeoSphereRealtimeEventEnvelope[]>;
    handleIncomingEvent(envelope: GeoSphereRealtimeEventEnvelope): GeoSphereRealtimeDeliveryState;
    onEvent(onEnvelope: (envelope: GeoSphereRealtimeEventEnvelope) => void): {
        id: string;
        unsubscribe: () => void;
    };
    subscribeToLifecycle(onEvent: (event: {
        type: string;
        payload: unknown;
    }) => void): {
        id: string;
        unsubscribe: () => void;
    };
    destroy(): void;
    private notifyListeners;
}
//# sourceMappingURL=realtime.contracts.d.ts.map