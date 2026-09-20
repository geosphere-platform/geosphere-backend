/**
 * GeoSphere Notifications & Messaging SDK Core Contracts
 * Framework-Neutral Notification Model, State Machine, Push Abstraction & Preference Engine
 */

export type GeoSphereNotificationStatus =
  | "CREATED"
  | "QUEUED"
  | "SENDING"
  | "DELIVERED"
  | "RECEIVED"
  | "READ"
  | "ACKNOWLEDGED"
  | "DISMISSED"
  | "EXPIRED"
  | "FAILED";

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
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
    timezone: string;
  };
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  badgeEnabled: boolean;
}

export type GeoSphereNotificationCapability =
  | "IN_APP"
  | "PUSH"
  | "TOKEN_REGISTRATION"
  | "ACTIONS"
  | "DEEP_LINKS"
  | "READ_RECEIPTS"
  | "EXPLICIT_ACK"
  | "QUIET_HOURS"
  | "PAGINATION"
  | "OFFLINE_SYNC";

export interface GeoSphereNotificationProviderInfo {
  name: string;
  version: string;
}

export interface GeoSphereNotificationProvider {
  getProviderInfo(): GeoSphereNotificationProviderInfo;
  getCapabilities(): GeoSphereNotificationCapability[];
  listNotifications(cursor?: string, limit?: number): Promise<{ items: GeoSphereNotification[]; nextCursor?: string }>;
  markAsRead(notificationId: string): Promise<void>;
  markAllAsRead(): Promise<void>;
  acknowledge(notificationId: string): Promise<void>;
  dismiss(notificationId: string): Promise<void>;
  registerPushToken(token: string, platform: "web" | "android" | "ios", provider: "fcm" | "apns" | "webpush"): Promise<GeoSpherePushToken>;
  unregisterPushToken(token: string): Promise<void>;
  getPreferences(): Promise<GeoSphereNotificationPreference>;
  updatePreferences(prefs: Partial<GeoSphereNotificationPreference>): Promise<GeoSphereNotificationPreference>;
}

export class GeoSphereNotificationsError extends Error {
  constructor(
    public readonly code:
      | "NOTIFICATION_NOT_FOUND"
      | "NOTIFICATION_UNAUTHORIZED"
      | "NOTIFICATION_ALREADY_READ"
      | "NOTIFICATION_EXPIRED"
      | "DELIVERY_FAILED"
      | "PUSH_PROVIDER_UNAVAILABLE"
      | "TOKEN_INVALID"
      | "TOKEN_EXPIRED"
      | "RATE_LIMITED"
      | "PAYLOAD_TOO_LARGE"
      | "ACTION_NOT_ALLOWED"
      | "DEEP_LINK_NOT_ALLOWED"
      | "UNSUPPORTED_CHANNEL"
      | "UNSUPPORTED_CAPABILITY"
      | "UNKNOWN_ERROR",
    message: string,
    public readonly details?: unknown
  ) {
    super(`[NOTIFICATIONS_ERROR:${code}] ${message}`);
    this.name = "GeoSphereNotificationsError";
  }
}

export class GeoSphereMockNotificationProvider implements GeoSphereNotificationProvider {
  private notifications = new Map<string, GeoSphereNotification>();
  private pushTokens = new Map<string, GeoSpherePushToken>();
  private preferences: GeoSphereNotificationPreference = {
    enabled: true,
    channels: { IN_APP: true, PUSH: true, EMAIL: false, SMS: false, WEB_PUSH: true },
    categories: { system: true, alerts: true },
    quietHours: { enabled: false, startTime: "22:00", endTime: "07:00", timezone: "UTC" },
    soundEnabled: true,
    vibrationEnabled: true,
    badgeEnabled: true
  };

  constructor() {
    // Seed initial mock notification
    const nowIso = new Date().toISOString();
    const seed: GeoSphereNotification = {
      id: "notif_seed_001",
      type: "SYSTEM",
      title: "Welcome to GeoSphere Notifications",
      body: "System notifications engine initialized cleanly.",
      timestamp: nowIso,
      priority: "NORMAL",
      severity: "INFO",
      category: "system",
      channel: "IN_APP",
      status: "DELIVERED",
      version: "1.0"
    };
    this.notifications.set(seed.id, seed);
  }

  public getProviderInfo(): GeoSphereNotificationProviderInfo {
    return { name: "GeoSphereMockNotificationProvider", version: "1.0.0" };
  }

  public getCapabilities(): GeoSphereNotificationCapability[] {
    return [
      "IN_APP",
      "PUSH",
      "TOKEN_REGISTRATION",
      "ACTIONS",
      "DEEP_LINKS",
      "READ_RECEIPTS",
      "EXPLICIT_ACK",
      "QUIET_HOURS",
      "PAGINATION",
      "OFFLINE_SYNC"
    ];
  }

  public async listNotifications(cursor?: string, limit: number = 20): Promise<{ items: GeoSphereNotification[]; nextCursor?: string }> {
    const list = Array.from(this.notifications.values()).sort((a, b) => (a.timestamp > b.timestamp ? -1 : 1));
    return { items: list.slice(0, limit) };
  }

  public async markAsRead(notificationId: string): Promise<void> {
    const item = this.notifications.get(notificationId);
    if (!item) {
      throw new GeoSphereNotificationsError("NOTIFICATION_NOT_FOUND", `Notification ID ${notificationId} not found.`);
    }
    item.status = "READ";
    item.readAt = new Date().toISOString();
  }

