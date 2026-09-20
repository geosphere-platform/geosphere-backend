"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  GISMap,
  MapMarker,
  VectorLayer,
  MapFeature,
} from "@gis/map";
import { GeofenceZoneItem, GEOFENCE_CATEGORY_METADATA } from "../types";

export interface GeofenceMapProps {
  zones: GeofenceZoneItem[];
  selectedZone: GeofenceZoneItem | null;
  onSelectZone: (id: string) => void;
  isFullscreen?: boolean;
}

/**
 * Approximates a circle as a closed polygon ring of coordinates [lon, lat]
 */
export function generateCirclePolygon(
  center: [number, number],
  radiusMeters: number,
  points: number = 64
): [number, number][] {
  const [lon, lat] = center;
  const coords: [number, number][] = [];
  const earthRadius = 6378137; // WGS84 major radius
  const dLat = (radiusMeters / earthRadius) * (180 / Math.PI);
  const dLon = dLat / Math.cos((lat * Math.PI) / 180);

  for (let i = 0; i <= points; i++) {
    const theta = (i * 2 * Math.PI) / points;
    const pLon = lon + dLon * Math.cos(theta);
    const pLat = lat + dLat * Math.sin(theta);
    coords.push([Number(pLon.toFixed(6)), Number(pLat.toFixed(6))]);
  }
  return coords;
}

