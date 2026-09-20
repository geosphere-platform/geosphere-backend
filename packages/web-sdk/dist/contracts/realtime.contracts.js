/**
 * GeoSphere Realtime & Event Streaming SDK Core Contracts
 * Framework-Neutral Communication, Transport Abstraction, Event Delivery & Subscription Engine
 */
export class GeoSphereRealtimeError extends Error {
    code;
    details;
    constructor(code, message, details) {
        super(`[REALTIME_ERROR:${code}] ${message}`);
        this.code = code;
        this.details = details;
        this.name = "GeoSphereRealtimeError";
    }
}
export class GeoSphereMockRealtimeProvider {
    state = "IDLE";
    subscriptions = new Map();
    lastHeartbeat = new Date().toISOString();
    reconnectCount = 0;
    startTime = Date.now();
    getProviderInfo() {
        return { name: "GeoSphereMockRealtimeProvider", version: "1.0.0" };
    }
    getCapabilities() {
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
    async connect(endpointUrl) {
        this.state = "CONNECTING";
        await new Promise((r) => setTimeout(r, 20));
        this.state = "CONNECTED";
        this.lastHeartbeat = new Date().toISOString();
    }
    async disconnect() {
        this.state = "DISCONNECTING";
        await new Promise((r) => setTimeout(r, 10));
        this.state = "DISCONNECTED";
    }
    async subscribe(channel, topic, filter) {
        if (this.state !== "CONNECTED") {
            throw new GeoSphereRealtimeError("CONNECTION_FAILED", "Cannot subscribe while disconnected.");
        }
        const subId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const sub = {
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
    async unsubscribe(subscriptionId) {
        this.subscriptions.delete(subscriptionId);
    }
    async publish(event) {
        if (this.state !== "CONNECTED") {
            throw new GeoSphereRealtimeError("CONNECTION_FAILED", "Cannot publish while disconnected.");
        }
        if (JSON.stringify(event.payload).length > 1024 * 1024) {
            throw new GeoSphereRealtimeError("PAYLOAD_TOO_LARGE", "Event payload exceeds maximum limit of 1MB.");
        }
    }
    async acknowledge(eventId) { }
    getConnectionState() {
        return this.state;
    }
    getHealth() {
        return {
            status: this.state === "CONNECTED" ? "HEALTHY" : "UNHEALTHY",
            latencyMs: 15,
            lastHeartbeatIso: this.lastHeartbeat,
            reconnectCount: this.reconnectCount,
            connectionDurationSeconds: Math.round((Date.now() - this.startTime) / 1000)
        };
    }
}
export class GeoSphereRealtimeSDK {
    config;
    provider;
    listeners = new Map();
    eventHandlers = new Map();
    processedEventIds = new Set();
    constructor(config = {}, provider) {
        this.config = config;
        this.provider = provider || new GeoSphereMockRealtimeProvider();
        this.config.autoReconnect = this.config.autoReconnect ?? true;
        this.config.maxReconnectRetries = this.config.maxReconnectRetries ?? 5;
        this.config.heartbeatIntervalMs = this.config.heartbeatIntervalMs ?? 30000;
    }
    async initialize() { }
    getProviderInfo() {
        return this.provider.getProviderInfo();
    }
    getCapabilities() {
        return this.provider.getCapabilities();
    }
    hasCapability(capability) {
        return this.getCapabilities().includes(capability);
    }
    async connect() {
        await this.provider.connect(this.config.endpointUrl);
        this.notifyListeners("realtime.connected", { state: this.getConnectionState() });
    }
    async disconnect() {
        await this.provider.disconnect();
        this.notifyListeners("realtime.disconnected", { state: this.getConnectionState() });
    }
    getConnectionState() {
        return this.provider.getConnectionState();
    }
    getHealth() {
        return this.provider.getHealth();
    }
    async subscribe(channel, topic, filter) {
        const sub = await this.provider.subscribe(channel, topic, filter);
        this.notifyListeners("realtime.subscribed", { subscription: sub });
        return sub;
    }
    async unsubscribe(subscriptionId) {
        await this.provider.unsubscribe(subscriptionId);
        this.notifyListeners("realtime.unsubscribed", { subscriptionId });
    }
    async publish(event) {
        await this.provider.publish(event);
        this.notifyListeners("realtime.published", { eventId: event.eventId, eventType: event.eventType });
    }
    async acknowledge(eventId) {
        await this.provider.acknowledge(eventId);
        this.notifyListeners("realtime.acknowledged", { eventId });
    }
    async replay(fromEventId) {
        if (!this.hasCapability("EVENT_REPLAY")) {
            throw new GeoSphereRealtimeError("REPLAY_UNAVAILABLE", "Event replay capability is unsupported by this provider.");
        }
        return [];
    }
    handleIncomingEvent(envelope) {
        if (this.processedEventIds.has(envelope.eventId)) {
            return "DUPLICATE";
        }
        this.processedEventIds.add(envelope.eventId);
        this.eventHandlers.forEach((handler) => {
            try {
                handler(envelope);
            }
            catch (err) {
                console.error("[REALTIME_HANDLER_ERROR] Event handler error:", err);
            }
        });
        this.notifyListeners("realtime.eventReceived", { envelope });
        return "RECEIVED";
    }
    onEvent(onEnvelope) {
        const handlerId = `handler_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        this.eventHandlers.set(handlerId, onEnvelope);
        return {
            id: handlerId,
            unsubscribe: () => {
                this.eventHandlers.delete(handlerId);
            }
        };
    }
    subscribeToLifecycle(onEvent) {
        const subId = `rt_sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        this.listeners.set(subId, onEvent);
        return {
            id: subId,
            unsubscribe: () => {
                this.listeners.delete(subId);
            }
        };
    }
    destroy() {
        this.listeners.clear();
        this.eventHandlers.clear();
        this.processedEventIds.clear();
    }
    notifyListeners(type, payload) {
        this.listeners.forEach((listener) => {
            try {
                listener({ type, payload });
            }
            catch (err) {
                console.error("[REALTIME_LISTENER_ERROR] Listener error:", err);
            }
        });
    }
}
//# sourceMappingURL=realtime.contracts.js.map