import { runDashboardUnitTests } from "./unit/dashboard.unit.test";
import { runDashboardApiTests } from "./api/dashboard.api.test";
import { runDashboardSecurityTests } from "./security/dashboard.security.test";
import { runDashboardUiTests } from "./ui/dashboard.ui.test";
import { runDashboardGisTests } from "./gis/dashboard.gis.test";
import { runGisCoreUnitTests } from "./unit/gis.core.unit.test";
import { runPureGisEngineUnitTests } from "./unit/gis.engine.pure.unit.test";
import { runMapAdapterUnitTests } from "./unit/gis.map-adapter.unit.test";
import { runLocationEnginePureUnitTests } from "./unit/gis.location-engine.pure.unit.test";
import { runTrackingEnginePureUnitTests } from "./unit/gis.tracking-engine.pure.unit.test";
import { runGeofencingEnginePureUnitTests } from "./unit/gis.geofencing-engine.pure.unit.test";
import { runRoutingEnginePureUnitTests } from "./unit/gis.routing-engine.pure.unit.test";
import { runFormsEnginePureUnitTests } from "./unit/gis.forms-engine.pure.unit.test";
import { runTasksEnginePureUnitTests } from "./unit/gis.tasks-engine.pure.unit.test";
import { runMediaEnginePureUnitTests } from "./unit/gis.media-engine.pure.unit.test";
import { runNotificationsEnginePureUnitTests } from "./unit/gis.notifications-engine.pure.unit.test";
import { runSpatialAnalyticsEnginePureUnitTests } from "./unit/gis.analytics-engine.pure.unit.test";
import { runOfflineSyncEnginePureUnitTests } from "./unit/gis.offline-engine.pure.unit.test";
import { runSecurityEnginePureUnitTests } from "./unit/gis.security-engine.pure.unit.test";
import { runWebSDKProductizationUnitTests } from "./unit/web-sdk.productization.unit.test";
import { runApplicationBuilderProductizationUnitTests } from "./unit/builder.productization.unit.test";
import { runHighScaleLoadSimulationTests } from "./performance/high-scale.load-simulation.test";
import { runMobileBackendInfrastructureIntegrationTests } from "./integration/mobile.backend-infrastructure.integration.test";
import { runDependencyLeakageTests } from "./architecture/dependency-leakage.test";
import { runModuleRegistryUnitTests } from "./unit/module.registry.unit.test";
import { runTenantRbacUnitTests } from "./unit/tenant.rbac.unit.test";
import { runBoundingBoxUnitTests } from "./unit/gis.bbox.unit.test";
import { runSpatialUtilsUnitTests } from "./unit/gis.spatial-utils.unit.test";
import { runGeometryValidationUnitTests } from "./unit/gis.validation.unit.test";
import { runGisSdkUnitTests } from "./unit/gis.sdk.unit.test";
import { runGisSdkIntegrationTests } from "./integration/gis.sdk.integration.test";
import { runSpatialServiceUnitTests } from "./unit/gis.spatial-service.unit.test";
import { runPostGisIntegrationTests } from "./integration/gis.postgis.integration.test";
import { runPostGisPerformanceTests } from "./performance/gis.postgis-performance.test";
import { runAllRolesCredentialsUnitTest } from "./unit/tenant.rbac-roles.unit.test";
import { runVisualizationEngineUnitTests } from "./unit/gis.visualization-engine.unit.test";
import { runVisualizationEngineIntegrationTests } from "./integration/gis.visualization-engine.integration.test";
import { runVisualizationPerformanceTests } from "./performance/gis.visualization-performance.test";
import { runOperationsValidationUnitTests } from "./unit/gis.operations-validation.unit.test";
import { runSpatialMeasurementUnitTests } from "./unit/gis.spatial-measurement.unit.test";
import { runGeofenceEngineUnitTests } from "./unit/gis.geofence-engine.unit.test";
import { runRealWorldScenariosTest } from "./integration/gis.real-world-scenarios.integration.test";
import { runLocationValidationUnitTests } from "./unit/gis.location-validation.unit.test";
import { runOutOfOrderCurrentPositionUnitTests } from "./unit/gis.out-of-order-current-position.unit.test";
import { runRealtimeEventPublisherUnitTests } from "./unit/gis.realtime-event-publisher.unit.test";
import { runRealtimeEngineIntegrationTests } from "./integration/gis.realtime-engine.integration.test";
import { runRealtimeLoadSimulationTests } from "./performance/gis.realtime-load-simulation.test";
// Phase 10 — GIS Query, Search & Spatial Analytics Engine
import { runSpatialQueryUnitTests } from "./unit/gis.spatial-query.unit.test";
import { runSpatialHistoryUnitTests } from "./unit/gis.spatial-history.unit.test";
import { runSpatialAnalyticsUnitTests } from "./unit/gis.spatial-analytics.unit.test";
import { runSpatialQueryIntegrationTests } from "./integration/gis.spatial-query.integration.test";
import { runQuerySecurityTests } from "./security/gis.query-security.test";

