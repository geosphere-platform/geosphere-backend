import { moduleRegistryService } from "../../features/application-builder/services/module-registry.service";
import { configurationValidatorService } from "../../features/application-builder/services/configuration-validator.service";
import { publishingVersioningService } from "../../features/application-builder/services/publishing-versioning.service";
import { featureFlagResolverService } from "../../features/application-builder/services/feature-flag-resolver.service";
import { ApplicationConfig } from "../../features/application-builder/types/application.types";

export function runApplicationBuilderUnitTests() {
  console.log("--- Testing Application Builder Core Unit Services ---");

  // 1. Module Registry & Dependency Resolution
  const modules = moduleRegistryService.getAllModules();
  if (!modules || modules.length < 10) {
    throw new Error(
      "Module registry must contain at least 10 core business modules",
    );
  }

  // Dependency error when TASKS is enabled without FORMS
  const invalidDepIssues = moduleRegistryService.validateDependencies([
    "MAP",
    "TASKS",
  ]);
  if (!invalidDepIssues.some((i) => i.code === "MISSING_DEPENDENCY")) {
    throw new Error(
      "Expected dependency error when TASKS is enabled without FORMS",
    );
  }

  // Satisfied dependencies
  const validDepIssues = moduleRegistryService.validateDependencies([
    "MAP",
    "FORMS",
    "TASKS",
  ]);
  if (validDepIssues.some((i) => i.severity === "ERROR")) {
    throw new Error(
      "Expected zero dependency errors for valid module set [MAP, FORMS, TASKS]",
    );
  }

  // 2. Configuration Validation Engine
  const validConfig: ApplicationConfig = {
    branding: {
      appTitle: "Test App",
      primaryColor: "#0F172A",
      accentColor: "#3B82F6",
      darkMode: true,
    },
    modules: ["MAP", "LOCATION", "OFFLINE"],
    layers: [
      { id: "l1", name: "Test Layer", geometryType: "Point", enabled: true },
    ],
    mapConfig: {
      initialCenter: [-74.006, 40.7128],
      zoom: 12,
      minZoom: 2,
      maxZoom: 18,
      vectorTileUrl: "/tiles",
      defaultStyle: "DARK_VECTOR",
    },
    forms: [],
    workflows: [],
    featureFlags: {},
    permissions: {},
    locationConfig: {
      trackingProfile: "BALANCED",
      intervalSeconds: 15,
      batchSize: 20,
    },
    offlineConfig: { autoDownloadPackages: false, maxStorageBytes: 1000 },
    notifications: [],
    dashboards: [],
    reports: [],
  };

  const valResult = configurationValidatorService.validate(validConfig);
  if (!valResult.isValid) {
    throw new Error(
      `Valid configuration failed validation: ${JSON.stringify(valResult.issues)}`,
    );
  }

  // Invalid map zoom validation
  const invalidZoomConfig = {
    ...validConfig,
    mapConfig: { ...validConfig.mapConfig, zoom: 25 },
  };
  const invalidZoomResult =
    configurationValidatorService.validate(invalidZoomConfig);
  if (invalidZoomResult.isValid) {
    throw new Error("Expected validation failure when zoom exceeds maxZoom");
  }

  // 3. Publishing Versioning & Snapshot Preparation
  const prep = publishingVersioningService.preparePublishSnapshot(
    "app-1",
    "tenant-1",
    1,
    validConfig,
    "Initial publish",
  );
  if (prep.newVersion !== 2 || !prep.snapshotPayload) {
    throw new Error("Failed to prepare publish snapshot payload");
  }

  // 4. Feature Flag Hierarchical Resolution
  const resolvedFlags = featureFlagResolverService.resolveFeatureFlags(
    { GLOBAL_FLAG: true },
    { TENANT_FLAG: true },
    { ADVANCED_GEOFENCE: true },
  );
  if (!resolvedFlags.ADVANCED_GEOFENCE || !resolvedFlags.LOCATION_TRACKING) {
    throw new Error("Hierarchical feature flag resolution failed");
  }

  console.log("✅ Application Builder Unit Tests PASSED");
}
