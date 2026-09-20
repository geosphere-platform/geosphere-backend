/**
 * GIS and Geospatial Utility Helpers
 */

/**
 * Calculates the great-circle distance between two points on the Earth's surface
 * using the Haversine formula.
 *
 * @param lat1 Latitude of point 1 in decimal degrees
 * @param lon1 Longitude of point 1 in decimal degrees
 * @param lat2 Latitude of point 2 in decimal degrees
 * @param lon2 Longitude of point 2 in decimal degrees
 * @returns Distance in meters
 */
export function getHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Checks if a point is within a circular geofence.
 *
 * @param pointLat Latitude of point
 * @param pointLon Longitude of point
 * @param fenceLat Latitude of geofence center
 * @param fenceLon Longitude of geofence center
 * @param radiusInMeters Radius of geofence
 * @returns boolean true if point is inside
 */
export function isPointInCircleGeofence(
  pointLat: number,
  pointLon: number,
  fenceLat: number,
  fenceLon: number,
  radiusInMeters: number,
): boolean {
  const distance = getHaversineDistance(pointLat, pointLon, fenceLat, fenceLon);
  return distance <= radiusInMeters;
}

/**
 * Converts EPSG:4326 (WGS84 Lon/Lat) to EPSG:3857 (Spherical Mercator) meters.
 * Useful for OpenLayers map server-side coordinates alignment.
 *
 * @param lon Longitude in degrees
 * @param lat Latitude in degrees
 * @returns [x, y] coordinates in meters
 */
export function fromLonLatToWebMercator(
  lon: number,
  lat: number,
): [number, number] {
  const x = (lon * 20037508.34) / 180;
  let y = Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180);
  y = (y * 20037508.34) / 180;
  return [x, y];
}

/**
 * Converts EPSG:3857 (Spherical Mercator) to EPSG:4326 (WGS84 Lon/Lat).
 *
 * @param x Coordinate X in meters
 * @param y Coordinate Y in meters
 * @returns [lon, lat] coordinates in degrees
 */
export function toLonLatFromWebMercator(
  x: number,
  y: number,
): [number, number] {
  const lon = (x * 180) / 20037508.34;
  let lat = (y * 180) / 20037508.34;
  lat = (360 / Math.PI) * Math.atan(Math.exp((lat * Math.PI) / 180)) - 90;
  return [lon, lat];
}
