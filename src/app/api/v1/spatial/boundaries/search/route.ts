import { NextRequest } from "next/server";
import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import {
  getAdminCountries,
  getAdminStates,
  getAdminDistricts,
  getAdminTehsils,
  AdminBoundaryItem,
  findAdminBoundaryItem,
} from "@/features/geofence/data/administrativeBoundaries";

// In-memory cache for fetched administrative boundaries to prevent rate-limiting
const boundaryCache = new Map<string, AdminBoundaryItem[]>();

/**
 * Calculates approximate polygon area in sq km from [lon, lat][]
 */
function calculatePolygonAreaSqKm(coords: [number, number][]): number {
  if (coords.length < 3) return 0;
  let area = 0;
  const rad = Math.PI / 180;
  const earthRadius = 6371; // km

  for (let i = 0; i < coords.length - 1; i++) {
    const [p1Lon, p1Lat] = coords[i];
    const [p2Lon, p2Lat] = coords[i + 1];
    area +=
      (p2Lon * rad - p1Lon * rad) *
      (2 + Math.sin(p1Lat * rad) + Math.sin(p2Lat * rad));
  }
  area = (Math.abs(area) * earthRadius * earthRadius) / 2;
  return Math.round(area) || 50;
}

/**
 * Calculates approximate perimeter in km from [lon, lat][]
 */
function calculatePerimeterKm(coords: [number, number][]): number {
  if (coords.length < 2) return 0;
  let perimeter = 0;
  const rad = Math.PI / 180;
  const earthRadius = 6371; // km

  for (let i = 0; i < coords.length - 1; i++) {
    const [lon1, lat1] = coords[i];
    const [lon2, lat2] = coords[i + 1];
    const dLat = (lat2 - lat1) * rad;
    const dLon = (lon2 - lon1) * rad;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    perimeter += earthRadius * c;
  }
  return Math.round(perimeter) || 20;
}

/**
 * GET /api/v1/spatial/boundaries/search?query=...&level=...
 *
 * Retrieves exact administrative boundary polygons matching map borders:
 * 1. Checks local high-precision dataset first for instant response
 * 2. Optionally queries official OpenStreetMap Nominatim for exact survey boundaries
 */
export const GET = withAuth(async (ctx: AuthContext) => {
  const url = new URL(ctx.request.url);
  const query = (url.searchParams.get("query") || "").trim();
  const level = url.searchParams.get("level") || "all";
  const source = url.searchParams.get("source") || "hybrid"; // "local" | "osm" | "hybrid"

  if (!query) {
    return ApiResponse.error(
      "Query parameter is required (e.g. ?query=Nagpur+District)",
      400,
      "MISSING_QUERY"
    );
  }

  const cacheKey = `${query.toLowerCase()}::${level}`;
  if (boundaryCache.has(cacheKey)) {
    return ApiResponse.success({
      query,
      results: boundaryCache.get(cacheKey)!,
      source: "cache",
    });
  }

  const results: AdminBoundaryItem[] = [];
  const qLower = query.toLowerCase();

  // 1. Search local preloaded administrative boundaries dataset
  const localCountries = getAdminCountries();
  for (const c of localCountries) {
    if (c.name.toLowerCase().includes(qLower) || c.countryCode.toLowerCase() === qLower) {
      if (level === "all" || level === "country") results.push(c);
    }
    for (const s of c.states) {
      if (s.name.toLowerCase().includes(qLower) || s.stateCode.toLowerCase() === qLower) {
        if (level === "all" || level === "state") results.push(s);
      }
      for (const d of s.districts) {
        if (d.name.toLowerCase().includes(qLower) || d.id.includes(qLower)) {
          if (level === "all" || level === "district") results.push(d);
        }
        for (const t of d.tehsils) {
          if (t.name.toLowerCase().includes(qLower) || t.id.includes(qLower)) {
            if (level === "all" || level === "tehsil") results.push(t);
          }
        }
      }
    }
  }

  // If local results found and source is not strictly "osm", return local immediately
  if (results.length > 0 && source !== "osm") {
    boundaryCache.set(cacheKey, results);
    return ApiResponse.success({
      query,
      results,
      source: "local",
    });
  }

  // 2. Fetch live exact boundary from OpenStreetMap Nominatim
  try {
    const osmUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query
    )}&format=json&polygon_geojson=1&limit=2`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

    const osmRes = await fetch(osmUrl, {
      headers: {
        "User-Agent": "GeoSphere-Enterprise-GIS-Platform/1.0 (contact: support@geosphere.io)",
        Accept: "application/json",
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (osmRes.ok) {
      const osmData = await osmRes.json();
      if (Array.isArray(osmData) && osmData.length > 0) {
        for (const item of osmData) {
          const geojson = item.geojson;
          if (!geojson) continue;

          let outerRing: [number, number][] = [];
          if (geojson.type === "Polygon" && Array.isArray(geojson.coordinates[0])) {
            outerRing = geojson.coordinates[0] as [number, number][];
          } else if (
            geojson.type === "MultiPolygon" &&
            Array.isArray(geojson.coordinates[0]) &&
            Array.isArray(geojson.coordinates[0][0])
          ) {
            // Find largest polygon ring in multipolygon
            let maxLen = 0;
            for (const poly of geojson.coordinates) {
              if (poly[0] && poly[0].length > maxLen) {
                maxLen = poly[0].length;
                outerRing = poly[0] as [number, number][];
              }
            }
          }

          if (outerRing.length >= 4) {
            const centerLon = parseFloat(item.lon) || outerRing[0][0];
            const centerLat = parseFloat(item.lat) || outerRing[0][1];
            const areaSqKm = calculatePolygonAreaSqKm(outerRing);
            const perimeterKm = calculatePerimeterKm(outerRing);

            // Infer administrative level from OSM type or class
            const inferredLevel =
              item.type === "administrative"
                ? "district"
                : item.class === "boundary"
                  ? "district"
                  : "tehsil";

            const osmItem: AdminBoundaryItem = {
              id: `osm_${item.osm_id || Date.now()}`,
              name: item.display_name?.split(",")[0] || query,
              level: inferredLevel,
              countryCode: "IN",
              center: [centerLon, centerLat],
              zoom: inferredLevel === "district" ? 10 : 12,
              areaSqKm,
              perimeterKm,
              polygonCoords: outerRing,
            };

            results.push(osmItem);
          }
        }
      }
    }
  } catch {
    // Network unavailable or timeout; gracefully fall back to local results
  }

  // Cache results
  boundaryCache.set(cacheKey, results);

  return ApiResponse.success({
    query,
    results,
    source: results.some((r) => r.id.startsWith("osm_")) ? "osm" : "local",
  });
});
