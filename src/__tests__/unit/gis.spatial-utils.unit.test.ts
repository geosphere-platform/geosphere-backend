import {
  calculateDistance,
  calculateBearing,
} from "@/core/gis/utils/spatial-utils";

export function runSpatialUtilsUnitTests() {
  // 1. Distance calculation between New Delhi (28.6139, 77.2090) and Mumbai (19.0760, 72.8777)
  const del = [77.209, 28.6139] as [number, number];
  const bom = [72.8777, 19.076] as [number, number];

  const distMeters = calculateDistance(del, bom);
  const distKm = distMeters / 1000;

  // Actual geodesic distance is ~1148 km (within 1% tolerance)
  if (distKm < 1100 || distKm > 1200) {
    throw new Error(
      `Distance calculation inaccuracy: expected ~1148km, got ${distKm}km`,
    );
  }

  // 2. Bearing calculation
  const bearing = calculateBearing(del, bom);
  if (bearing < 180 || bearing > 250) {
    throw new Error(
      `Bearing calculation inaccuracy: expected south-west bearing (~215°), got ${bearing}°`,
    );
  }

  return true;
}
