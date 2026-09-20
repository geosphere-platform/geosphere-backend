/**
 * Business Module — Fleet Vehicle Tracking
 *
 * Business domain module for Fleet & Vehicle tracking capabilities.
 * Consumes the underlying business-agnostic GIS Core.
 */

import { GISModule, ModuleRegistry } from "@/core/modules";
import { PERMISSIONS } from "@/core/constants";
import { SpatialEntity, createSpatialEntity } from "@/core/gis";
import { Vehicle } from "@/features/vehicle/domain/entities";

export const VehicleModuleContract: GISModule = {
  id: "fleet",
  name: "Fleet & Vehicle Tracking",
  version: "1.0.0",
  description:
    "Real-time vehicle tracking, fleet status analytics, and vehicle management",
  category: "fleet_logistics",
  dependencies: ["gis-core"],
  permissions: [
    PERMISSIONS.VEHICLE_READ,
    PERMISSIONS.VEHICLE_CREATE,
    PERMISSIONS.VEHICLE_UPDATE,
    PERMISSIONS.VEHICLE_DELETE,
    PERMISSIONS.TRACKING_READ_LIVE,
  ],
  features: ["vehicle_status", "live_stream", "history_replay"],
};

/**
 * Adapter Function: Maps a business-specific Vehicle domain entity into a generic GIS SpatialEntity
 */
export function vehicleToSpatialEntity(
  vehicle: Vehicle & { latitude?: number; longitude?: number },
): SpatialEntity {
  const lat = vehicle.latitude ?? 28.6139;
  const lng = vehicle.longitude ?? 77.209;

  return createSpatialEntity({
    id: vehicle.id,
    tenantId: vehicle.organizationId ?? "default-tenant-0000",
    entityType: "vehicle",
    geometry: {
      type: "Point",
      coordinates: [lng, lat],
    },
    properties: {
      name: vehicle.name,
      licensePlate: vehicle.licensePlate,
      status: vehicle.status,
      driverName: vehicle.driverName,
      make: (vehicle as unknown as Record<string, unknown>).make,
      model: (vehicle as unknown as Record<string, unknown>).model,
      year: (vehicle as unknown as Record<string, unknown>).year,
    },
  });
}

// Auto-register module contract
ModuleRegistry.register(VehicleModuleContract);
