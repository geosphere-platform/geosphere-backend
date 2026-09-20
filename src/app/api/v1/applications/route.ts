import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { db } from "@/database";
import { applicationsTable } from "@/database/schema/application-builder";
import { eq } from "drizzle-orm";
import { INITIAL_APPLICATION_TEMPLATES } from "@/database/seed-application-builder";
import { memoryApplicationsStore } from "@/features/application-builder/services/application-store";

export const GET = withAuth(async (ctx: AuthContext) => {
  const tenantId = ctx.user.orgId ?? "default-tenant-0000";

  try {
    const apps = await db
      .select()
      .from(applicationsTable)
      .where(eq(applicationsTable.tenantId, tenantId));

    if (apps && apps.length > 0) {
      return ApiResponse.success({ applications: apps }, 200);
    }
  } catch (error: any) {
    // Fallback
  }

  const userApps = Array.from(memoryApplicationsStore.values()).filter(
    (a) => a.tenantId === tenantId,
  );
  return ApiResponse.success({ applications: userApps }, 200);
});

export const POST = withAuth(async (ctx: AuthContext) => {
  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const body = await ctx.request.json();

  const { name, code, description, templateCode, environment, platform } = body;

  if (!name || !code) {
    return ApiResponse.error("Application name and code are required", 400);
  }

  let initialConfig: any = {
    branding: {
      appTitle: name,
      primaryColor: "#0F172A",
      accentColor: "#3B82F6",
      darkMode: true,
    },
    modules: ["MAP", "GIS_LAYERS", "LOCATION", "OFFLINE"],
    layers: [
      {
        id: "default_vector_layer",
        name: "Default Vector Layer",
        geometryType: "Point",
        enabled: true,
      },
    ],
    mapConfig: {
      initialCenter: [-74.006, 40.7128],
      zoom: 12,
      minZoom: 2,
      maxZoom: 18,
      vectorTileUrl: "/api/v1/tiles/{layerId}/{z}/{x}/{y}",
      defaultStyle: "DARK_VECTOR",
    },
    forms: [],
    workflows: [],
    featureFlags: {
      offlineMapsEnabled: true,
      backgroundTracking: true,
    },
    permissions: {},
    locationConfig: {
      trackingProfile: "BALANCED",
      intervalSeconds: 15,
      batchSize: 20,
    },
    offlineConfig: {
      autoDownloadPackages: false,
      maxStorageBytes: 1073741824,
    },
    notifications: [],
    dashboards: [],
    reports: [],
  };

  if (templateCode) {
    const template = INITIAL_APPLICATION_TEMPLATES.find(
      (t) => t.code === templateCode,
    );
    if (template) {
      initialConfig = JSON.parse(JSON.stringify(template.defaultConfiguration));
      initialConfig.branding.appTitle = name;
    }
  }

  const appRecord = {
    id: `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tenantId,
    name,
    code,
    description: description || null,
    environment: environment || "PRODUCTION",
    platform: platform || "BOTH",
    status: "DRAFT",
    version: 1,
    configuration: initialConfig,
    createdBy: ctx.user.sub,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  memoryApplicationsStore.set(appRecord.id, appRecord);

  try {
    const [newApp] = await db
      .insert(applicationsTable)
      .values({
        tenantId,
        name,
        code,
        description: description || null,
        environment: environment || "PRODUCTION",
        platform: platform || "BOTH",
        status: "DRAFT",
        version: 1,
        configuration: initialConfig,
        createdBy: ctx.user.sub,
      })
      .returning();

    memoryApplicationsStore.set(newApp.id, newApp);
    return ApiResponse.success({ application: newApp }, 201);
  } catch (error: any) {
    // Fallback to memory store
    return ApiResponse.success({ application: appRecord }, 201);
  }
});
