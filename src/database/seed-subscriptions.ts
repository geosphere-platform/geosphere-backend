/**
 * Phase 13 — Database Seed Script for Subscription Domain
 *
 * Populates DB with:
 * - 4 Commercial Plans: FREE, STARTER, PRO, ENTERPRISE
 * - 15 Generic Features
 * - PlanFeatures mappings
 * - PlanLimits configurations
 * - Organization Subscriptions (Acme Logistics → PRO, Beta Solutions → STARTER)
 */

import { eq } from "drizzle-orm";
import { db } from "./index";
import {
  plansTable,
  featuresTable,
  planFeaturesTable,
  planLimitsTable,
  subscriptionsTable,
  PLAN_STATUS,
  FEATURE_STATUS,
  SUBSCRIPTION_STATUS,
  FEATURE_CATEGORY,
  FEATURE_CODE,
  LIMIT_METRIC,
} from "./schema";

export async function seedSubscriptions(orgAId: string, orgBId: string) {
  console.log(
    "💳 Seeding Phase 13 Subscription Domain (Plans, Features, Limits, Subscriptions)...",
  );

  // 1. Seed Features
  const featureList = [
    {
      code: FEATURE_CODE.GIS_MAP,
      name: "GIS Map Base Engine",
      category: FEATURE_CATEGORY.GIS,
    },
    {
      code: FEATURE_CODE.GIS_LAYERS,
      name: "Layer Management",
      category: FEATURE_CATEGORY.GIS,
    },
    {
      code: FEATURE_CODE.SPATIAL_QUERY,
      name: "Spatial Query Engine",
      category: FEATURE_CATEGORY.GIS,
    },
    {
      code: FEATURE_CODE.SPATIAL_ANALYTICS,
      name: "Spatial Analytics Engine",
      category: FEATURE_CATEGORY.ANALYTICS,
    },
    {
      code: FEATURE_CODE.REALTIME,
      name: "Realtime Telemetry & Stream",
      category: FEATURE_CATEGORY.REALTIME,
    },
    {
      code: FEATURE_CODE.RULE_ENGINE,
      name: "Spatial Rules Engine",
      category: FEATURE_CATEGORY.AUTOMATION,
    },
    {
      code: FEATURE_CODE.WORKFLOW_ENGINE,
      name: "Workflow Engine",
      category: FEATURE_CATEGORY.AUTOMATION,
    },
    {
      code: FEATURE_CODE.ALERTS,
      name: "Spatial Alerts & Events",
      category: FEATURE_CATEGORY.AUTOMATION,
    },
    {
      code: FEATURE_CODE.DASHBOARDS,
      name: "GIS Dashboards",
      category: FEATURE_CATEGORY.CORE,
    },
    {
      code: FEATURE_CODE.API_ACCESS,
      name: "REST API Access",
      category: FEATURE_CATEGORY.API,
    },
    {
      code: FEATURE_CODE.MOBILE_SDK,
      name: "Mobile SDK Access",
      category: FEATURE_CATEGORY.SDK,
    },
    {
      code: FEATURE_CODE.WEB_SDK,
      name: "Web Map SDK Access",
      category: FEATURE_CATEGORY.SDK,
    },
    {
      code: FEATURE_CODE.EXPORT,
      name: "Spatial Data Export",
      category: FEATURE_CATEGORY.EXPORT,
    },
    {
      code: FEATURE_CODE.IMPORT,
      name: "Spatial Data Import",
      category: FEATURE_CATEGORY.INTEGRATION,
    },
    {
      code: FEATURE_CODE.ADVANCED_ANALYTICS,
      name: "Advanced Spatial Analytics",
      category: FEATURE_CATEGORY.ANALYTICS,
    },
  ];

  for (const f of featureList) {
    await db
      .insert(featuresTable)
      .values({
        code: f.code,
        name: f.name,
        category: f.category,
        status: FEATURE_STATUS.ACTIVE,
      })
      .onConflictDoNothing();
  }
  console.log(`   ✅ ${featureList.length} features seeded`);

  // 2. Seed Plans
  const plans = [
    {
      code: "FREE",
      name: "Free Tier",
      description: "Basic GIS capabilities for individuals and small teams",
      status: PLAN_STATUS.ACTIVE,
      isPublic: true,
      displayOrder: 1,
      monthlyPriceCents: 0,
      yearlyPriceCents: 0,
    },
    {
      code: "STARTER",
      name: "Starter Plan",
      description: "Essential GIS operations with realtime streaming",
      status: PLAN_STATUS.ACTIVE,
      isPublic: true,
      displayOrder: 2,
      monthlyPriceCents: 4900,
      yearlyPriceCents: 47000,
    },
    {
      code: "PRO",
      name: "Professional Plan",
      description: "Advanced spatial analytics, rule engine, and higher quotas",
      status: PLAN_STATUS.ACTIVE,
      isPublic: true,
      displayOrder: 3,
      monthlyPriceCents: 19900,
      yearlyPriceCents: 191000,
    },
    {
      code: "ENTERPRISE",
      name: "Enterprise Plan",
      description:
        "Custom limits, dedicated support, and full platform capabilities",
      status: PLAN_STATUS.ACTIVE,
      isPublic: true,
      displayOrder: 4,
      monthlyPriceCents: 49900,
      yearlyPriceCents: 479000,
    },
  ];

  const planMap: Record<string, string> = {};

  for (const p of plans) {
    const [inserted] = await db
      .insert(plansTable)
      .values(p)
      .onConflictDoNothing()
      .returning();

    if (inserted) {
      planMap[p.code] = inserted.id;
    } else {
      const [existing] = await db
        .select()
        .from(plansTable)
        .where(eq(plansTable.code, p.code))
        .limit(1);
      if (existing) planMap[p.code] = existing.id;
    }
  }
  console.log(`   ✅ ${Object.keys(planMap).length} plans seeded`);

  // 3. Seed PlanFeatures Assignments
  const planFeatureMatrix: Record<string, string[]> = {
    FREE: [
      FEATURE_CODE.GIS_MAP,
      FEATURE_CODE.GIS_LAYERS,
      FEATURE_CODE.SPATIAL_QUERY,
      FEATURE_CODE.DASHBOARDS,
      FEATURE_CODE.WEB_SDK,
    ],
    STARTER: [
      FEATURE_CODE.GIS_MAP,
      FEATURE_CODE.GIS_LAYERS,
      FEATURE_CODE.SPATIAL_QUERY,
      FEATURE_CODE.REALTIME,
      FEATURE_CODE.ALERTS,
      FEATURE_CODE.DASHBOARDS,
      FEATURE_CODE.API_ACCESS,
      FEATURE_CODE.WEB_SDK,
      FEATURE_CODE.EXPORT,
    ],
    PRO: [
      FEATURE_CODE.GIS_MAP,
      FEATURE_CODE.GIS_LAYERS,
      FEATURE_CODE.SPATIAL_QUERY,
      FEATURE_CODE.SPATIAL_ANALYTICS,
      FEATURE_CODE.REALTIME,
      FEATURE_CODE.RULE_ENGINE,
      FEATURE_CODE.WORKFLOW_ENGINE,
      FEATURE_CODE.ALERTS,
      FEATURE_CODE.DASHBOARDS,
      FEATURE_CODE.API_ACCESS,
      FEATURE_CODE.MOBILE_SDK,
      FEATURE_CODE.WEB_SDK,
      FEATURE_CODE.EXPORT,
      FEATURE_CODE.IMPORT,
      FEATURE_CODE.ADVANCED_ANALYTICS,
    ],
    ENTERPRISE: Object.values(FEATURE_CODE),
  };

  for (const [planCode, featureCodes] of Object.entries(planFeatureMatrix)) {
    const planId = planMap[planCode];
    if (!planId) continue;

    for (const code of featureCodes) {
      await db
        .insert(planFeaturesTable)
        .values({ planId, featureCode: code, isEnabled: true })
        .onConflictDoNothing();
    }
  }
  console.log("   ✅ Plan features mapped");

  // 4. Seed PlanLimits Configurations
  const planLimitMatrix: Record<
    string,
    Array<{ metricCode: string; value?: number; isUnlimited?: boolean }>
  > = {
    FREE: [
      { metricCode: LIMIT_METRIC.MAX_USERS, value: 3 },
      { metricCode: LIMIT_METRIC.MAX_WORKSPACES, value: 1 },
      { metricCode: LIMIT_METRIC.MAX_LAYERS, value: 5 },
      { metricCode: LIMIT_METRIC.MAX_SPATIAL_DATASETS, value: 2 },
      { metricCode: LIMIT_METRIC.MAX_RULES, value: 5 },
      { metricCode: LIMIT_METRIC.MAX_ALERTS, value: 20 },
      { metricCode: LIMIT_METRIC.MAX_API_REQUESTS, value: 10000 },
      { metricCode: LIMIT_METRIC.MAX_SPATIAL_QUERIES, value: 1000 },
      { metricCode: LIMIT_METRIC.MAX_REALTIME_CONNECTIONS, value: 0 },
      { metricCode: LIMIT_METRIC.MAX_STORAGE_BYTES, value: 1073741824 }, // 1GB
    ],
    STARTER: [
      { metricCode: LIMIT_METRIC.MAX_USERS, value: 10 },
      { metricCode: LIMIT_METRIC.MAX_WORKSPACES, value: 3 },
      { metricCode: LIMIT_METRIC.MAX_LAYERS, value: 25 },
      { metricCode: LIMIT_METRIC.MAX_SPATIAL_DATASETS, value: 10 },
      { metricCode: LIMIT_METRIC.MAX_RULES, value: 25 },
      { metricCode: LIMIT_METRIC.MAX_ALERTS, value: 100 },
      { metricCode: LIMIT_METRIC.MAX_API_REQUESTS, value: 100000 },
      { metricCode: LIMIT_METRIC.MAX_SPATIAL_QUERIES, value: 10000 },
      { metricCode: LIMIT_METRIC.MAX_REALTIME_CONNECTIONS, value: 25 },
      { metricCode: LIMIT_METRIC.MAX_STORAGE_BYTES, value: 10737418240 }, // 10GB
    ],
    PRO: [
      { metricCode: LIMIT_METRIC.MAX_USERS, value: 50 },
      { metricCode: LIMIT_METRIC.MAX_WORKSPACES, value: 10 },
      { metricCode: LIMIT_METRIC.MAX_LAYERS, value: 100 },
      { metricCode: LIMIT_METRIC.MAX_SPATIAL_DATASETS, value: 50 },
      { metricCode: LIMIT_METRIC.MAX_RULES, value: 100 },
      { metricCode: LIMIT_METRIC.MAX_ALERTS, value: 500 },
      { metricCode: LIMIT_METRIC.MAX_API_REQUESTS, value: 1000000 },
      { metricCode: LIMIT_METRIC.MAX_SPATIAL_QUERIES, value: 100000 },
      { metricCode: LIMIT_METRIC.MAX_REALTIME_CONNECTIONS, value: 100 },
      { metricCode: LIMIT_METRIC.MAX_STORAGE_BYTES, value: 107374182400 }, // 100GB
    ],
    ENTERPRISE: [
      { metricCode: LIMIT_METRIC.MAX_USERS, isUnlimited: true },
      { metricCode: LIMIT_METRIC.MAX_WORKSPACES, isUnlimited: true },
      { metricCode: LIMIT_METRIC.MAX_LAYERS, isUnlimited: true },
      { metricCode: LIMIT_METRIC.MAX_SPATIAL_DATASETS, isUnlimited: true },
      { metricCode: LIMIT_METRIC.MAX_RULES, isUnlimited: true },
      { metricCode: LIMIT_METRIC.MAX_ALERTS, isUnlimited: true },
      { metricCode: LIMIT_METRIC.MAX_API_REQUESTS, isUnlimited: true },
      { metricCode: LIMIT_METRIC.MAX_SPATIAL_QUERIES, isUnlimited: true },
      { metricCode: LIMIT_METRIC.MAX_REALTIME_CONNECTIONS, isUnlimited: true },
      { metricCode: LIMIT_METRIC.MAX_STORAGE_BYTES, isUnlimited: true },
    ],
  };

  for (const [planCode, limits] of Object.entries(planLimitMatrix)) {
    const planId = planMap[planCode];
    if (!planId) continue;

    for (const lim of limits) {
      await db
        .insert(planLimitsTable)
        .values({
          planId,
          metricCode: lim.metricCode,
          numericValue: lim.isUnlimited ? null : (lim.value ?? null),
          isUnlimited: lim.isUnlimited ?? false,
        })
        .onConflictDoNothing();
    }
  }
  console.log("   ✅ Plan limits configured");

  // 5. Seed Subscriptions for test Organizations
  const proPlanId = planMap["PRO"];
  const starterPlanId = planMap["STARTER"];

  if (proPlanId && orgAId) {
    await db
      .insert(subscriptionsTable)
      .values({
        organizationId: orgAId,
        planId: proPlanId,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        startsAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        endsAt: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000), // 335 days left
        billingInterval: "YEARLY",
        currency: "USD",
      })
      .onConflictDoNothing();
    console.log("   ✅ Acme Logistics subscribed to PRO plan");
  }

  if (starterPlanId && orgBId) {
    await db
      .insert(subscriptionsTable)
      .values({
        organizationId: orgBId,
        planId: starterPlanId,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        startsAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        endsAt: new Date(Date.now() + 350 * 24 * 60 * 60 * 1000),
        billingInterval: "YEARLY",
        currency: "USD",
      })
      .onConflictDoNothing();
    console.log("   ✅ Beta Solutions subscribed to STARTER plan");
  }
}
