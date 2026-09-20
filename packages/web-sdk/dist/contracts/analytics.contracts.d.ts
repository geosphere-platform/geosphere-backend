/**
 * GeoSphere Analytics & Telemetry SDK Core Contracts
 * Framework-Neutral Event Model, Metrics, Performance Timers, Privacy & Consent Engine
 */
export type GeoSphereAnalyticsEventType = "SDK_USAGE" | "PERFORMANCE" | "ERROR" | "WARNING" | "DIAGNOSTIC" | "LIFECYCLE" | "NETWORK" | "SECURITY" | "CUSTOM";
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
    percentage: number;
    errorSamplingPercentage: number;
    performanceSamplingPercentage: number;
}
export type GeoSphereAnalyticsCapability = "EVENT_TRACKING" | "METRIC_RECORDING" | "PERFORMANCE_MEASUREMENT" | "SESSION_MANAGEMENT" | "OFFLINE_BUFFERING" | "BATCHING" | "CONSENT_ENFORCEMENT" | "DATA_MINIMIZATION";
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
export declare class GeoSphereAnalyticsError extends Error {
    readonly code: "EVENT_INVALID" | "CONSENT_DENIED" | "METRIC_INVALID" | "BUFFER_FULL" | "TRANSPORT_FAILED" | "RATE_LIMITED" | "PAYLOAD_TOO_LARGE" | "UNSUPPORTED_CAPABILITY" | "UNKNOWN_ERROR";
    readonly details?: unknown | undefined;
    constructor(code: "EVENT_INVALID" | "CONSENT_DENIED" | "METRIC_INVALID" | "BUFFER_FULL" | "TRANSPORT_FAILED" | "RATE_LIMITED" | "PAYLOAD_TOO_LARGE" | "UNSUPPORTED_CAPABILITY" | "UNKNOWN_ERROR", message: string, details?: unknown | undefined);
}
export declare class GeoSphereMockAnalyticsProvider implements GeoSphereAnalyticsProvider {
    private buffer;
    getProviderInfo(): GeoSphereAnalyticsProviderInfo;
    getCapabilities(): GeoSphereAnalyticsCapability[];
    send(event: GeoSphereAnalyticsEvent): Promise<void>;
    sendBatch(events: GeoSphereAnalyticsEvent[]): Promise<void>;
    flush(): Promise<void>;
    getBufferedEvents(): GeoSphereAnalyticsEvent[];
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
export declare class GeoSphereAnalyticsSDK {
    private config;
    private provider;
    private currentSession;
    private privacyConfig;
    private samplingConfig;
    private consent;
    private buffer;
    private metrics;
    private activeTimers;
    private listeners;
    constructor(config?: GeoSphereAnalyticsConfig, provider?: GeoSphereAnalyticsProvider);
    initialize(): Promise<void>;
    getProviderInfo(): GeoSphereAnalyticsProviderInfo;
    getCapabilities(): GeoSphereAnalyticsCapability[];
    hasCapability(capability: GeoSphereAnalyticsCapability): boolean;
    getConsent(): GeoSphereAnalyticsConsent;
    setConsent(consent: GeoSphereAnalyticsConsent): void;
    getPrivacyConfig(): GeoSphereAnalyticsPrivacyConfig;
    updatePrivacyConfig(config: Partial<GeoSphereAnalyticsPrivacyConfig>): GeoSphereAnalyticsPrivacyConfig;
    getSession(): GeoSphereAnalyticsSession;
    startSession(): GeoSphereAnalyticsSession;
    endSession(): GeoSphereAnalyticsSession;
    trackEvent(eventType: GeoSphereAnalyticsEventType, sdkName: string, metadata?: Record<string, unknown>, payload?: Record<string, unknown>): Promise<GeoSphereAnalyticsEvent | null>;
    recordMetric(name: string, type: GeoSphereAnalyticsMetricType, value: number, unit?: string, dimensions?: Record<string, string>): GeoSphereAnalyticsMetric;
    startMeasurement(operationName: string): void;
    stopMeasurement(operationName: string, sdkName?: string): number;
    recordDuration(operationName: string, durationMs: number, sdkName?: string): void;
    flush(): Promise<void>;
    subscribe(onEvent: (event: {
        type: string;
        payload: unknown;
    }) => void): {
        id: string;
        unsubscribe: () => void;
    };
    destroy(): void;
    private sanitizeMetadata;
    private notifyListeners;
}
//# sourceMappingURL=analytics.contracts.d.ts.map