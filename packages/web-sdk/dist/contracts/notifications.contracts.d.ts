/**
 * GeoSphere Notifications & Messaging SDK Core Contracts
 * Framework-Neutral Notification Model, State Machine, Push Abstraction & Preference Engine
 */
export type GeoSphereNotificationStatus = "CREATED" | "QUEUED" | "SENDING" | "DELIVERED" | "RECEIVED" | "READ" | "ACKNOWLEDGED" | "DISMISSED" | "EXPIRED" | "FAILED";
export type GeoSphereNotificationType = "INFO" | "SUCCESS" | "WARNING" | "ERROR" | "SYSTEM" | "CUSTOM";
export type GeoSphereNotificationPriority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";
export type GeoSphereNotificationSeverity = "INFO" | "NOTICE" | "WARNING" | "ERROR" | "CRITICAL";
export type GeoSphereNotificationChannel = "IN_APP" | "PUSH" | "EMAIL" | "SMS" | "WEB_PUSH";
export interface GeoSphereNotificationAction {
    id: string;
    label: string;
    actionType: "OPEN" | "VIEW" | "RETRY" | "DISMISS" | "ACKNOWLEDGE" | "DEEP_LINK";
    target?: string;
    payload?: Record<string, unknown>;
}
export interface GeoSphereNotification {
    id: string;
    type: GeoSphereNotificationType;
    title: string;
    body: string;
    timestamp: string;
    priority: GeoSphereNotificationPriority;
    severity: GeoSphereNotificationSeverity;
    category: string;
    recipientId?: string;
    source?: string;
    channel: GeoSphereNotificationChannel;
    status: GeoSphereNotificationStatus;
    metadata?: Record<string, unknown>;
    actions?: GeoSphereNotificationAction[];
    deepLink?: string;
    icon?: string;
    image?: string;
    expiresAt?: string;
    version: string;
    readAt?: string;
    acknowledgedAt?: string;
}
export interface GeoSpherePushToken {
    token: string;
    platform: "web" | "android" | "ios";
    provider: "fcm" | "apns" | "webpush";
    registeredAt: string;
    status: "ACTIVE" | "EXPIRED" | "REVOKED";
}
export interface GeoSphereNotificationPreference {
    enabled: boolean;
    channels: Record<GeoSphereNotificationChannel, boolean>;
    categories: Record<string, boolean>;
    quietHours?: {
        enabled: boolean;
        startTime: string;
        endTime: string;
        timezone: string;
    };
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    badgeEnabled: boolean;
}
export type GeoSphereNotificationCapability = "IN_APP" | "PUSH" | "TOKEN_REGISTRATION" | "ACTIONS" | "DEEP_LINKS" | "READ_RECEIPTS" | "EXPLICIT_ACK" | "QUIET_HOURS" | "PAGINATION" | "OFFLINE_SYNC";
export interface GeoSphereNotificationProviderInfo {
    name: string;
    version: string;
}
export interface GeoSphereNotificationProvider {
    getProviderInfo(): GeoSphereNotificationProviderInfo;
    getCapabilities(): GeoSphereNotificationCapability[];
    listNotifications(cursor?: string, limit?: number): Promise<{
        items: GeoSphereNotification[];
        nextCursor?: string;
    }>;
    markAsRead(notificationId: string): Promise<void>;
    markAllAsRead(): Promise<void>;
    acknowledge(notificationId: string): Promise<void>;
    dismiss(notificationId: string): Promise<void>;
    registerPushToken(token: string, platform: "web" | "android" | "ios", provider: "fcm" | "apns" | "webpush"): Promise<GeoSpherePushToken>;
    unregisterPushToken(token: string): Promise<void>;
    getPreferences(): Promise<GeoSphereNotificationPreference>;
    updatePreferences(prefs: Partial<GeoSphereNotificationPreference>): Promise<GeoSphereNotificationPreference>;
}
export declare class GeoSphereNotificationsError extends Error {
    readonly code: "NOTIFICATION_NOT_FOUND" | "NOTIFICATION_UNAUTHORIZED" | "NOTIFICATION_ALREADY_READ" | "NOTIFICATION_EXPIRED" | "DELIVERY_FAILED" | "PUSH_PROVIDER_UNAVAILABLE" | "TOKEN_INVALID" | "TOKEN_EXPIRED" | "RATE_LIMITED" | "PAYLOAD_TOO_LARGE" | "ACTION_NOT_ALLOWED" | "DEEP_LINK_NOT_ALLOWED" | "UNSUPPORTED_CHANNEL" | "UNSUPPORTED_CAPABILITY" | "UNKNOWN_ERROR";
    readonly details?: unknown | undefined;
    constructor(code: "NOTIFICATION_NOT_FOUND" | "NOTIFICATION_UNAUTHORIZED" | "NOTIFICATION_ALREADY_READ" | "NOTIFICATION_EXPIRED" | "DELIVERY_FAILED" | "PUSH_PROVIDER_UNAVAILABLE" | "TOKEN_INVALID" | "TOKEN_EXPIRED" | "RATE_LIMITED" | "PAYLOAD_TOO_LARGE" | "ACTION_NOT_ALLOWED" | "DEEP_LINK_NOT_ALLOWED" | "UNSUPPORTED_CHANNEL" | "UNSUPPORTED_CAPABILITY" | "UNKNOWN_ERROR", message: string, details?: unknown | undefined);
}
export declare class GeoSphereMockNotificationProvider implements GeoSphereNotificationProvider {
    private notifications;
    private pushTokens;
    private preferences;
    constructor();
    getProviderInfo(): GeoSphereNotificationProviderInfo;
    getCapabilities(): GeoSphereNotificationCapability[];
    listNotifications(cursor?: string, limit?: number): Promise<{
        items: GeoSphereNotification[];
        nextCursor?: string;
    }>;
    markAsRead(notificationId: string): Promise<void>;
    markAllAsRead(): Promise<void>;
    acknowledge(notificationId: string): Promise<void>;
    dismiss(notificationId: string): Promise<void>;
    registerPushToken(token: string, platform: "web" | "android" | "ios", provider: "fcm" | "apns" | "webpush"): Promise<GeoSpherePushToken>;
    unregisterPushToken(token: string): Promise<void>;
    getPreferences(): Promise<GeoSphereNotificationPreference>;
    updatePreferences(prefs: Partial<GeoSphereNotificationPreference>): Promise<GeoSphereNotificationPreference>;
}
export interface GeoSphereNotificationsConfig {
    embeddedMode?: boolean;
    pageSize?: number;
    autoSyncOffline?: boolean;
}
export declare class GeoSphereNotificationsSDK {
    private config;
    private provider;
    private listeners;
    constructor(config?: GeoSphereNotificationsConfig, provider?: GeoSphereNotificationProvider);
    initialize(): Promise<void>;
    getProviderInfo(): GeoSphereNotificationProviderInfo;
    getCapabilities(): GeoSphereNotificationCapability[];
    hasCapability(capability: GeoSphereNotificationCapability): boolean;
    listNotifications(cursor?: string, limit?: number): Promise<{
        items: GeoSphereNotification[];
        nextCursor?: string;
    }>;
    getUnreadCount(): Promise<number>;
    markAsRead(notificationId: string): Promise<void>;
    markAllAsRead(): Promise<void>;
    acknowledge(notificationId: string): Promise<void>;
    dismiss(notificationId: string): Promise<void>;
    registerPushToken(token: string, platform: "web" | "android" | "ios", provider: "fcm" | "apns" | "webpush"): Promise<GeoSpherePushToken>;
    unregisterPushToken(token: string): Promise<void>;
    getPreferences(): Promise<GeoSphereNotificationPreference>;
    updatePreferences(prefs: Partial<GeoSphereNotificationPreference>): Promise<GeoSphereNotificationPreference>;
    subscribe(onEvent: (event: {
        type: string;
        payload: unknown;
    }) => void): {
        id: string;
        unsubscribe: () => void;
    };
    destroy(): void;
    private notifyListeners;
}
//# sourceMappingURL=notifications.contracts.d.ts.map