export const GeofenceMap: React.FC<GeofenceMapProps> = ({
  zones,
  selectedZone,
  onSelectZone,
  isFullscreen = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const gisMapRef = useRef<GISMap | null>(null);
  const [activeBasemap, setActiveBasemap] = useState<"street" | "dark" | "satellite">("street");

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Default center is Nagpur (Zero Mile Center of India)
    const defaultCenter: [number, number] = [79.0882, 21.1458];

    const gisMap = new GISMap({
      center: defaultCenter,
      zoom: 11,
      baseTile: activeBasemap === "satellite" ? "satellite" : activeBasemap === "dark" ? "carto_dark" : "osm",
      controls: {
        zoom: false,
        fullscreen: false,
        scale: true,
        attribution: false,
      },
    });

    gisMapRef.current = gisMap;
    gisMap.initialize(mapContainerRef.current);

    // 1. Polygon/Circle Geofence Area Layer
    const geofenceLayer = new VectorLayer({
      id: "geofence-boundaries-layer",
      name: "Geofence Zones",
      visible: true,
      zIndex: 2,
    });
    gisMap.layers.addLayer(geofenceLayer);

    // 2. Zone Center Marker Layer
    const markersLayer = new VectorLayer({
      id: "geofence-markers-layer",
      name: "Zone Centers",
      visible: true,
      zIndex: 4,
    });
    gisMap.layers.addLayer(markersLayer);

    // Click handler on features
    gisMap.on("featureSelected", ({ feature }) => {
      if (feature?.properties?.geofenceId) {
        onSelectZone(String(feature.properties.geofenceId));
      }
    });

    return () => {
      gisMap.destroy();
      gisMapRef.current = null;
    };
  }, []);

  // Update Basemap Provider
  useEffect(() => {
    if (!gisMapRef.current) return;
    const gisMap = gisMapRef.current;
    if (activeBasemap === "satellite") {
      gisMap.setBaseTile("satellite");
    } else if (activeBasemap === "dark") {
      gisMap.setBaseTile("carto_dark");
    } else {
      gisMap.setBaseTile("osm");
    }
  }, [activeBasemap]);

  // Render Geofence Zones & Markers
  useEffect(() => {
    if (!gisMapRef.current) return;
    const gisMap = gisMapRef.current;

    // Clear old zone features and markers
    zones.forEach((z) => {
      gisMap.features.removeFeature(`geo-polygon-${z.id}`);
      gisMap.features.removeFeature(`geo-marker-${z.id}`);
    });

    zones.forEach((zone) => {
      const isSelected = selectedZone?.id === zone.id;
      const meta = GEOFENCE_CATEGORY_METADATA[zone.category];
      const color = zone.color || meta.defaultColor;

      let ringCoords: [number, number][];
      if (zone.shapeType === "circle") {
        ringCoords = generateCirclePolygon(zone.center, zone.radiusMeters || 1000);
      } else {
        ringCoords = zone.coordinates;
      }

      if (!ringCoords || ringCoords.length === 0) return;

      // Add boundary polygon
      const polygonFeature: MapFeature = {
        id: `geo-polygon-${zone.id}`,
        geometry: {
          type: "Polygon",
          coordinates: [ringCoords],
        },
        properties: {
          geofenceId: zone.id,
          name: zone.name,
          category: zone.category,
        },
        style: {
          fillColor: isSelected ? `${color}40` : `${color}20`,
          strokeColor: color,
          strokeWidth: isSelected ? 3.5 : 2,
          strokeDashArray: zone.enabled ? undefined : [5, 5],
          label: `${zone.name} (${zone.activeVehiclesCount} inside)`,
          labelColor: "#ffffff",
          labelFont: isSelected ? "bold 12px sans-serif" : "11px sans-serif",
        },
      };

      try {
        gisMap.features.addFeature(polygonFeature);
      } catch {
        // Feature might exist
      }

      // Add center marker
      const marker: MapMarker = {
        id: `geo-marker-${zone.id}`,
        coordinate: zone.center,
        title: zone.name,
        metadata: {
          geofenceId: zone.id,
          category: zone.category,
        },
        style: {
          circleRadius: isSelected ? 10 : 7,
          fillColor: color,
          strokeColor: "#ffffff",
          strokeWidth: 2,
          label: meta.icon,
          labelColor: "#ffffff",
          labelFont: "14px sans-serif",
        },
      };

      gisMap.addMarker(marker, "geofence-markers-layer");
    });
  }, [zones, selectedZone]);

  // Center & Fit on Selected Zone
  useEffect(() => {
    if (!gisMapRef.current || !selectedZone) return;
    const gisMap = gisMapRef.current;

    // If administrative region or polygon has coordinates, fit bounds with padding
    if (selectedZone.coordinates && selectedZone.coordinates.length > 3) {
      let minLng = 180, maxLng = -180, minLat = 90, maxLat = -90;
      for (const [lng, lat] of selectedZone.coordinates) {
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      }
      if (minLng < maxLng && minLat < maxLat && typeof (gisMap as any).fitBounds === "function") {
        (gisMap as any).fitBounds([minLng, minLat, maxLng, maxLat], 40);
        return;
      }
    }

    gisMap.setCenter(selectedZone.center);
    let targetZoom = 12;
    if (selectedZone.shapeType === "circle") {
      targetZoom = (selectedZone.radiusMeters || 1000) <= 800 ? 14 : 12;
    } else if (selectedZone.shapeType === "admin_region") {
      const level = selectedZone.adminRegion?.level;
      targetZoom = level === "country" ? 5 : level === "state" ? 7 : level === "district" ? 10 : 12;
    }
    gisMap.setZoom(targetZoom);
  }, [selectedZone]);

  const handleZoomIn = useCallback(() => {
    if (!gisMapRef.current) return;
    const current = gisMapRef.current.getZoom();
    gisMapRef.current.setZoom(current + 1);
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!gisMapRef.current) return;
    const current = gisMapRef.current.getZoom();
    gisMapRef.current.setZoom(current - 1);
  }, []);

  const handleResetView = useCallback(() => {
    if (!gisMapRef.current) return;
    gisMapRef.current.setCenter([79.0882, 21.1458]);
    gisMapRef.current.setZoom(11);
  }, []);

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-xl overflow-hidden border border-slate-800 shadow-inner bg-slate-950">
      {/* OpenLayers Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[420px]" />

      {/* Top Floating Map Controls HUD */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2">
        {/* Basemap Switcher */}
        <div className="flex items-center bg-slate-900/90 backdrop-blur-md rounded-lg p-1 border border-slate-800 shadow-md">
          <button
            type="button"
            onClick={() => setActiveBasemap("street")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
              activeBasemap === "street"
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Streets
          </button>
          <button
            type="button"
            onClick={() => setActiveBasemap("dark")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
              activeBasemap === "dark"
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Dark
          </button>
          <button
            type="button"
            onClick={() => setActiveBasemap("satellite")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
              activeBasemap === "satellite"
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Satellite
          </button>
        </div>

        {/* Selected Zone Quick Pill */}
        {selectedZone && (
          <div className="hidden sm:flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-700/80 shadow-md">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: selectedZone.color }}
            />
            <span className="text-xs font-semibold text-white truncate max-w-[160px]">
              {selectedZone.name}
            </span>
            <span className="text-[10px] text-slate-400 uppercase font-mono">
              {selectedZone.shapeType}
            </span>
          </div>
        )}
      </div>

      {/* Right Floating Zoom & Recenter Controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={handleZoomIn}
          title="Zoom In"
          className="w-8 h-8 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-200 hover:text-white hover:bg-slate-800 flex items-center justify-center font-bold text-base shadow-md backdrop-blur-md transition-colors"
        >
          +
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          title="Zoom Out"
          className="w-8 h-8 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-200 hover:text-white hover:bg-slate-800 flex items-center justify-center font-bold text-base shadow-md backdrop-blur-md transition-colors"
        >
          −
        </button>
        <button
          type="button"
          onClick={handleResetView}
          title="Reset Map View"
          className="w-8 h-8 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-200 hover:text-white hover:bg-slate-800 flex items-center justify-center text-xs shadow-md backdrop-blur-md transition-colors"
        >
          🎯
        </button>
      </div>

      {/* Bottom Map Legend */}
      <div className="absolute bottom-3 left-3 z-10 hidden sm:flex items-center gap-3 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-300 shadow-md">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" /> Depot
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400" /> Customer Site
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-400" /> Restricted Zone
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-400" /> Terminal
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-purple-400" /> Service Bay
        </span>
      </div>
    </div>
  );
};
