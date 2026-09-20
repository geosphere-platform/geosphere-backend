import { GeoSphereNotificationsSDK } from "../contracts/notifications.contracts.js";
export class NotificationsModule {
    http;
    constructor(http) {
        this.http = http;
    }
    async listNotifications() {
        return this.http.get("/api/notifications");
    }
    async markAsRead(notificationId) {
        return this.http.patch(`/api/notifications/${notificationId}/read`);
    }
    createNotificationsSDK(config, provider) {
        return new GeoSphereNotificationsSDK(config, provider);
    }
}
export * from "../contracts/notifications.contracts.js";
export * from "../contracts/notifications-ui.contracts.js";
//# sourceMappingURL=index.js.map