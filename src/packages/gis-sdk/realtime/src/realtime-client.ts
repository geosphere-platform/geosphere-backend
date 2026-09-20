import { GISSDK, SDKEventEmitter } from "@gis-sdk/core";

export type ConnectionState =
  "DISCONNECTED" | "CONNECTING" | "CONNECTED" | "RECONNECTING" | "FAILED";

export type RealtimeEventType =
  | "LOCATION_UPDATED"
  | "FEATURE_CREATED"
  | "FEATURE_UPDATED"
  | "FEATURE_DELETED"
  | "GEOFENCE_ENTERED"
  | "GEOFENCE_EXITED"
  | "ALERT_CREATED"
  | "RULE_TRIGGERED";

export interface RealtimeEventPayload {
  type: RealtimeEventType;
  payload: any;
  timestamp: string;
  channel?: string;
}

export interface ReconnectPolicy {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
}

export class RealtimeSDK {
  private connectionState: ConnectionState = "DISCONNECTED";
  private eventBus: SDKEventEmitter = new SDKEventEmitter();
  private reconnectPolicy: ReconnectPolicy;
  private retryCount: number = 0;
  private ws: any = null;
  private activeSubscriptions: Set<string> = new Set();
  private reconnectTimer: any = null;

  constructor(reconnectPolicy?: Partial<ReconnectPolicy>) {
    this.reconnectPolicy = {
      maxRetries: reconnectPolicy?.maxRetries ?? 5,
      initialDelayMs: reconnectPolicy?.initialDelayMs ?? 1000,
      maxDelayMs: reconnectPolicy?.maxDelayMs ?? 15000,
      backoffFactor: reconnectPolicy?.backoffFactor ?? 2,
    };
  }

  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  public connect(): void {
    if (
      this.connectionState === "CONNECTED" ||
      this.connectionState === "CONNECTING"
    ) {
      return;
    }

    this.setConnectionState("CONNECTING");

    try {
      const config = GISSDK.getInstance().getConfig();
      const wsUrl =
        config.apiBaseUrl.replace(/^http/, "ws") + "/api/v1/realtime";

      // Simulated browser/node WebSocket transport
      if (typeof window !== "undefined" && window.WebSocket) {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.setConnectionState("CONNECTED");
          this.retryCount = 0;
          this.resubscribeAll();
        };

        this.ws.onmessage = (evt: MessageEvent) => {
          try {
            const data: RealtimeEventPayload = JSON.parse(evt.data);
            this.handleIncomingEvent(data);
          } catch {
            // Ignore malformed payloads
          }
        };

        this.ws.onerror = () => {
          this.handleConnectionFailure();
        };

        this.ws.onclose = () => {
          if (this.connectionState !== "DISCONNECTED") {
            this.handleConnectionFailure();
          }
        };
      } else {
        // Node / test mock fallback
        setTimeout(() => {
          this.setConnectionState("CONNECTED");
          this.retryCount = 0;
        }, 50);
      }
    } catch {
      this.handleConnectionFailure();
    }
  }

  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
    this.setConnectionState("DISCONNECTED");
  }

  public subscribe(
    channel: string,
    callback: (event: RealtimeEventPayload) => void,
  ): () => void {
    this.activeSubscriptions.add(channel);
    const unbind = this.eventBus.on(`channel:${channel}`, callback);

    if (this.ws && this.connectionState === "CONNECTED") {
      this.sendSubscription(channel, "subscribe");
    }

    return () => {
      unbind();
      this.activeSubscriptions.delete(channel);
      if (this.ws && this.connectionState === "CONNECTED") {
        this.sendSubscription(channel, "unsubscribe");
      }
    };
  }

  public on(
    event: RealtimeEventType,
    callback: (event: RealtimeEventPayload) => void,
  ): () => void {
    return this.eventBus.on(`type:${event}`, callback);
  }

  public onConnectionStateChange(
    callback: (state: ConnectionState) => void,
  ): () => void {
    return this.eventBus.on("connectionStateChange", callback);
  }

  public simulateEvent(event: RealtimeEventPayload): void {
    this.handleIncomingEvent(event);
  }

  private handleIncomingEvent(event: RealtimeEventPayload): void {
    this.eventBus.emit("event", event);
    this.eventBus.emit(`type:${event.type}`, event);
    if (event.channel) {
      this.eventBus.emit(`channel:${event.channel}`, event);
    }
  }

  private handleConnectionFailure(): void {
    if (this.retryCount < this.reconnectPolicy.maxRetries) {
      this.setConnectionState("RECONNECTING");
      const delay = Math.min(
        this.reconnectPolicy.initialDelayMs *
          Math.pow(this.reconnectPolicy.backoffFactor, this.retryCount),
        this.reconnectPolicy.maxDelayMs,
      );
      this.retryCount++;
      this.reconnectTimer = setTimeout(() => this.connect(), delay);
    } else {
      this.setConnectionState("FAILED");
    }
  }

  private setConnectionState(state: ConnectionState): void {
    this.connectionState = state;
    this.eventBus.emit("connectionStateChange", state);
  }

  private resubscribeAll(): void {
    this.activeSubscriptions.forEach((channel) => {
      this.sendSubscription(channel, "subscribe");
    });
  }

  private sendSubscription(
    channel: string,
    action: "subscribe" | "unsubscribe",
  ): void {
    if (this.ws && this.ws.readyState === 1) {
      this.ws.send(JSON.stringify({ action, channel }));
    }
  }
}