// Phase 11 — Generic GIS Rules, Automation & Workflow Engine
import { runRulesEvaluatorUnitTests } from "./unit/gis.rules-evaluator.unit.test";
import { runRulesSecurityTests } from "./security/gis.rules-security.test";
import { runRulesEngineIntegrationTests } from "./integration/gis.rules-engine.integration.test";

// Phase 12 — Multi-Tenant SaaS Organization, Workspace & Customer Management
import { runOrganizationUnitTests } from "./unit/tenant.organization.unit.test";
import { runWorkspaceUnitTests } from "./unit/tenant.workspace.unit.test";
import { runInvitationUnitTests } from "./unit/tenant.invitation.unit.test";
import { runTenantSaaSIntegrationTests } from "./integration/tenant.saas.integration.test";
import { runTenantIsolationSecurityTests } from "./security/tenant.isolation.security.test";
import { runTenantSaaSLoadSimulationTests } from "./performance/tenant.saas-load-simulation.test";

// Phase 13 — Subscription, Plans, Feature Entitlements & Usage Management
import { runSubscriptionEntitlementUnitTests } from "./unit/subscription.entitlement.unit.test";
import { runSubscriptionUsageUnitTests } from "./unit/subscription.usage.unit.test";
import { runSubscriptionSecurityUnitTests } from "./security/subscription.security.test";

// Phase 14 — Reusable GIS SDK / Library Platform
import { runGisSdkCoreUnitTests } from "./unit/gis.sdk-core.unit.test";
import { runGisSdkMapUnitTests } from "./unit/gis.sdk-map.unit.test";
import { runGisSdkServicesUnitTests } from "./unit/gis.sdk-services.unit.test";
import { runGisSdkPerformanceTests } from "./performance/gis.sdk-performance.test";
import { runSecurityVerificationTests } from "./security/security.verification.test";

// Phase 15 — Developer Portal, Application Registration, API Keys & License Foundation
import { runDeveloperApplicationUnitTests } from "./unit/developer.application.unit.test";
import { runDeveloperApiKeyUnitTests } from "./unit/developer.apikey.unit.test";
import { runDeveloperLicenseUnitTests } from "./unit/developer.license.unit.test";
import { runDeveloperPortalIntegrationTests } from "./integration/developer.portal.integration.test";
import { runDeveloperSecurityTests } from "./security/developer.security.test";
import { runDeveloperPerformanceTests } from "./performance/developer.performance.test";

// Phase 16 — Private SDK Distribution, License Management & Package Access Control
import { runSdkDistributionUnitTests } from "./unit/sdk.distribution.unit.test";
import { runSdkSecurityTests } from "./security/sdk.security.test";
import { runSdkDistributionIntegrationTests } from "./integration/sdk.integration.test";

// Phase 17 — Production Deployment, Scalability, Security & High Availability
import { runProductionInfrastructureUnitTests } from "./unit/production.infrastructure.unit.test";
import { runProductionTenantIsolationSecurityTests } from "./security/tenant.production-isolation.test";
import { runFullProductionCapacityBenchmark } from "./performance/production.load.test";

// Phase 18 — Advanced GIS Data Processing, Vector Tiles, Large Datasets & High-Performance Map Rendering
import { runVectorTilesUnitTests } from "./unit/gis.vector-tiles.unit.test";
import { runSpatialClusteringUnitTests } from "./unit/gis.spatial-clustering.unit.test";
import { runVectorTilesIntegrationTests } from "./integration/gis.vector-tiles.integration.test";
import { runLargeDatasetsPerformanceBenchmark } from "./performance/gis.large-datasets-performance.test";

