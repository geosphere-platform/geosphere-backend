import { HTTPClient } from "../http/index.js";
import { SystemNotification, APIResponse } from "../types/index.js";
import { GeoSphereNotificationsSDK, GeoSphereNotificationsConfig, GeoSphereNotificationProvider } from "../contracts/notifications.contracts.js";
export declare class NotificationsModule {
    private http;
    constructor(http: HTTPClient);
    listNotifications(): Promise<APIResponse<SystemNotification[]>>;
    markAsRead(notificationId: string): Promise<APIResponse<void>>;
    createNotificationsSDK(config?: GeoSphereNotificationsConfig, provider?: GeoSphereNotificationProvider): GeoSphereNotificationsSDK;
}
export * from "../contracts/notifications.contracts.js";
export * from "../contracts/notifications-ui.contracts.js";
//# sourceMappingURL=index.d.ts.map