"use client";

import React, { useEffect, useRef, useState } from "react";
import { GISMap, MapMarker, ClusterLayer } from "@gis/map";
import { MapVehicleMarker } from "@/features/dashboard/types/fleet";

interface FleetMapProps {
  markers: MapVehicleMarker[];
  selectedMarker: MapVehicleMarker | null;
  onSelectMarker: (marker: MapVehicleMarker | null) => void;
  isClusteringEnabled?: boolean;
  activeTileLayer?: "street" | "dark" | "satellite";
  isLoading?: boolean;
}

export const FleetMap: React.FC<FleetMapProps> = ({
  markers,
  selectedMarker,
  onSelectMarker,
  isClusteringEnabled = true,
  activeTileLayer = "street",
  isLoading = false,
}) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapSdkRef = useRef<GISMap | null>(null);
  const [currentLayer, setCurrentLayer] = useState<"street" | "dark">("street");

  // Status color map
  const getStatusColor = (status: MapVehicleMarker["status"]) => {
    switch (status) {
      case "moving":
        return "#10B981";
      case "idle":
        return "#F59E0B";
      case "online":
        return "#3B82F6";
      case "offline":
      default:
        return "#64748B";
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current) return;

    const gisMap = new GISMap({
      center: [-0.1278, 51.5074],
      zoom: 12,
      baseTile: "osm",
      controls: {
        zoom: false,
        fullscreen: false,
        scale: false,
        attribution: false,
      },
    });
    mapSdkRef.current = gisMap;
    gisMap.initialize(mapRef.current);

    const clusterLayer = new ClusterLayer(
      { id: "fleet-cluster-layer", name: "Fleet Vehicles", visible: true },
      {
        enabled: isClusteringEnabled,
        distance: 40,
        minClusterSize: 2,
        clusterColor: "#2563EB",
      },
    );
    gisMap.layers.addLayer(clusterLayer);

    gisMap.on("featureSelected", ({ feature }) => {
      if (feature && feature.properties?.markerData) {
        onSelectMarker(feature.properties.markerData as MapVehicleMarker);
      } else {
        onSelectMarker(null);
      }
    });

    return () => {
      gisMap.destroy();
      mapSdkRef.current = null;
    };
  }, [isClusteringEnabled, onSelectMarker]);

  // Update Vector Features when `markers` prop changes
  useEffect(() => {
    if (!mapSdkRef.current) return;
    const gisMap = mapSdkRef.current;

    gisMap.features.clearFeatures();

    const sdkMarkers: MapMarker[] = markers.map((m) => ({
      id: m.id,
      coordinate: [m.longitude, m.latitude],
      title: m.name,
      metadata: { markerData: m, status: m.status },
      style: {
        circleRadius: 9,
        fillColor: getStatusColor(m.status),
        strokeColor: "#FFFFFF",
        strokeWidth: 2.5,
      },
    }));

    sdkMarkers.forEach((sm) => gisMap.addMarker(sm, "fleet-cluster-layer"));
  }, [markers]);

  // Update Base Tile
  const handleLayerSwitch = (layer: "street" | "dark") => {
    setCurrentLayer(layer);
    if (!mapSdkRef.current) return;
    if (layer === "dark") {
      mapSdkRef.current.setBaseTile("carto_dark");
    } else {
      mapSdkRef.current.setBaseTile("osm");
    }
  };

  const handleZoomIn = () => {
    mapSdkRef.current?.setZoom(mapSdkRef.current.getZoom() + 1);
  };

  const handleZoomOut = () => {
    mapSdkRef.current?.setZoom(mapSdkRef.current.getZoom() - 1);
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation || !mapSdkRef.current) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      mapSdkRef.current?.setCenterAndZoom(
        [pos.coords.longitude, pos.coords.latitude],
        14,
      );
    });
  };

  const handleFullscreen = () => {
    if (!mapRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      mapRef.current.requestFullscreen();
    }
  };

  return (
    <div className="relative w-full h-[520px] rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800">
      {/* Map Element */}
      <div ref={mapRef} className="w-full h-full" />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-10 text-white space-x-2">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold">
            Updating Vehicle Positions...
          </span>
        </div>
      )}

      {/* Map Custom Controls Bar (Top Right) */}
      <div className="absolute top-3 right-3 z-10 flex flex-col space-y-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md">
        <button
          type="button"
          onClick={handleZoomIn}
          aria-label="Zoom in"
          className="p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-bold transition-colors"
        >
          +
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          aria-label="Zoom out"
          className="p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-bold transition-colors"
        >
          -
        </button>
        <div className="h-px bg-slate-200 dark:bg-slate-800 my-0.5" />
        <button
          type="button"
          onClick={handleLocateMe}
          aria-label="Find current location"
          className="p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs transition-colors"
        >
          🎯
        </button>
        <button
          type="button"
          onClick={handleFullscreen}
          aria-label="Toggle fullscreen"
          className="p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs transition-colors"
        >
          ⛶
        </button>
      </div>

      {/* Layer Switcher & Map Mode Controls (Top Left) */}
      <div className="absolute top-3 left-3 z-10 flex items-center space-x-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md text-xs">
        <button
          type="button"
          onClick={() => handleLayerSwitch("street")}
          className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
            currentLayer === "street"
              ? "bg-blue-600 text-white"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          Street Map
        </button>
        <button
          type="button"
          onClick={() => handleLayerSwitch("dark")}
          className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
            currentLayer === "dark"
              ? "bg-blue-600 text-white"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          Dark Map
        </button>
      </div>

      {/* Interactive Feature Popup Overlay */}
      {selectedMarker && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xl w-64 text-left text-xs space-y-2">
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-2">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">
                  {selectedMarker.name}
                </h4>
                <span className="font-mono text-[11px] text-slate-500">
                  {selectedMarker.licensePlate}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onSelectMarker(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 block">Status</span>
                <span className="font-semibold capitalize text-emerald-600 dark:text-emerald-400">
                  {selectedMarker.status}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Speed</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedMarker.speed} km/h
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Driver</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {selectedMarker.driverName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Updated</span>
                <span className="text-slate-500">
                  {selectedMarker.lastUpdated}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