// Phase 19 — Kotlin Multiplatform Mobile GIS SDK & Data-Driven Mobile Platform
import { runMobileBackendUnitTests } from "./mobile/mobile-backend.test";
import { run600UserLoadSimulationTests } from "./mobile/600-user-load.test";
import { runPhase19LiveVerification } from "./live-phase19-verification";

// Phase 20 — Customer Application Builder, Data-Driven Business Module Composer & White-Label Configuration
import { runPhase20LiveVerification } from "./live-phase20-verification";

// Phase 21 — Live Tracking Operations Screen (Screen #26) & Modular GPS Architecture
import { runLiveTrackingFeatureTests } from "./ui/live-tracking.test";
import { runGpsAdaptersUnitTests } from "./unit/gps-adapters.unit.test";
import { runGpsSimulatorUnitTests } from "./unit/gps-simulator.unit.test";
import { runGpsTelemetryApiTests } from "./api/gps-telemetry.api.test";
import { runMobileGpsSyncApiTests } from "./api/mobile-gps-sync.api.test";
import { runDashboardFullscreenTests } from "./ui/dashboard-fullscreen.test";
import { runVehiclesManagementUnitTests } from "./unit/vehicles.management.unit.test";
import { runVehiclesUiTests } from "./ui/vehicles.ui.test";
import { runGeofenceManagementUnitTests } from "./unit/geofence.management.unit.test";
import { runGeofenceUiTests } from "./ui/geofence.ui.test";
import { runGeofenceAdminBoundariesUnitTests } from "./unit/geofence.admin-boundaries.unit.test";
import { runGeofenceAdminBoundariesUiTests } from "./ui/geofence.admin-boundaries.ui.test";
import { runBoundaryResolverServiceUnitTests } from "./unit/boundary-resolver.service.unit.test";
import { runReportsAndAuditUnitTests } from "./unit/reports-audit.unit.test";

