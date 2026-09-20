/**
 * GeoSphere Analytics & Telemetry SDK Core Contracts
 * Framework-Neutral Event Model, Metrics, Performance Timers, Privacy & Consent Engine
 */

export type GeoSphereAnalyticsEventType =
  | "SDK_USAGE"
  | "PERFORMANCE"
  | "ERROR"
  | "WARNING"
  | "DIAGNOSTIC"
  | "LIFECYCLE"
  | "NETWORK"
  | "SECURITY"
  | "CUSTOM";

export type GeoSphereAnalyticsMetricType = "COUNTER" | "GAUGE" | "HISTOGRAM" | "TIMER";

export type GeoSphereAnalyticsConsent = "UNKNOWN" | "GRANTED" | "DENIED" | "WITHDRAWN";

export interface GeoSphereAnalyticsEvent<P = Record<string, unknown>> {
  eventId: string;
  eventType: GeoSphereAnalyticsEventType;
  timestamp: string;
  sessionId: string;
  applicationId?: string;
  sdkName: string;
  sdkVersion: string;
  platform: "web" | "android" | "ios";
  platformVersion?: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
  payload?: P;
}

export interface GeoSphereAnalyticsMetric {
  name: string;
  type: GeoSphereAnalyticsMetricType;
  value: number;
  unit?: string;
  timestamp: string;
  dimensions?: Record<string, string>;
}

export interface GeoSphereAnalyticsSession {
  sessionId: string;
  sessionStart: string;
  sessionEnd?: string;
  sessionDurationMs?: number;
  isActive: boolean;
}

export interface GeoSphereAnalyticsPrivacyConfig {
  telemetryEnabled: boolean;
  analyticsEnabled: boolean;
  diagnosticsEnabled: boolean;
  performanceEnabled: boolean;
  locationTelemetryEnabled: boolean;
  personalizedAnalyticsEnabled: boolean;
}

export interface GeoSphereAnalyticsSamplingConfig {
  percentage: number; // 0 to 100
  errorSamplingPercentage: number; // 0 to 100
  performanceSamplingPercentage: number; // 0 to 100
}

export type GeoSphereAnalyticsCapability =
  | "EVENT_TRACKING"
  | "METRIC_RECORDING"
  | "PERFORMANCE_MEASUREMENT"
  | "SESSION_MANAGEMENT"
  | "OFFLINE_BUFFERING"
  | "BATCHING"
  | "CONSENT_ENFORCEMENT"
  | "DATA_MINIMIZATION";

export interface GeoSphereAnalyticsProviderInfo {
  name: string;
  version: string;
}

export interface GeoSphereAnalyticsProvider {
  getProviderInfo(): GeoSphereAnalyticsProviderInfo;
  getCapabilities(): GeoSphereAnalyticsCapability[];
  send(event: GeoSphereAnalyticsEvent): Promise<void>;
  sendBatch(events: GeoSphereAnalyticsEvent[]): Promise<void>;
  flush(): Promise<void>;
}

export class GeoSphereAnalyticsError extends Error {
  constructor(
    public readonly code:
      | "EVENT_INVALID"
      | "CONSENT_DENIED"
      | "METRIC_INVALID"
      | "BUFFER_FULL"
      | "TRANSPORT_FAILED"
      | "RATE_LIMITED"
      | "PAYLOAD_TOO_LARGE"
      | "UNSUPPORTED_CAPABILITY"
      | "UNKNOWN_ERROR",
    message: string,
    public readonly details?: unknown
  ) {
    super(`[ANALYTICS_ERROR:${code}] ${message}`);
    this.name = "GeoSphereAnalyticsError";
  }
}

export class GeoSphereMockAnalyticsProvider implements GeoSphereAnalyticsProvider {
  private buffer: GeoSphereAnalyticsEvent[] = [];

  public getProviderInfo(): GeoSphereAnalyticsProviderInfo {
    return { name: "GeoSphereMockAnalyticsProvider", version: "1.0.0" };
  }

  public getCapabilities(): GeoSphereAnalyticsCapability[] {
    return [
      "EVENT_TRACKING",
      "METRIC_RECORDING",
      "PERFORMANCE_MEASUREMENT",
      "SESSION_MANAGEMENT",
      "OFFLINE_BUFFERING",
      "BATCHING",
      "CONSENT_ENFORCEMENT",
      "DATA_MINIMIZATION"
    ];
  }

