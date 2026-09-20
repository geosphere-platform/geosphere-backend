import { HTTPClient } from "../http/index.js";
import { SystemNotification, APIResponse } from "../types/index.js";
import { GeoSphereNotificationsSDK, GeoSphereNotificationsConfig, GeoSphereNotificationProvider } from "../contracts/notifications.contracts.js";

export class NotificationsModule {
  constructor(private http: HTTPClient) {}

  public async listNotifications(): Promise<APIResponse<SystemNotification[]>> {
    return this.http.get<SystemNotification[]>("/api/notifications");
  }

  public async markAsRead(notificationId: string): Promise<APIResponse<void>> {
    return this.http.patch<void>(`/api/notifications/${notificationId}/read`);
  }

  public createNotificationsSDK(
    config?: GeoSphereNotificationsConfig,
    provider?: GeoSphereNotificationProvider
  ): GeoSphereNotificationsSDK {
    return new GeoSphereNotificationsSDK(config, provider);
  }
}

export * from "../contracts/notifications.contracts.js";
export * from "../contracts/notifications-ui.contracts.js";