  public async markAllAsRead(): Promise<void> {
    const now = new Date().toISOString();
    this.notifications.forEach((item) => {
      item.status = "READ";
      item.readAt = now;
    });
  }

  public async acknowledge(notificationId: string): Promise<void> {
    const item = this.notifications.get(notificationId);
    if (!item) {
      throw new GeoSphereNotificationsError("NOTIFICATION_NOT_FOUND", `Notification ID ${notificationId} not found.`);
    }
    item.status = "ACKNOWLEDGED";
    item.acknowledgedAt = new Date().toISOString();
  }

  public async dismiss(notificationId: string): Promise<void> {
    const item = this.notifications.get(notificationId);
    if (item) {
      item.status = "DISMISSED";
    }
  }

  public async registerPushToken(
    token: string,
    platform: "web" | "android" | "ios",
    provider: "fcm" | "apns" | "webpush"
  ): Promise<GeoSpherePushToken> {
    if (!token || token.length < 5) {
      throw new GeoSphereNotificationsError("TOKEN_INVALID", "Invalid push token string provided.");
    }
    const pushTok: GeoSpherePushToken = {
      token,
      platform,
      provider,
      registeredAt: new Date().toISOString(),
      status: "ACTIVE"
    };
    this.pushTokens.set(token, pushTok);
    return pushTok;
  }

  public async unregisterPushToken(token: string): Promise<void> {
    this.pushTokens.delete(token);
  }

  public async getPreferences(): Promise<GeoSphereNotificationPreference> {
    return JSON.parse(JSON.stringify(this.preferences));
  }

  public async updatePreferences(prefs: Partial<GeoSphereNotificationPreference>): Promise<GeoSphereNotificationPreference> {
    this.preferences = { ...this.preferences, ...prefs };
    return JSON.parse(JSON.stringify(this.preferences));
  }
}

export interface GeoSphereNotificationsConfig {
  embeddedMode?: boolean;
  pageSize?: number;
  autoSyncOffline?: boolean;
}

export class GeoSphereNotificationsSDK {
  private provider: GeoSphereNotificationProvider;
  private listeners: Map<string, (event: { type: string; payload: unknown }) => void> = new Map();

  constructor(
    private config: GeoSphereNotificationsConfig = {},
    provider?: GeoSphereNotificationProvider
  ) {
    this.provider = provider || new GeoSphereMockNotificationProvider();
    this.config.pageSize = this.config.pageSize || 20;
  }

  public async initialize(): Promise<void> {}

  public getProviderInfo(): GeoSphereNotificationProviderInfo {
    return this.provider.getProviderInfo();
  }

  public getCapabilities(): GeoSphereNotificationCapability[] {
    return this.provider.getCapabilities();
  }

  public hasCapability(capability: GeoSphereNotificationCapability): boolean {
    return this.getCapabilities().includes(capability);
  }

  public async listNotifications(cursor?: string, limit?: number): Promise<{ items: GeoSphereNotification[]; nextCursor?: string }> {
    return this.provider.listNotifications(cursor, limit || this.config.pageSize);
  }

  public async getUnreadCount(): Promise<number> {
    const res = await this.listNotifications(undefined, 100);
    return res.items.filter((i) => i.status !== "READ" && i.status !== "ACKNOWLEDGED" && i.status !== "DISMISSED").length;
  }

  public async markAsRead(notificationId: string): Promise<void> {
    await this.provider.markAsRead(notificationId);
    this.notifyListeners("notifications.read", { notificationId });
  }

  public async markAllAsRead(): Promise<void> {
    await this.provider.markAllAsRead();
    this.notifyListeners("notifications.allRead", {});
  }

  public async acknowledge(notificationId: string): Promise<void> {
    await this.provider.acknowledge(notificationId);
    this.notifyListeners("notifications.acknowledged", { notificationId });
  }

  public async dismiss(notificationId: string): Promise<void> {
    await this.provider.dismiss(notificationId);
    this.notifyListeners("notifications.dismissed", { notificationId });
  }

  public async registerPushToken(
    token: string,
    platform: "web" | "android" | "ios",
    provider: "fcm" | "apns" | "webpush"
  ): Promise<GeoSpherePushToken> {
    const pushToken = await this.provider.registerPushToken(token, platform, provider);
    this.notifyListeners("notifications.pushTokenRegistered", { token: pushToken.token, platform });
    return pushToken;
  }

  public async unregisterPushToken(token: string): Promise<void> {
    await this.provider.unregisterPushToken(token);
    this.notifyListeners("notifications.pushTokenUnregistered", { token });
  }

  public async getPreferences(): Promise<GeoSphereNotificationPreference> {
    return this.provider.getPreferences();
  }

  public async updatePreferences(prefs: Partial<GeoSphereNotificationPreference>): Promise<GeoSphereNotificationPreference> {
    const updated = await this.provider.updatePreferences(prefs);
    this.notifyListeners("notifications.preferencesUpdated", { preferences: updated });
    return updated;
  }

  public subscribe(onEvent: (event: { type: string; payload: unknown }) => void): { id: string; unsubscribe: () => void } {
    const subId = `notif_sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
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
  }

  private notifyListeners(type: string, payload: unknown): void {
    this.listeners.forEach((listener) => {
      try {
        listener({ type, payload });
      } catch (err) {
        console.error("[NOTIFICATIONS_LISTENER_ERROR] Listener error:", err);
      }
    });
  }
}
