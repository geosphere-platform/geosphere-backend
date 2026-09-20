/**
 * GeoSphere Notifications & Messaging SDK Core Contracts
 * Framework-Neutral Notification Model, State Machine, Push Abstraction & Preference Engine
 */
export class GeoSphereNotificationsError extends Error {
    code;
    details;
    constructor(code, message, details) {
        super(`[NOTIFICATIONS_ERROR:${code}] ${message}`);
        this.code = code;
        this.details = details;
        this.name = "GeoSphereNotificationsError";
    }
}
export class GeoSphereMockNotificationProvider {
    notifications = new Map();
    pushTokens = new Map();
    preferences = {
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
        const seed = {
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
    getProviderInfo() {
        return { name: "GeoSphereMockNotificationProvider", version: "1.0.0" };
    }
    getCapabilities() {
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
    async listNotifications(cursor, limit = 20) {
        const list = Array.from(this.notifications.values()).sort((a, b) => (a.timestamp > b.timestamp ? -1 : 1));
        return { items: list.slice(0, limit) };
    }
    async markAsRead(notificationId) {
        const item = this.notifications.get(notificationId);
        if (!item) {
            throw new GeoSphereNotificationsError("NOTIFICATION_NOT_FOUND", `Notification ID ${notificationId} not found.`);
        }
        item.status = "READ";
        item.readAt = new Date().toISOString();
    }
    async markAllAsRead() {
        const now = new Date().toISOString();
        this.notifications.forEach((item) => {
            item.status = "READ";
            item.readAt = now;
        });
    }
    async acknowledge(notificationId) {
        const item = this.notifications.get(notificationId);
        if (!item) {
            throw new GeoSphereNotificationsError("NOTIFICATION_NOT_FOUND", `Notification ID ${notificationId} not found.`);
        }
        item.status = "ACKNOWLEDGED";
        item.acknowledgedAt = new Date().toISOString();
    }
    async dismiss(notificationId) {
        const item = this.notifications.get(notificationId);
        if (item) {
            item.status = "DISMISSED";
        }
    }
    async registerPushToken(token, platform, provider) {
        if (!token || token.length < 5) {
            throw new GeoSphereNotificationsError("TOKEN_INVALID", "Invalid push token string provided.");
        }
        const pushTok = {
            token,
            platform,
            provider,
            registeredAt: new Date().toISOString(),
            status: "ACTIVE"
        };
        this.pushTokens.set(token, pushTok);
        return pushTok;
    }
    async unregisterPushToken(token) {
        this.pushTokens.delete(token);
    }
    async getPreferences() {
        return JSON.parse(JSON.stringify(this.preferences));
    }
    async updatePreferences(prefs) {
        this.preferences = { ...this.preferences, ...prefs };
        return JSON.parse(JSON.stringify(this.preferences));
    }
}
export class GeoSphereNotificationsSDK {
    config;
    provider;
    listeners = new Map();
    constructor(config = {}, provider) {
        this.config = config;
        this.provider = provider || new GeoSphereMockNotificationProvider();
        this.config.pageSize = this.config.pageSize || 20;
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
    async listNotifications(cursor, limit) {
        return this.provider.listNotifications(cursor, limit || this.config.pageSize);
    }
    async getUnreadCount() {
        const res = await this.listNotifications(undefined, 100);
        return res.items.filter((i) => i.status !== "READ" && i.status !== "ACKNOWLEDGED" && i.status !== "DISMISSED").length;
    }
    async markAsRead(notificationId) {
        await this.provider.markAsRead(notificationId);
        this.notifyListeners("notifications.read", { notificationId });
    }
    async markAllAsRead() {
        await this.provider.markAllAsRead();
        this.notifyListeners("notifications.allRead", {});
    }
    async acknowledge(notificationId) {
        await this.provider.acknowledge(notificationId);
        this.notifyListeners("notifications.acknowledged", { notificationId });
    }
    async dismiss(notificationId) {
        await this.provider.dismiss(notificationId);
        this.notifyListeners("notifications.dismissed", { notificationId });
    }
    async registerPushToken(token, platform, provider) {
        const pushToken = await this.provider.registerPushToken(token, platform, provider);
        this.notifyListeners("notifications.pushTokenRegistered", { token: pushToken.token, platform });
        return pushToken;
    }
    async unregisterPushToken(token) {
        await this.provider.unregisterPushToken(token);
        this.notifyListeners("notifications.pushTokenUnregistered", { token });
    }
    async getPreferences() {
        return this.provider.getPreferences();
    }
    async updatePreferences(prefs) {
        const updated = await this.provider.updatePreferences(prefs);
        this.notifyListeners("notifications.preferencesUpdated", { preferences: updated });
        return updated;
    }
    subscribe(onEvent) {
        const subId = `notif_sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
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
    }
    notifyListeners(type, payload) {
        this.listeners.forEach((listener) => {
            try {
                listener({ type, payload });
            }
            catch (err) {
                console.error("[NOTIFICATIONS_LISTENER_ERROR] Listener error:", err);
            }
        });
    }
}
//# sourceMappingURL=notifications.contracts.js.map