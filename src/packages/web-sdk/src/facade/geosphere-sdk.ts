/**
 * Master GeoSphereSDK Facade Class (@geosphere/web-sdk)
 *
 * Provides a unified, strongly-typed master entrypoint for web applications to compose
 * and consume all 11 GeoSphere engines:
 * 1. LocationEngine (@geosphere/location)
 * 2. TrackingEngine (@geosphere/tracking)
 * 3. GeofencingEngine (@geosphere/geofencing)
 * 4. RoutingEngine (@geosphere/routing)
 * 5. FormsEngine (@geosphere/forms)
 * 6. TasksEngine (@geosphere/tasks)
 * 7. MediaEngine (@geosphere/media)
 * 8. NotificationEngine (@geosphere/notifications)
 * 9. SpatialAnalyticsEngine (@geosphere/analytics)
 * 10. OfflineSyncEngine (@geosphere/offline)
 * 11. SecurityAuditEngine (@geosphere/security)
 *
 * MUST NOT depend on React, Next.js, OpenLayers directly in facade, or vehicle PII.
 */

import { LocationEngine } from "../../../gis-location/src";
import { TrackingEngine } from "../../../gis-tracking/src";
import { GeofencingEngine } from "../../../gis-geofencing/src";
import { RoutingEngine } from "../../../gis-routing/src";
import { FormsEngine } from "../../../gis-forms/src";
import { TasksEngine } from "../../../gis-tasks/src";
import { MediaEngine } from "../../../gis-media/src";
import { NotificationEngine } from "../../../gis-notifications/src";
import { SpatialAnalyticsEngine } from "../../../gis-analytics/src";
import { OfflineSyncEngine } from "../../../gis-offline/src";
import { SecurityAuditEngine, TenantContext } from "../../../gis-security/src";
import { GeoSphereSDKConfig } from "../types/web-sdk.types";
import { Coordinate } from "../../../../core/gis/types/geometry";

export class GeoSphereSDK {
  private readonly _config: GeoSphereSDKConfig;
  private readonly _tenantContext: TenantContext;
  private readonly _initializedAt: string;

  // 11 Core Platform Engine Instances
  public readonly location: LocationEngine;
  public readonly tracking: TrackingEngine;
  public readonly geofencing: GeofencingEngine;
  public readonly routing: RoutingEngine;
  public readonly forms: FormsEngine;
  public readonly tasks: TasksEngine;
  public readonly media: MediaEngine;
  public readonly notifications: NotificationEngine;
  public readonly analytics: SpatialAnalyticsEngine;
  public readonly offline: OfflineSyncEngine;
  public readonly security: SecurityAuditEngine;

  private constructor(config: GeoSphereSDKConfig) {
    this._config = { ...config };
    this._initializedAt = new Date().toISOString();

    this._tenantContext = {
      tenantId: config.tenantId,
      userId: config.userId,
      applicationId: config.applicationId,
      roles: config.roles ?? ["USER"],
      permissions: (config.permissions as any) ?? ["VIEW_FEATURE"],
      isSuperAdmin: config.isSuperAdmin ?? false,
    };

    // Instantiate all 11 platform engines
    this.security = new SecurityAuditEngine();
    this.location = new LocationEngine();
    this.tracking = new TrackingEngine();
    this.geofencing = new GeofencingEngine();
    this.routing = new RoutingEngine();
    this.forms = new FormsEngine();
    this.tasks = new TasksEngine();
    this.media = new MediaEngine();
    this.notifications = new NotificationEngine();
    this.analytics = new SpatialAnalyticsEngine();
    this.offline = new OfflineSyncEngine();

    // Log SDK initialization audit event
    this.security.logAuditEvent({
      tenantId: this._tenantContext.tenantId,
      userId: this._tenantContext.userId,
      action: "SDK_INITIALIZE",
      resource: "GeoSphereSDK_Master_Facade",
      metadata: { applicationId: config.applicationId },
    });
  }

  /**
   * Factory function to initialize master GeoSphereSDK facade
   */
  public static initialize(config: GeoSphereSDKConfig): GeoSphereSDK {
    if (!config || !config.tenantId || !config.userId) {
      throw new Error("[GEOSPHERE_SDK] Config must specify tenantId and userId");
    }
    return new GeoSphereSDK(config);
  }

  public get config(): GeoSphereSDKConfig {
    return { ...this._config };
  }

  public get tenantContext(): TenantContext {
    return { ...this._tenantContext };
  }

  public get initializedAt(): string {
    return this._initializedAt;
  }

  /**
   * Integrated Cross-Engine Pipeline Execution:
   * Location Point Acquisition -> Geofence Evaluation -> Notification Alert Dispatching
   */
  public async processLocationPipeline(
    subjectId: string,
    _coordinate?: Coordinate,
  ): Promise<{
    locationEvent: any;
    geofenceEvents: any[];
    dispatchedAlerts: any[];
  }> {
    // 1. Validate Security Access
    this.security.enforcePermission(this._tenantContext, "VIEW_FEATURE");

    // 2. Acquire Current Location Event
    const locationEvent = await this.location.getCurrentLocationEvent(subjectId);

    // 3. Evaluate Geofences
    const geofenceEvents = await this.geofencing.processLocationEvent(locationEvent);

    // 4. Dispatch Alerts for Geofence Events
    const dispatchedAlerts: any[] = [];
    for (const geoEvt of geofenceEvents) {
      const coord: Coordinate = [geoEvt.locationEvent.location.longitude, geoEvt.locationEvent.location.latitude];
      const notificationEventType =
        geoEvt.eventType === "ENTER"
          ? "GEOFENCE_ENTER"
          : geoEvt.eventType === "EXIT"
          ? "GEOFENCE_EXIT"
          : "GEOFENCE_DWELL";

      const results = await this.notifications.evaluateGeofenceEvent(
        notificationEventType,
        geoEvt.subjectId,
        geoEvt.geofenceId,
        coord,
      );
      dispatchedAlerts.push(...results);
    }

    return { locationEvent, geofenceEvents, dispatchedAlerts };
  }
}
