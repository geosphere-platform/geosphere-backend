import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { db } from "@/database";
import { applicationsTable } from "@/database/schema/application-builder";
import { eq, and } from "drizzle-orm";
import { memoryApplicationsStore } from "@/features/application-builder/services/application-store";

export const GET = withAuth(async (ctx: AuthContext) => {
  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const { searchParams } = new URL(ctx.request.url);
  const appId = searchParams.get("appId") || "fieldservice";
  const clientSdkVersion = searchParams.get("sdkVersion") || "2.1.0";
  const clientCapabilities = searchParams.get("capabilities")?.split(",") || [
    "MAP",
    "LOCATION",
    "OFFLINE",
    "FORMS",
    "TASKS",
  ];

  try {
    let matchedApp: any = null;

    // Attempt DB query
    try {
      const apps = await db
        .select()
        .from(applicationsTable)
        .where(and(eq(applicationsTable.tenantId, tenantId)));

      matchedApp =
        apps.find(
          (a) => a.code.toLowerCase() === appId.toLowerCase() || a.id === appId,
        ) || apps[0];
    } catch (e) {
      // Ignore DB error, check memory store
    }

    if (!matchedApp) {
      const memApps = Array.from(memoryApplicationsStore.values()).filter(
        (a) => a.tenantId === tenantId,
      );
      matchedApp =
        memApps.find(
          (a) => a.code.toLowerCase() === appId.toLowerCase() || a.id === appId,
        ) || memApps[0];
    }

    if (matchedApp && matchedApp.configuration) {
      const fullConfig = matchedApp.configuration as any;

      // Filter enabled modules against client SDK capabilities for backward compatibility
      const supportedModules = fullConfig.modules
        ? fullConfig.modules.filter(
            (m: string) => clientCapabilities.includes(m) || m === "MAP",
          )
        : ["MAP", "LOCATION", "OFFLINE", "FORMS", "TASKS"];

      const responseConfig = {
        appId: matchedApp.code,
        applicationId: matchedApp.id,
        tenantId: matchedApp.tenantId,
        appName: matchedApp.name,
        version: matchedApp.version,
        status: matchedApp.status,
        environment: matchedApp.environment,
        modules: supportedModules,
        branding: fullConfig.branding,
        mapConfig: fullConfig.mapConfig,
        locationConfig: fullConfig.locationConfig,
        layers: fullConfig.layers,
        forms: fullConfig.forms,
        workflows: fullConfig.workflows,
        featureFlags: fullConfig.featureFlags,
        offlineConfig: fullConfig.offlineConfig,
        notifications: fullConfig.notifications,
        dashboards: fullConfig.dashboards,
      };

      return ApiResponse.success(responseConfig, 200);
    }

    // Default fallback configuration for initial bootstrap
    const fallbackConfig = {
      appId,
      tenantId,
      appName: "Enterprise Mobile GIS",
      version: 1,
      status: "PUBLISHED",
      environment: "PRODUCTION",
      modules: [
        "MAP",
        "LOCATION",
        "OFFLINE",
        "SYNC",
        "FORMS",
        "TASKS",
        "GEOFENCE",
        "MEDIA",
      ],
      branding: {
        appTitle: "GIS Mobile Suite",
        primaryColor: "#0F172A",
        accentColor: "#3B82F6",
        logoUrl: "https://gis.platform.internal/assets/logo.png",
        darkMode: true,
      },
      mapConfig: {
        initialCenter: [-74.006, 40.7128],
        zoom: 12,
        minZoom: 2,
        maxZoom: 18,
        vectorTileUrl: "/api/v1/tiles/{layerId}/{z}/{x}/{y}",
        defaultStyle: "DARK_VECTOR",
      },
      locationConfig: {
        trackingProfile: "BALANCED",
        intervalSeconds: 15,
        distanceFilterMeters: 10,
        batchSize: 20,
        allowBackgroundTracking: true,
      },
      layers: [
        {
          id: "assets_layer",
          name: "Field Assets",
          geometryType: "Point",
          enabled: true,
        },
        {
          id: "parcels_layer",
          name: "Land Parcels",
          geometryType: "Polygon",
          enabled: true,
        },
        {
          id: "routes_layer",
          name: "Service Routes",
          geometryType: "LineString",
          enabled: true,
        },
      ],
      featureFlags: {
        offlineMapsEnabled: true,
        deltaSyncEnabled: true,
        resumableMediaUploads: true,
        geofenceAlerts: true,
      },
    };

    return ApiResponse.success(fallbackConfig, 200);
  } catch (error: any) {
    return ApiResponse.error(
      error.message || "Failed to fetch mobile configuration",
      500,
    );
  }
});
