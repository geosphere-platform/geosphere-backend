/**
 * Phase 16 — Database Seed Script for SDK Distribution & Licensing
 *
 * Populates DB with sample:
 * - 3 SDK Products (GIS Web SDK, GIS React SDK, GIS Mobile SDK)
 * - SDK Versions (stable, beta, deprecated, security-revoked samples)
 * - Sample Commercial Licenses
 * - Sample Package Credentials
 */

import { eq } from "drizzle-orm";
import { db } from "./index";
import {
  sdkProductsTable,
  sdkVersionsTable,
  sdkVersionCompatibilityTable,
  sdkLicensesTable,
  licenseEntitlementsTable,
  sdkAccessTable,
  packageCredentialsTable,
  SDK_PRODUCT_TYPE,
  SDK_PRODUCT_STATUS,
  SDK_VERSION_STATUS,
  SDK_CHANNEL,
  SDK_LICENSE_STATUS,
  SDK_LICENSE_TYPE,
  SDK_ACCESS_STATUS,
  PACKAGE_CREDENTIAL_STATUS,
} from "./schema/sdk-distribution";
import crypto from "crypto";

const DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000001";

export async function seedSdkDistribution() {
  console.log("🌱 Seeding Phase 16 SDK Distribution data...");

  try {
    // 1. Create SDK Products
    const [webSdk] = await db
      .insert(sdkProductsTable)
      .values({
        name: "GIS Web SDK",
        slug: "gis-web-sdk",
        description:
          "Core JavaScript/TypeScript SDK for web mapping and spatial analytics",
        productType: SDK_PRODUCT_TYPE.WEB_SDK,
        status: SDK_PRODUCT_STATUS.ACTIVE,
        packageScope: "@gis-platform",
        metadata: { docsUrl: "/developer/docs/web-sdk" },
      })
      .onConflictDoNothing()
      .returning();

    const [reactSdk] = await db
      .insert(sdkProductsTable)
      .values({
        name: "GIS React SDK",
        slug: "gis-react-sdk",
        description: "React components and hooks wrapper for GIS Web SDK",
        productType: SDK_PRODUCT_TYPE.WEB_SDK,
        status: SDK_PRODUCT_STATUS.ACTIVE,
        packageScope: "@gis-platform",
        metadata: { docsUrl: "/developer/docs/react-sdk" },
      })
      .onConflictDoNothing()
      .returning();

    const [mobileSdk] = await db
      .insert(sdkProductsTable)
      .values({
        name: "GIS Mobile SDK",
        slug: "gis-mobile-sdk",
        description: "Native mobile GIS SDK for iOS and Android apps",
        productType: SDK_PRODUCT_TYPE.MOBILE_SDK,
        status: SDK_PRODUCT_STATUS.ACTIVE,
        packageScope: "@gis-platform",
        metadata: { docsUrl: "/developer/docs/mobile-sdk" },
      })
      .onConflictDoNothing()
      .returning();

    const productId = webSdk?.id;
    if (!productId) {
      console.log("ℹ️ SDK Products already exist. Skipping version seeding.");
      return;
    }

    // 2. Create SDK Versions for GIS Web SDK
    const [v100] = await db
      .insert(sdkVersionsTable)
      .values({
        productId,
        version: "1.0.0",
        status: SDK_VERSION_STATUS.DEPRECATED,
        channel: SDK_CHANNEL.STABLE,
        releaseDate: new Date("2025-01-15"),
        deprecatedAt: new Date("2026-06-01"),
        minimumApiVersion: "v1",
        packageName: "@gis-platform/gis-web-sdk",
        packageRegistry: "github-packages",
        checksum:
          "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        releaseNotes: "Initial commercial release of GIS Web SDK",
        recommendedVersion: "1.2.0",
      })
      .returning();

    const [v120] = await db
      .insert(sdkVersionsTable)
      .values({
        productId,
        version: "1.2.0",
        status: SDK_VERSION_STATUS.RELEASED,
        channel: SDK_CHANNEL.STABLE,
        releaseDate: new Date("2026-06-15"),
        minimumApiVersion: "v1",
        packageName: "@gis-platform/gis-web-sdk",
        packageRegistry: "github-packages",
        checksum:
          "a4c28f1189fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b866",
        releaseNotes:
          "Performance improvements, real-time spatial support, vector tile engine v2",
      })
      .returning();

    const [v130beta] = await db
      .insert(sdkVersionsTable)
      .values({
        productId,
        version: "1.3.0-beta.1",
        status: SDK_VERSION_STATUS.RELEASE_CANDIDATE,
        channel: SDK_CHANNEL.BETA,
        preRelease: "beta.1",
        minimumApiVersion: "v1",
        packageName: "@gis-platform/gis-web-sdk",
        packageRegistry: "github-packages",
        checksum:
          "b5d39f2290fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b877",
        releaseNotes:
          "Beta release introducing 3D terrain rendering and advanced spatial analysis",
      })
      .returning();

    // 3. API Compatibility
    if (v120?.id) {
      await db.insert(sdkVersionCompatibilityTable).values({
        versionId: v120.id,
        apiVersion: "v1",
        isFullySupported: true,
        notes: "Fully compatible with Platform API v1",
      });
    }

    // 4. Sample Commercial License for Default Org
    const rawKey = `LIC-GISWEB-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
    const keyPrefix = rawKey.slice(0, 16);

    const [license] = await db
      .insert(sdkLicensesTable)
      .values({
        organizationId: DEFAULT_ORG_ID,
        productId,
        status: SDK_LICENSE_STATUS.ACTIVE,
        licenseType: SDK_LICENSE_TYPE.SUBSCRIPTION,
        licenseKeyPrefix: keyPrefix,
        licenseKeyHash: keyHash,
        startsAt: new Date("2026-01-01"),
        expiresAt: new Date("2027-01-01"),
      })
      .returning();

    // 5. License Entitlements
    if (license?.id) {
      await db.insert(licenseEntitlementsTable).values([
        { licenseId: license.id, featureCode: "GIS_MAP", isEnabled: true },
        { licenseId: license.id, featureCode: "GIS_LAYERS", isEnabled: true },
        {
          licenseId: license.id,
          featureCode: "SPATIAL_QUERY",
          isEnabled: true,
        },
        { licenseId: license.id, featureCode: "REALTIME", isEnabled: true },
        { licenseId: license.id, featureCode: "WEB_SDK", isEnabled: true },
      ]);
    }

    console.log("✅ Phase 16 SDK Distribution seeding complete!");
  } catch (err) {
    console.error("❌ Failed to seed SDK Distribution data:", err);
  }
}
