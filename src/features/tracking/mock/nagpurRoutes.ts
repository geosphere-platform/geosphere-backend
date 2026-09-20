/**
 * GeoSphere Platform — Central India (Nagpur) Simulation Routes & Spatial Math
 *
 * Provides calibrated GIS waypoint routes across the Nagpur logistics and highway network,
 * along with forward azimuth (bearing) calculation and waypoint interpolation.
 */

export interface RouteWaypoint {
  lat: number;
  lng: number;
  name: string;
  speedLimitKmh: number;
}

export interface NagpurSimulatedVehicleRoute {
  vehicleId: string;
  licensePlate: string;
  name: string;
  driverName: string;
  waypoints: RouteWaypoint[];
}

/**
 * Route 1: Central Nagpur Urban Logistics Circuit (Zero Mile ↔ VNIT)
 */
export const ROUTE_CENTRAL_URBAN: RouteWaypoint[] = [
  { lat: 21.1458, lng: 79.0882, name: "Zero Mile Stone (Central Hub)", speedLimitKmh: 40 },
  { lat: 21.1482, lng: 79.0820, name: "Reserve Bank Square", speedLimitKmh: 45 },
  { lat: 21.1420, lng: 79.0750, name: "Sitabuldi Interchange", speedLimitKmh: 35 },
  { lat: 21.1415, lng: 79.0620, name: "Dharampeth Coffee House", speedLimitKmh: 45 },
  { lat: 21.1340, lng: 79.0580, name: "Shankar Nagar Square", speedLimitKmh: 40 },
  { lat: 21.1255, lng: 79.0522, name: "VNIT Nagpur Campus Gate", speedLimitKmh: 30 },
  { lat: 21.1300, lng: 79.0650, name: "Bajaj Nagar Square", speedLimitKmh: 40 },
  { lat: 21.1370, lng: 79.0780, name: "Rahate Colony Square", speedLimitKmh: 45 },
  { lat: 21.1440, lng: 79.0860, name: "Civil Lines Approach", speedLimitKmh: 40 },
];

/**
 * Route 2: South Corridor & Airport Cargo (MIHAN SEZ ↔ Chhatrapati Square)
 */
export const ROUTE_SOUTH_CORRIDOR: RouteWaypoint[] = [
  { lat: 21.0560, lng: 79.0350, name: "MIHAN Multi-Modal Cargo Hub", speedLimitKmh: 65 },
  { lat: 21.0740, lng: 79.0490, name: "AIIMS Nagpur Medical Campus", speedLimitKmh: 60 },
  { lat: 21.0922, lng: 79.0617, name: "Dr. Babasaheb Ambedkar Int'l Airport", speedLimitKmh: 55 },
  { lat: 21.1020, lng: 79.0680, name: "Ujjwal Nagar Wardha Road", speedLimitKmh: 50 },
  { lat: 21.1110, lng: 79.0720, name: "Chhatrapati Square", speedLimitKmh: 45 },
  { lat: 21.1250, lng: 79.0800, name: "Ajni Railway Colony", speedLimitKmh: 40 },
  { lat: 21.1110, lng: 79.0720, name: "Chhatrapati Square (Southbound)", speedLimitKmh: 50 },
  { lat: 21.0922, lng: 79.0617, name: "Airport Wardha Road (Southbound)", speedLimitKmh: 60 },
  { lat: 21.0740, lng: 79.0490, name: "AIIMS South Junction", speedLimitKmh: 65 },
];

/**
 * Route 3: West Industrial Heavy Cargo (MIDC Hingna ↔ Ravi Nagar / Amravati Bypass)
 */
export const ROUTE_WEST_INDUSTRIAL: RouteWaypoint[] = [
  { lat: 21.1090, lng: 78.9850, name: "MIDC Hingna Industrial Complex", speedLimitKmh: 45 },
  { lat: 21.1190, lng: 78.9900, name: "Electronic Zone Hingna", speedLimitKmh: 50 },
  { lat: 21.1280, lng: 78.9980, name: "Digdoh Hills Junction", speedLimitKmh: 55 },
  { lat: 21.1410, lng: 79.0020, name: "ICAD Center Wadi", speedLimitKmh: 50 },
  { lat: 21.1510, lng: 79.0050, name: "Wadi Toll Plaza (Amravati Highway)", speedLimitKmh: 65 },
  { lat: 21.1520, lng: 79.0250, name: "Futala Lake Bypass", speedLimitKmh: 55 },
  { lat: 21.1520, lng: 79.0480, name: "Ravi Nagar Square", speedLimitKmh: 40 },
  { lat: 21.1520, lng: 79.0250, name: "Futala Lake Return", speedLimitKmh: 55 },
  { lat: 21.1510, lng: 79.0050, name: "Wadi Junction Return", speedLimitKmh: 60 },
  { lat: 21.1280, lng: 78.9980, name: "Digdoh Return", speedLimitKmh: 50 },
];

export const NAGPUR_SIMULATION_FLEET: NagpurSimulatedVehicleRoute[] = [
  {
    vehicleId: "veh-001",
    licensePlate: "MH-31-FA-1001",
    name: "Nagpur Express Logistics Truck #1",
    driverName: "Rajesh Sharma",
    waypoints: ROUTE_CENTRAL_URBAN,
  },
  {
    vehicleId: "veh-002",
    licensePlate: "MH-12-RN-4589",
    name: "Wardha Heavy Hauler #4",
    driverName: "Sunil Patil",
    waypoints: ROUTE_SOUTH_CORRIDOR,
  },
  {
    vehicleId: "veh-003",
    licensePlate: "MH-31-FA-2002",
    name: "Hingna Industrial Cargo Carrier #2",
    driverName: "Amit Verma",
    waypoints: ROUTE_WEST_INDUSTRIAL,
  },
];

/**
 * Computes forward azimuth / great-circle bearing (0–360°) between two coordinates.
 */
export function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  return Math.round(((θ * 180) / Math.PI + 360) % 360);
}

/**
 * Maps heading angle (0–360°) to cardinal directional arrow.
 */
export function getDirectionArrow(heading: number = 0): string {
  const arrows = ["↑", "↗", "→", "↘", "↓", "↙", "←", "↖"];
  const index = Math.round(((heading % 360) + 360) % 360 / 45) % 8;
  return arrows[index];
}

/**
 * Interpolates between two coordinates along a segment by fraction t (0 <= t <= 1).
 */
export function interpolateCoordinate(
  c1: { lat: number; lng: number },
  c2: { lat: number; lng: number },
  t: number
): { lat: number; lng: number } {
  const clampedT = Math.max(0, Math.min(1, t));
  return {
    lat: Number((c1.lat + (c2.lat - c1.lat) * clampedT).toFixed(6)),
    lng: Number((c1.lng + (c2.lng - c1.lng) * clampedT).toFixed(6)),
  };
}