  public async send(event: GeoSphereAnalyticsEvent): Promise<void> {
    this.buffer.push(event);
  }

  public async sendBatch(events: GeoSphereAnalyticsEvent[]): Promise<void> {
    this.buffer.push(...events);
  }

  public async flush(): Promise<void> {
    this.buffer = [];
  }

  public getBufferedEvents(): GeoSphereAnalyticsEvent[] {
    return [...this.buffer];
  }
}

export interface GeoSphereAnalyticsConfig {
  embeddedMode?: boolean;
  batchSize?: number;
  flushIntervalMs?: number;
  maxBufferSize?: number;
  privacyConfig?: Partial<GeoSphereAnalyticsPrivacyConfig>;
  samplingConfig?: Partial<GeoSphereAnalyticsSamplingConfig>;
  consent?: GeoSphereAnalyticsConsent;
}

export class GeoSphereAnalyticsSDK {
  private provider: GeoSphereAnalyticsProvider;
  private currentSession: GeoSphereAnalyticsSession;
  private privacyConfig: GeoSphereAnalyticsPrivacyConfig;
  private samplingConfig: GeoSphereAnalyticsSamplingConfig;
  private consent: GeoSphereAnalyticsConsent;
  private buffer: GeoSphereAnalyticsEvent[] = [];
  private metrics: Map<string, GeoSphereAnalyticsMetric> = new Map();
  private activeTimers: Map<string, number> = new Map();
  private listeners: Map<string, (event: { type: string; payload: unknown }) => void> = new Map();

  constructor(
    private config: GeoSphereAnalyticsConfig = {},
    provider?: GeoSphereAnalyticsProvider
  ) {
    this.provider = provider || new GeoSphereMockAnalyticsProvider();
    this.consent = config.consent || "GRANTED";

    this.privacyConfig = {
      telemetryEnabled: true,
      analyticsEnabled: true,
      diagnosticsEnabled: true,
      performanceEnabled: true,
      locationTelemetryEnabled: false,
      personalizedAnalyticsEnabled: false,
      ...config.privacyConfig
    };

    this.samplingConfig = {
      percentage: 100,
      errorSamplingPercentage: 100,
      performanceSamplingPercentage: 100,
      ...config.samplingConfig
    };

    const nowIso = new Date().toISOString();
    this.currentSession = {
      sessionId: `sess_analytics_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      sessionStart: nowIso,
      isActive: true
    };
  }

  public async initialize(): Promise<void> {}

  public getProviderInfo(): GeoSphereAnalyticsProviderInfo {
    return this.provider.getProviderInfo();
  }

  public getCapabilities(): GeoSphereAnalyticsCapability[] {
    return this.provider.getCapabilities();
  }

  public hasCapability(capability: GeoSphereAnalyticsCapability): boolean {
    return this.getCapabilities().includes(capability);
  }

  public getConsent(): GeoSphereAnalyticsConsent {
    return this.consent;
  }

  public setConsent(consent: GeoSphereAnalyticsConsent): void {
    this.consent = consent;
    this.notifyListeners("analytics.consentUpdated", { consent });
  }

  public getPrivacyConfig(): GeoSphereAnalyticsPrivacyConfig {
    return { ...this.privacyConfig };
  }

  public updatePrivacyConfig(config: Partial<GeoSphereAnalyticsPrivacyConfig>): GeoSphereAnalyticsPrivacyConfig {
    this.privacyConfig = { ...this.privacyConfig, ...config };
    this.notifyListeners("analytics.privacyUpdated", { privacyConfig: this.privacyConfig });
    return { ...this.privacyConfig };
  }

  public getSession(): GeoSphereAnalyticsSession {
    return { ...this.currentSession };
  }

  public startSession(): GeoSphereAnalyticsSession {
    const nowIso = new Date().toISOString();
    this.currentSession = {
      sessionId: `sess_analytics_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      sessionStart: nowIso,
      isActive: true
    };
    this.notifyListeners("analytics.sessionStarted", { session: this.currentSession });
    return this.getSession();
  }

