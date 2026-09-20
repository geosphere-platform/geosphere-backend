/**
 * GeoSphere Analytics & Telemetry SDK Core Contracts
 * Framework-Neutral Event Model, Metrics, Performance Timers, Privacy & Consent Engine
 */
export class GeoSphereAnalyticsError extends Error {
    code;
    details;
    constructor(code, message, details) {
        super(`[ANALYTICS_ERROR:${code}] ${message}`);
        this.code = code;
        this.details = details;
        this.name = "GeoSphereAnalyticsError";
    }
}
export class GeoSphereMockAnalyticsProvider {
    buffer = [];
    getProviderInfo() {
        return { name: "GeoSphereMockAnalyticsProvider", version: "1.0.0" };
    }
    getCapabilities() {
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
    async send(event) {
        this.buffer.push(event);
    }
    async sendBatch(events) {
        this.buffer.push(...events);
    }
    async flush() {
        this.buffer = [];
    }
    getBufferedEvents() {
        return [...this.buffer];
    }
}
export class GeoSphereAnalyticsSDK {
    config;
    provider;
    currentSession;
    privacyConfig;
    samplingConfig;
    consent;
    buffer = [];
    metrics = new Map();
    activeTimers = new Map();
    listeners = new Map();
    constructor(config = {}, provider) {
        this.config = config;
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
    getConsent() {
        return this.consent;
    }
    setConsent(consent) {
        this.consent = consent;
        this.notifyListeners("analytics.consentUpdated", { consent });
    }
    getPrivacyConfig() {
        return { ...this.privacyConfig };
    }
    updatePrivacyConfig(config) {
        this.privacyConfig = { ...this.privacyConfig, ...config };
        this.notifyListeners("analytics.privacyUpdated", { privacyConfig: this.privacyConfig });
        return { ...this.privacyConfig };
    }
    getSession() {
        return { ...this.currentSession };
    }
    startSession() {
        const nowIso = new Date().toISOString();
        this.currentSession = {
            sessionId: `sess_analytics_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            sessionStart: nowIso,
            isActive: true
        };
        this.notifyListeners("analytics.sessionStarted", { session: this.currentSession });
        return this.getSession();
    }
    endSession() {
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
    async trackEvent(eventType, sdkName, metadata, payload) {
        if (this.consent === "DENIED" || this.consent === "WITHDRAWN" || !this.privacyConfig.telemetryEnabled) {
            return null;
        }
        // Sampling check
        if (this.samplingConfig.percentage < 100 && Math.random() * 100 > this.samplingConfig.percentage) {
            return null;
        }
        const sanitizedMeta = this.sanitizeMetadata(metadata);
        const sanitizedPayload = this.sanitizeMetadata(payload);
        const event = {
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
    recordMetric(name, type, value, unit, dimensions) {
        const metric = {
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
    startMeasurement(operationName) {
        this.activeTimers.set(operationName, Date.now());
    }
    stopMeasurement(operationName, sdkName = "core") {
        const startTime = this.activeTimers.get(operationName);
        if (!startTime)
            return 0;
        const durationMs = Date.now() - startTime;
        this.activeTimers.delete(operationName);
        this.recordMetric(`${operationName}.duration`, "TIMER", durationMs, "ms");
        this.trackEvent("PERFORMANCE", sdkName, { operationName }, { durationMs });
        return durationMs;
    }
    recordDuration(operationName, durationMs, sdkName = "core") {
        this.recordMetric(`${operationName}.duration`, "TIMER", durationMs, "ms");
        this.trackEvent("PERFORMANCE", sdkName, { operationName }, { durationMs });
    }
    async flush() {
        if (this.buffer.length > 0) {
            await this.provider.sendBatch(this.buffer);
            await this.provider.flush();
            this.buffer = [];
            this.notifyListeners("analytics.flushed", {});
        }
    }
    subscribe(onEvent) {
        const subId = `analytics_sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
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
        this.buffer = [];
        this.metrics.clear();
        this.activeTimers.clear();
    }
    sanitizeMetadata(data) {
        if (!data)
            return undefined;
        const sanitized = {};
        const forbiddenKeys = ["password", "token", "secret", "apikey", "authorization", "cookie", "ssn", "creditcard"];
        for (const [key, val] of Object.entries(data)) {
            if (forbiddenKeys.some((fk) => key.toLowerCase().includes(fk))) {
                sanitized[key] = "[REDACTED]";
            }
            else {
                sanitized[key] = val;
            }
        }
        return sanitized;
    }
    notifyListeners(type, payload) {
        this.listeners.forEach((listener) => {
            try {
                listener({ type, payload });
            }
            catch (err) {
                console.error("[ANALYTICS_LISTENER_ERROR] Listener error:", err);
            }
        });
    }
}
//# sourceMappingURL=analytics.contracts.js.map