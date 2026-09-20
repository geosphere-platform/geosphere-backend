/**
 * Module Registry — Platform Module Management
 *
 * Central registry for all platform modules. Allows modular discovery,
 * dependency checking, and tenant feature evaluation.
 */

import { GISModule } from "./types";
import { PERMISSIONS } from "../constants";

class ModuleRegistryImpl {
  private modules = new Map<string, GISModule>();

  constructor() {
    this.registerDefaultModules();
  }

  /**
   * Register a new module in the platform
   */
  register(module: GISModule): void {
    // Verify dependencies
    for (const depId of module.dependencies) {
      if (!this.modules.has(depId)) {
        console.warn(
          `[ModuleRegistry] Registering '${module.id}' before dependency '${depId}'`,
        );
      }
    }
    this.modules.set(module.id, module);
  }

  /**
   * Get a registered module by ID
   */
  get(moduleId: string): GISModule | undefined {
    return this.modules.get(moduleId);
  }

  /**
   * Check if a module ID is registered
   */
  has(moduleId: string): boolean {
    return this.modules.has(moduleId);
  }

  /**
   * Return all registered platform modules
   */
  getAll(): GISModule[] {
    return Array.from(this.modules.values());
  }

  /**
   * Check if all required dependencies for a module are satisfied in an enabled module list
   */
  areDependenciesSatisfied(
    moduleId: string,
    enabledModuleIds: string[],
  ): boolean {
    const targetModule = this.get(moduleId);
    if (!targetModule) return false;
    return targetModule.dependencies.every((depId) =>
      enabledModuleIds.includes(depId),
    );
  }

  private registerDefaultModules(): void {
    // 1. GIS Core Module (Always enabled)
    this.register({
      id: "gis-core",
      name: "GIS Core Platform",
      version: "1.0.0",
      description:
        "Core geographic visualization, spatial layer management, and coordinate operations",
      category: "core",
      isCoreModule: true,
      dependencies: [],
      permissions: [
        PERMISSIONS.GIS_MAP_READ,
        PERMISSIONS.GIS_FEATURE_READ,
        PERMISSIONS.GIS_FEATURE_CREATE,
        PERMISSIONS.GIS_FEATURE_UPDATE,
        PERMISSIONS.GIS_FEATURE_DELETE,
      ],
      features: [
        "base_maps",
        "custom_layers",
        "geo_json_import",
        "spatial_query",
      ],
    });

    // 2. Fleet Management Module
    this.register({
      id: "fleet",
      name: "Fleet Management",
      version: "1.0.0",
      description:
        "Vehicle registry, status tracking, maintenance schedules, and driver assignments",
      category: "fleet_logistics",
      dependencies: ["gis-core"],
      permissions: [
        PERMISSIONS.VEHICLE_READ,
        PERMISSIONS.VEHICLE_CREATE,
        PERMISSIONS.VEHICLE_UPDATE,
        PERMISSIONS.VEHICLE_DELETE,
      ],
      features: ["vehicle_status", "driver_management", "maintenance_tracking"],
    });

    // 3. Telemetry & Real-Time Tracking Module
    this.register({
      id: "tracking",
      name: "Real-Time Telemetry Tracking",
      version: "1.0.0",
      description:
        "Real-time location streaming, speed alerts, and historical telemetry replay",
      category: "fleet_logistics",
      dependencies: ["gis-core"],
      permissions: [PERMISSIONS.TRACKING_LOCATION_READ],
      features: ["live_stream", "history_replay", "speed_alerts"],
    });

    // 4. Route Management Module
    this.register({
      id: "routing",
      name: "Route Optimization & Management",
      version: "1.0.0",
      description:
        "Multi-stop routing, distance calculation, turn-by-turn navigation, and trip history",
      category: "fleet_logistics",
      dependencies: ["gis-core"],
      permissions: [PERMISSIONS.ROUTING_CALCULATE, PERMISSIONS.TRIP_READ],
      features: ["route_planning", "trip_logging", "eta_calculation"],
    });

    // 5. Geofencing Module
    this.register({
      id: "geofence",
      name: "Spatial Geofencing",
      version: "1.0.0",
      description:
        "Polygon & circular geofence management, entry/exit triggers, and containment checks",
      category: "spatial_analytics",
      dependencies: ["gis-core"],
      permissions: [PERMISSIONS.GEOFENCE_READ, PERMISSIONS.GEOFENCE_CREATE],
      features: ["polygon_geofence", "entry_exit_alerts"],
    });

    // 6. Asset & Infrastructure Management Module
    this.register({
      id: "asset-management",
      name: "Asset & Infrastructure Management",
      version: "1.0.0",
      description:
        "Fixed asset tracking, utility pipelines, buildings, and equipment mapping",
      category: "asset_field",
      dependencies: ["gis-core"],
      permissions: [
        PERMISSIONS.GIS_FEATURE_READ,
        PERMISSIONS.GIS_FEATURE_CREATE,
      ],
      features: ["asset_catalog", "inspection_logging", "condition_monitoring"],
    });

    // 7. Field Workforce Module
    this.register({
      id: "workforce",
      name: "Field Workforce & Task Dispatch",
      version: "1.0.0",
      description:
        "Field agent location monitoring, task assignment, and proof-of-visit tracking",
      category: "asset_field",
      dependencies: ["gis-core"],
      permissions: [PERMISSIONS.GIS_FEATURE_READ],
      features: ["task_dispatch", "field_agent_tracking"],
    });
  }
}

export const ModuleRegistry = new ModuleRegistryImpl();