  public endSession(): GeoSphereAnalyticsSession {
    if (this.currentSession.isActive) {
      const nowIso = new Date().toISOString();
      const durationMs = new Date(nowIso).getTime() - new Date(this.currentSession.sessionStart).getTime();
      this.currentSession.sessionEnd = nowIso;
      this.currentSession.sessionDurationMs = durationMs;
      this.currentSession.isActive = false;
      this.notifyListeners("analytics.sessionEnded", { session: this.currentSession });
    }
    return this.getSession();
  }

  public async trackEvent(
    eventType: GeoSphereAnalyticsEventType,
    sdkName: string,
    metadata?: Record<string, unknown>,
    payload?: Record<string, unknown>
  ): Promise<GeoSphereAnalyticsEvent | null> {
    if (this.consent === "DENIED" || this.consent === "WITHDRAWN" || !this.privacyConfig.telemetryEnabled) {
      return null;
    }

    // Sampling check
    if (this.samplingConfig.percentage < 100 && Math.random() * 100 > this.samplingConfig.percentage) {
      return null;
    }

    const sanitizedMeta = this.sanitizeMetadata(metadata);
    const sanitizedPayload = this.sanitizeMetadata(payload);

    const event: GeoSphereAnalyticsEvent = {
      eventId: `evt_analytics_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      eventType,
      timestamp: new Date().toISOString(),
      sessionId: this.currentSession.sessionId,
      sdkName,
      sdkVersion: "1.0.0",
      platform: "web",
      metadata: sanitizedMeta,
      payload: sanitizedPayload
    };

    this.buffer.push(event);
    await this.provider.send(event);
    this.notifyListeners("analytics.eventTracked", { event });
    return event;
  }

  public recordMetric(name: string, type: GeoSphereAnalyticsMetricType, value: number, unit?: string, dimensions?: Record<string, string>): GeoSphereAnalyticsMetric {
    const metric: GeoSphereAnalyticsMetric = {
      name,
      type,
      value,
      unit,
      timestamp: new Date().toISOString(),
      dimensions
    };
    this.metrics.set(name, metric);
    this.notifyListeners("analytics.metricRecorded", { metric });
    return metric;
  }

  public startMeasurement(operationName: string): void {
    this.activeTimers.set(operationName, Date.now());
  }

  public stopMeasurement(operationName: string, sdkName: string = "core"): number {
    const startTime = this.activeTimers.get(operationName);
    if (!startTime) return 0;

    const durationMs = Date.now() - startTime;
    this.activeTimers.delete(operationName);

    this.recordMetric(`${operationName}.duration`, "TIMER", durationMs, "ms");
    this.trackEvent("PERFORMANCE", sdkName, { operationName }, { durationMs });
    return durationMs;
  }

  public recordDuration(operationName: string, durationMs: number, sdkName: string = "core"): void {
    this.recordMetric(`${operationName}.duration`, "TIMER", durationMs, "ms");
    this.trackEvent("PERFORMANCE", sdkName, { operationName }, { durationMs });
  }

  public async flush(): Promise<void> {
    if (this.buffer.length > 0) {
      await this.provider.sendBatch(this.buffer);
      await this.provider.flush();
      this.buffer = [];
      this.notifyListeners("analytics.flushed", {});
    }
  }

  public subscribe(onEvent: (event: { type: string; payload: unknown }) => void): { id: string; unsubscribe: () => void } {
    const subId = `analytics_sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
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
    this.buffer = [];
    this.metrics.clear();
    this.activeTimers.clear();
  }

  private sanitizeMetadata(data?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!data) return undefined;
    const sanitized: Record<string, unknown> = {};
    const forbiddenKeys = ["password", "token", "secret", "apikey", "authorization", "cookie", "ssn", "creditcard"];

    for (const [key, val] of Object.entries(data)) {
      if (forbiddenKeys.some((fk) => key.toLowerCase().includes(fk))) {
        sanitized[key] = "[REDACTED]";
      } else {
        sanitized[key] = val;
      }
    }
    return sanitized;
  }

  private notifyListeners(type: string, payload: unknown): void {
    this.listeners.forEach((listener) => {
      try {
        listener({ type, payload });
      } catch (err) {
        console.error("[ANALYTICS_LISTENER_ERROR] Listener error:", err);
      }
    });
  }
}
