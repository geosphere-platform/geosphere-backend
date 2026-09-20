/**
 * Phase 15 — Database Seed Script for Developer Portal & Application Registration
 *
 * Populates DB with:
 * - 10 Standard API Scopes
 * - Sample Applications (Web Dashboard, Mobile App, Backend Integration)
 * - Sample Scopes mapping
 * - Sample Commercial Licenses
 */

import { eq } from "drizzle-orm";
import { db } from "./index";
import {
  scopesTable,
  applicationsTable,
  applicationScopesTable,
  apiKeysTable,
  licensesTable,
  API_SCOPE,
  APPLICATION_TYPE,
  APPLICATION_STATUS,
  APPLICATION_ENVIRONMENT,
  API_KEY_STATUS,
  LICENSE_STATUS,
} from "./schema";
import crypto from "crypto";

export const INITIAL_API_SCOPES = [
  {
    code: API_SCOPE.GIS_READ,
    name: "Read GIS Data",
    description: "Allows reading maps, spatial features, and vector data",
    category: "GIS",
  },
  {
    code: API_SCOPE.GIS_WRITE,
    name: "Write GIS Data",
    description: "Allows creating, updating, and deleting spatial features",
    category: "GIS",
  },
  {
    code: API_SCOPE.LAYERS_READ,
    name: "Read Map Layers",
    description: "Allows accessing map layers, styles, and tile definitions",
    category: "GIS",
  },
  {
    code: API_SCOPE.LAYERS_WRITE,
    name: "Manage Map Layers",
    description: "Allows creating and modifying custom map layers",
    category: "GIS",
  },
  {
    code: API_SCOPE.TRACKING_READ,
    name: "Read Real-time Tracking",
    description: "Allows accessing current location and track history",
    category: "REALTIME",
  },
  {
    code: API_SCOPE.TRACKING_WRITE,
    name: "Ingest Location Data",
    description: "Allows ingesting position updates for tracked entities",
    category: "REALTIME",
  },
  {
    code: API_SCOPE.GEOFENCE_READ,
    name: "Read Geofences",
    description: "Allows querying geofence zones and boundaries",
    category: "GIS",
  },
  {
    code: API_SCOPE.GEOFENCE_WRITE,
    name: "Manage Geofences",
    description: "Allows defining and updating geofence zones",
    category: "GIS",
  },
  {
    code: API_SCOPE.ANALYTICS_READ,
    name: "Read Spatial Analytics",
    description: "Allows querying spatial statistics and aggregation metrics",
    category: "ANALYTICS",
  },
  {
    code: API_SCOPE.REALTIME_CONNECT,
    name: "Connect to Realtime Streams",
    description: "Allows establishing WebSocket / SSE realtime streams",
    category: "REALTIME",
  },
];

export async function seedDeveloperPortal(orgId?: string) {
  console.log(
    "🔑 Seeding Phase 15 Developer Portal (API Scopes, Applications, Keys)...",
  );

  // 1. Seed API Scopes
  for (const scope of INITIAL_API_SCOPES) {
    const existing = await db
      .select()
      .from(scopesTable)
      .where(eq(scopesTable.code, scope.code));

    if (existing.length === 0) {
      await db.insert(scopesTable).values({
        code: scope.code,
        name: scope.name,
        description: scope.description,
        category: scope.category,
        status: "ACTIVE",
      });
    }
  }

  // 2. If Organization ID is provided, seed sample apps
  if (orgId) {
    const appSlug = "sample-logistics-web-app";
    const existingApp = await db
      .select()
      .from(applicationsTable)
      .where(eq(applicationsTable.slug, appSlug));

    let appId: string;
    if (existingApp.length === 0) {
      const clientId = `app_dev_${crypto.randomBytes(8).toString("hex")}`;
      const [newApp] = await db
        .insert(applicationsTable)
        .values({
          organizationId: orgId,
          name: "Sample Logistics Web App",
          slug: appSlug,
          description:
            "Sample web application registered for GIS SDK integration",
          type: APPLICATION_TYPE.WEB,
          environment: APPLICATION_ENVIRONMENT.DEVELOPMENT,
          status: APPLICATION_STATUS.ACTIVE,
          clientId,
          allowedOrigins: ["http://localhost:3000", "http://localhost:3500"],
        })
        .returning();
      appId = newApp.id;

      // Assign all scopes to sample app
      for (const scope of INITIAL_API_SCOPES) {
        await db.insert(applicationScopesTable).values({
          applicationId: appId,
          scopeCode: scope.code,
        });
      }

      // Seed a sample development API key
      const keyId = `key_${crypto.randomBytes(8).toString("hex")}`;
      const secretKey = `gsk_dev_${crypto.randomBytes(24).toString("hex")}`;
      const prefix = secretKey.slice(0, 16);
      const hash = crypto.createHash("sha256").update(secretKey).digest("hex");

      await db.insert(apiKeysTable).values({
        applicationId: appId,
        organizationId: orgId,
        name: "Default Development Key",
        keyId,
        prefix,
        hash,
        environment: APPLICATION_ENVIRONMENT.DEVELOPMENT,
        status: API_KEY_STATUS.ACTIVE,
      });

      // Seed a sample license
      await db.insert(licensesTable).values({
        organizationId: orgId,
        applicationId: appId,
        licenseKey: `LIC-GIS-SDK-${crypto.randomBytes(8).toString("hex").toUpperCase()}`,
        productName: "GIS Web SDK Pro",
        status: LICENSE_STATUS.ACTIVE,
        maxSeats: 50,
      });
    }
  }

  console.log("✅ Developer Portal seed complete.");
}