export async function runAllPlatformTests() {
  console.log("==========================================");
  console.log("RUNNING PLATFORM TEST SUITE");
  console.log("==========================================");

  try {
    process.stdout.write("1. Running GIS Core Primitives Tests... ");
    runGisCoreUnitTests();
    runPureGisEngineUnitTests();
    runMapAdapterUnitTests();
    runLocationEnginePureUnitTests();
    runTrackingEnginePureUnitTests();
    await runGeofencingEnginePureUnitTests();
    await runRoutingEnginePureUnitTests();
    await runFormsEnginePureUnitTests();
    await runTasksEnginePureUnitTests();
    await runMediaEnginePureUnitTests();
    await runNotificationsEnginePureUnitTests();
    await runSpatialAnalyticsEnginePureUnitTests();
    await runOfflineSyncEnginePureUnitTests();
    await runSecurityEnginePureUnitTests();
    await runWebSDKProductizationUnitTests();
    await runApplicationBuilderProductizationUnitTests();
    await runHighScaleLoadSimulationTests();
    await runMobileBackendInfrastructureIntegrationTests();
    runDependencyLeakageTests();
    console.log("✅ PASSED");

    process.stdout.write("2. Running BoundingBox & BBOX Utility Tests... ");
    runBoundingBoxUnitTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "3. Running Spatial Calculations (Haversine & Bearing) Tests... ",
    );
    runSpatialUtilsUnitTests();
    console.log("✅ PASSED");

    process.stdout.write("4. Running Structured Geometry Validation Tests... ");
    runGeometryValidationUnitTests();
    console.log("✅ PASSED");

    process.stdout.write("5. Running Module System Registry Tests... ");
    runModuleRegistryUnitTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "6. Running Multi-Tenant & RBAC Role Credentials Tests... ",
    );
    runTenantRbacUnitTests();
    runAllRolesCredentialsUnitTest();
    console.log("✅ PASSED");

    process.stdout.write("7. Running Dashboard Unit Tests... ");
    runDashboardUnitTests();
    console.log("✅ PASSED");

    process.stdout.write("8. Running Dashboard API Tests... ");
    runDashboardApiTests();
    console.log("✅ PASSED");

    process.stdout.write("9. Running Security & Tenant Boundary Tests... ");
    await runDashboardSecurityTests();
    console.log("✅ PASSED");

    process.stdout.write("10. Running UI Component Tests... ");
    runDashboardUiTests();
    console.log("✅ PASSED");

    process.stdout.write("11. Running OpenLayers GIS Engine Tests... ");
    runDashboardGisTests();
    console.log("✅ PASSED");

    process.stdout.write("12. Running GIS Map SDK Unit Tests... ");
    runGisSdkUnitTests();
    console.log("✅ PASSED");

    process.stdout.write("13. Running GIS Map SDK Integration Tests... ");
    await runGisSdkIntegrationTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "14. Running Spatial Data Service Unit & Validation Tests... ",
    );
    runSpatialServiceUnitTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "15. Running PostGIS Spatial Integration Tests (ST_*, KNN)... ",
    );
    await runPostGisIntegrationTests();
    console.log("✅ PASSED");

    process.stdout.write("16. Running PostGIS Query Performance Tests... ");
    await runPostGisPerformanceTests();
    console.log("✅ PASSED");

    process.stdout.write("17. Running Visualization Engine Unit Tests... ");
    runVisualizationEngineUnitTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "18. Running Visualization Engine Integration Tests... ",
    );
    await runVisualizationEngineIntegrationTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "19. Running Visualization Engine Performance Tests (1k, 5k, 10k features)... ",
    );
    await runVisualizationPerformanceTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "20. Running Geospatial Operations Validation Unit Tests... ",
    );
    runOperationsValidationUnitTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "21. Running Spatial Measurement (Distance, Area, Centroid, BBOX) Tests... ",
    );
    await runSpatialMeasurementUnitTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "22. Running Geofence Engine & State Transition Simulator Tests... ",
    );
    await runGeofenceEngineUnitTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "23. Running Real-World Scenarios Integration Tests (Logistics, Farm Plots, Buffers)... ",
    );
    await runRealWorldScenariosTest();
    console.log("✅ PASSED");

    // ─────────────────────────────────────────────────────────────
    // Phase 9 — Real-Time Spatial Data & Event Engine
    // ─────────────────────────────────────────────────────────────

    process.stdout.write(
      "24. Running Location Validation & Normalization Unit Tests... ",
    );
    runLocationValidationUnitTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "25. Running Out-of-Order Position Suppression Unit Tests... ",
    );
    await runOutOfOrderCurrentPositionUnitTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "26. Running Realtime Event Publisher (Channel Routing, Fan-out, Isolation) Unit Tests... ",
    );
    await runRealtimeEventPublisherUnitTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "27. Running Realtime Spatial Engine Integration Tests (Ingestion → Geofence → Events)... ",
    );
    await runRealtimeEngineIntegrationTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "28. Running Real-Time Load Simulation (15×5 subjects, publisher fan-out)... ",
    );

    await runRealtimeLoadSimulationTests();
    console.log("✅ PASSED");

    // ─────────────────────────────────────────────────────────────
    // Phase 10 — GIS Query, Search & Spatial Analytics Engine
    // ─────────────────────────────────────────────────────────────

    process.stdout.write(
      "29. Running Spatial Query & Filter Validation Unit Tests... ",
    );
    runSpatialQueryUnitTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "30. Running Spatial History & Track Analytics Unit Tests... ",
    );
    runSpatialHistoryUnitTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "31. Running Spatial Analytics Container & Export Unit Tests... ",
    );
    runSpatialAnalyticsUnitTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "32. Running PostGIS Spatial Query & Analytics Engine Integration Tests... ",
    );
    await runSpatialQueryIntegrationTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "33. Running Spatial Query Security, SQL Injection & Tenant Boundary Tests... ",
    );
    await runQuerySecurityTests();
    console.log("✅ PASSED");

    // ─────────────────────────────────────────────────────────────
    // Phase 11 — Generic GIS Rules, Automation & Workflow Engine
    // ─────────────────────────────────────────────────────────────

    process.stdout.write(
      "34. Running GIS Rules Evaluator & Operator Unit Tests... ",
    );
    runRulesEvaluatorUnitTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "35. Running Rules SSRF Guard & Recursion Security Tests... ",
    );
    await runRulesSecurityTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "36. Running GIS Rules Engine & Event-Action Integration Tests... ",
    );
    await runRulesEngineIntegrationTests();
    console.log("✅ PASSED");

    // ─────────────────────────────────────────────────────────────
    // Phase 12 — Multi-Tenant SaaS Organization, Workspace & Customer Management
    // ─────────────────────────────────────────────────────────────

    process.stdout.write("37. Running Organization Service Unit Tests... ");
    runOrganizationUnitTests();
    console.log("✅ PASSED");

    process.stdout.write("38. Running Workspace Service Unit Tests... ");
    runWorkspaceUnitTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "39. Running Invitation Token Hashing & Expiration Unit Tests... ",
    );
    runInvitationUnitTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "40. Running Multi-Tenant SaaS Integration Tests (Org -> Workspace -> Invite -> Accept -> Transfer Ownership)... ",
    );
    await runTenantSaaSIntegrationTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "41. Running Cross-Tenant Isolation, Boundary & Status Security Tests... ",
    );
    await runTenantIsolationSecurityTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "42. Running Multi-Tenant SaaS Load Simulation (100, 300, 600 concurrent users)... ",
    );
    await runTenantSaaSLoadSimulationTests();
    console.log("✅ PASSED");

    // ─────────────────────────────────────────────────────────────
    // Phase 13 — Subscription, Plans, Feature Entitlements & Usage Management
    // ─────────────────────────────────────────────────────────────

    process.stdout.write(
      "43. Running Subscription Entitlement Engine Unit Tests... ",
    );
    runSubscriptionEntitlementUnitTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "44. Running Subscription Usage Service Unit Tests... ",
    );
    runSubscriptionUsageUnitTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "45. Running Subscription & Entitlement Security Unit Tests... ",
    );
    runSubscriptionSecurityUnitTests();
    console.log("✅ PASSED");

    // ─────────────────────────────────────────────────────────────
    // Phase 14 — Reusable GIS SDK / Library Platform
    // ─────────────────────────────────────────────────────────────

    process.stdout.write("46. Running GIS SDK Core Unit Tests... ");
    runGisSdkCoreUnitTests();
    console.log("✅ PASSED");

    process.stdout.write("47. Running GIS SDK Map & Layer Unit Tests... ");
    runGisSdkMapUnitTests();
    console.log("✅ PASSED");

    process.stdout.write("48. Running GIS SDK Domain Services Unit Tests... ");
    await runGisSdkServicesUnitTests();
    console.log("✅ PASSED");

    process.stdout.write("49. Running GIS SDK Integration Tests... ");
    await runGisSdkIntegrationTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "50. Running GIS SDK Performance & Benchmark Tests... ",
    );
    await runGisSdkPerformanceTests();
    console.log("✅ PASSED");

    // ─────────────────────────────────────────────────────────────
    // Phase 15 — Developer Portal, Application Registration & API Keys
    // ─────────────────────────────────────────────────────────────

    process.stdout.write(
      "51. Running Developer Application Service Unit Tests... ",
    );
    await runDeveloperApplicationUnitTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "52. Running Developer API Key Hashing & Rotation Unit Tests... ",
    );
    await runDeveloperApiKeyUnitTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "53. Running Commercial License Foundation Unit Tests... ",
    );
    await runDeveloperLicenseUnitTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "54. Running Developer Portal End-to-End Integration Flow Tests... ",
    );
    await runDeveloperPortalIntegrationTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "55. Running Developer Security & Cross-Tenant Boundary Tests... ",
    );
    await runDeveloperSecurityTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "56. Running Developer API Key Auth Performance Benchmark... ",
    );
    await runDeveloperPerformanceTests();
    console.log("✅ PASSED");

    // ─────────────────────────────────────────────────────────────
    // Phase 16 — Private SDK Distribution, Licensing & Access Control
    // ─────────────────────────────────────────────────────────────

    process.stdout.write(
      "57. Running Phase 16 SDK Distribution Core Unit Tests... ",
    );
    await runSdkDistributionUnitTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "58. Running Phase 16 SDK Security & Tenant Isolation Tests... ",
    );
    await runSdkSecurityTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "59. Running Phase 16 SDK Distribution End-to-End Integration Flow... ",
    );
    await runSdkDistributionIntegrationTests();
    console.log("✅ PASSED");

    // ─────────────────────────────────────────────────────────────
    // Phase 17 — Production Deployment, Scalability & Security
    // ─────────────────────────────────────────────────────────────

    process.stdout.write(
      "60. Running Phase 17 Production Infrastructure Unit Tests... ",
    );
    await runProductionInfrastructureUnitTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "61. Running Phase 17 Cross-Tenant Isolation Security Tests... ",
    );
    await runProductionTenantIsolationSecurityTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "62. Running Phase 17 Production Load Benchmark (100, 300, 600, 900 users)... ",
    );
    await runFullProductionCapacityBenchmark();
    console.log("✅ PASSED");

    // ─────────────────────────────────────────────────────────────
    // Phase 18 — Advanced GIS Data Processing, Vector Tiles, Large Datasets & High-Performance Map Rendering
    // ─────────────────────────────────────────────────────────────

    process.stdout.write(
      "63. Running Phase 18 Vector Tiles & ETag Unit Tests... ",
    );
    runVectorTilesUnitTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "64. Running Phase 18 Spatial Clustering Unit Tests... ",
    );
    runSpatialClusteringUnitTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "65. Running Phase 18 Vector Tiles & Tenant Isolation Integration Tests... ",
    );
    await runVectorTilesIntegrationTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "66. Running Phase 18 Large Datasets Benchmark (1K, 10K, 100K, 1M features & 100, 300, 600, 900 users)... ",
    );
    await runLargeDatasetsPerformanceBenchmark();
    console.log("✅ PASSED");

    // ─────────────────────────────────────────────────────────────
    // Phase 19 — Kotlin Multiplatform Mobile GIS SDK & Data-Driven Mobile Platform
    // ─────────────────────────────────────────────────────────────

    process.stdout.write(
      "67. Running Phase 19 Mobile Backend & Infrastructure Unit Tests... ",
    );
    await runMobileBackendUnitTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "68. Running Phase 19 600 Concurrent Production User Load Simulation... ",
    );
    await run600UserLoadSimulationTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "69. Running Phase 19 Live Functional Verification... ",
    );
    await runPhase19LiveVerification();
    console.log("✅ PASSED");

    // ─────────────────────────────────────────────────────────────
    // Phase 20 — Customer Application Builder, Data-Driven Business Module Composer & White-Label Configuration
    // ─────────────────────────────────────────────────────────────

    process.stdout.write(
      "70. Running Phase 20 Application Builder Live Functional & Security Verification... ",
    );
    await runPhase20LiveVerification();
    console.log("✅ PASSED");

    process.stdout.write(
      "71. Running Comprehensive Security Hardening Verification... ",
    );
    await runSecurityVerificationTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "72. Running Phase 21 Live Tracking Screen (Screen #26) Feature & UI Tests... ",
    );
    runLiveTrackingFeatureTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "73. Running Modular GPS Device Adapters & Ingestion Unit Tests... ",
    );
    await runGpsAdaptersUnitTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "74. Running Nagpur Multi-Vehicle GPS Simulator Unit Tests... ",
    );
    await runGpsSimulatorUnitTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "75. Running GPS Telemetry Ingestion API Integration Tests... ",
    );
    await runGpsTelemetryApiTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "75b. Running Mobile KMP Live GPS & Cloud Sync API Tests... ",
    );
    await runMobileGpsSyncApiTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "76. Running Fleet Operations Dashboard Full-Screen Mode Tests... ",
    );
    runDashboardFullscreenTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "77. Running Vehicles Management Unit & Repository Tests... ",
    );
    await runVehiclesManagementUnitTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "78. Running Vehicles Feature UI & Simulation Tests... ",
    );
    runVehiclesUiTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "79. Running Geofence Management Unit & Boundary Logic Tests... ",
    );
    await runGeofenceManagementUnitTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "80. Running Geofence UI & Non-Technical User Experience Tests... ",
    );
    await runGeofenceUiTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "81. Running Administrative Boundaries & Hierarchy Unit Tests... ",
    );
    await runGeofenceAdminBoundariesUnitTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "82. Running Administrative Geofence UI & Workflow Tests... ",
    );
    await runGeofenceAdminBoundariesUiTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "83. Running Boundary Resolver Service (Local & OSM) Tests... ",
    );
    await runBoundaryResolverServiceUnitTests();
    console.log("✅ PASSED");

    process.stdout.write(
      "84. Running Operational Reports & Audit Ledger Unit Tests... ",
    );
    runReportsAndAuditUnitTests();
    console.log("✅ PASSED");

    console.log("==========================================");
    console.log("ALL PLATFORM TESTS PASSED (100%)");
    console.log("==========================================");

    return true;
  } catch (err) {
    console.error("\n❌ TEST SUITE FAILURE:");
    console.error(err instanceof Error ? (err.stack ?? err.message) : err);
    process.exit(1);
  }
}

runAllPlatformTests();
