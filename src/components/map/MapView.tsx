"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { GISMap, MapMarker, ClusterLayer } from "@gis/map";
import { MapVehicleMarker } from "@/features/dashboard/types/fleet";
import { MapControls } from "./MapControls";
import { MapLegend } from "./MapLegend";
import { MapLayerSwitcher, BaseTileLayerType } from "./MapLayerSwitcher";
import { VehiclePopup } from "./VehiclePopup";

interface MapViewProps {
  markers?: MapVehicleMarker[];
  selectedMarker?: MapVehicleMarker | null;
  onSelectMarker?: (marker: MapVehicleMarker | null) => void;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  heightClass?: string;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
}

export default function MapView({
  markers = [],
  selectedMarker: externalSelectedMarker,
  onSelectMarker,
  isLoading = false,
  isError = false,
  onRetry,
  heightClass = "h-[540px]",
  isFullScreen = false,
  onToggleFullScreen,
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapSdkRef = useRef<GISMap | null>(null);

  const [internalSelectedMarker, setInternalSelectedMarker] =
    useState<MapVehicleMarker | null>(null);
  const [activeTileLayer, setActiveTileLayer] =
    useState<BaseTileLayerType>("street");
  const [isVehicleLayerVisible, setIsVehicleLayerVisible] =
    useState<boolean>(true);
  const [isClusterEnabled, setIsClusterEnabled] = useState<boolean>(true);

  const activeSelectedMarker =
    externalSelectedMarker !== undefined
      ? externalSelectedMarker
      : internalSelectedMarker;

  const handleSelectMarker = useCallback(
    (marker: MapVehicleMarker | null) => {
      setInternalSelectedMarker(marker);
      if (onSelectMarker) {
        onSelectMarker(marker);
      }
    },
    [onSelectMarker],
  );

  // Auto-resize GIS map when container dimensions change (e.g. fullscreen toggle, side drawer collapse)
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const container = mapContainerRef.current;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const triggerResize = () => {
      mapSdkRef.current?.resize();
    };

    const ro = new ResizeObserver(() => {
      triggerResize();
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(triggerResize, 150);
    });

    ro.observe(container);

    const onWindowResize = () => {
      triggerResize();
    };
    window.addEventListener("resize", onWindowResize);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onWindowResize);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // Initialize GIS Map SDK
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const gisMap = new GISMap({
      center: [-0.1278, 51.5074], // London default center
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
    gisMap.initialize(mapContainerRef.current);

    // Register Cluster Layer for vehicle markers
    const clusterLayer = new ClusterLayer(
      { id: "vehicle-cluster-layer", name: "Vehicles Cluster", visible: true },
      {
        enabled: true,
        distance: 40,
        minClusterSize: 2,
        clusterColor: "#2563eb",
      },
    );
    gisMap.layers.addLayer(clusterLayer);

    // Feature Selection Handler
    gisMap.on("featureSelected", ({ feature, coordinate }) => {
      if (feature && feature.properties?.markerData) {
        const markerData = feature.properties.markerData as MapVehicleMarker;
        handleSelectMarker(markerData);
        gisMap.popup.open(coordinate, ""); // position overlay
      } else {
        handleSelectMarker(null);
        gisMap.popup.close();
      }
    });

    return () => {
      gisMap.destroy();
      mapSdkRef.current = null;
    };
  }, [handleSelectMarker]);

  // Sync vector features when `markers` prop changes
  useEffect(() => {
    if (!mapSdkRef.current) return;
    const gisMap = mapSdkRef.current;

    gisMap.features.clearFeatures();
    if (markers.length === 0) return;

    const sdkMarkers: MapMarker[] = markers.map((m) => ({
      id: m.id,
      coordinate: [m.longitude, m.latitude],
      title: m.name,
      metadata: { markerData: m, status: m.status },
      style: {
        circleRadius: 9,
        fillColor:
          m.status === "moving"
            ? "#10B981"
            : m.status === "idle"
              ? "#F59E0B"
              : m.status === "online"
                ? "#3B82F6"
                : "#64748B",
        strokeColor: "#FFFFFF",
        strokeWidth: 2.5,
      },
    }));

    sdkMarkers.forEach((sm) => gisMap.addMarker(sm, "vehicle-cluster-layer"));
  }, [markers]);

  // Base Layer Switching
  const handleLayerSwitch = (layer: BaseTileLayerType) => {
    setActiveTileLayer(layer);
    if (!mapSdkRef.current) return;
    if (layer === "dark") {
      mapSdkRef.current.setBaseTile("carto_dark");
    } else if (layer === "satellite") {
      mapSdkRef.current.setBaseTile("satellite");
    } else {
      mapSdkRef.current.setBaseTile("osm");
    }
  };

  // Zoom In / Out
  const handleZoomIn = () => {
    mapSdkRef.current?.setZoom(mapSdkRef.current.getZoom() + 1);
  };

  const handleZoomOut = () => {
    mapSdkRef.current?.setZoom(mapSdkRef.current.getZoom() - 1);
  };

  // Fit Extent
  const handleZoomToExtent = () => {
    if (!mapSdkRef.current || markers.length === 0) return;
    const lons = markers.map((m) => m.longitude);
    const lats = markers.map((m) => m.latitude);
    const bbox: [number, number, number, number] = [
      Math.min(...lons),
      Math.min(...lats),
      Math.max(...lons),
      Math.max(...lats),
    ];
    mapSdkRef.current.fitExtent(bbox);
  };

  const handleZoomToVehicle = (marker: MapVehicleMarker) => {
    mapSdkRef.current?.setCenterAndZoom(
      [marker.longitude, marker.latitude],
      16,
    );
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

  const handleToggleFullscreen = () => {
    if (onToggleFullScreen) {
      onToggleFullScreen();
      return;
    }
    if (!mapContainerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      mapContainerRef.current.requestFullscreen();
    }
  };

  return (
    <div
      className={`relative w-full ${heightClass} rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800`}
    >
      {/* Canvas Element */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Loading Overlay State */}
      {isLoading && (
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-20 text-white space-x-2">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold">
            Updating GIS Map Data...
          </span>
        </div>
      )}

      {/* Error State Banner */}
      {isError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-red-900/90 text-white text-xs px-4 py-2 rounded-xl shadow-lg flex items-center space-x-3">
          <span>Failed to load vehicle GIS coordinates.</span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="underline font-bold"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Empty State Banner */}
      {!isLoading && !isError && markers.length === 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-slate-900/90 text-slate-200 text-xs px-4 py-2 rounded-xl shadow-md">
          No active vehicles found in this organization.
        </div>
      )}

      {/* Map Controls */}
      <MapControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomToExtent={handleZoomToExtent}
        onLocateMe={handleLocateMe}
        onToggleFullscreen={handleToggleFullscreen}
      />

      {/* Layer Switcher */}
      <MapLayerSwitcher
        activeLayer={activeTileLayer}
        onChangeLayer={handleLayerSwitch}
        isVehicleLayerVisible={isVehicleLayerVisible}
        onToggleVehicleLayer={() => {
          setIsVehicleLayerVisible((p) => !p);
          mapSdkRef.current?.layers.toggleLayer("vehicle-cluster-layer");
        }}
        isClusterEnabled={isClusterEnabled}
        onToggleCluster={() => setIsClusterEnabled((p) => !p)}
      />

      {/* Map Status Legend */}
      <MapLegend />

      {/* Overlay Popup Element */}
      {activeSelectedMarker && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
          <VehiclePopup
            marker={activeSelectedMarker}
            onClose={() => {
              handleSelectMarker(null);
              mapSdkRef.current?.popup.close();
            }}
            onZoomToVehicle={handleZoomToVehicle}
          />
        </div>
      )}
    </div>
  );
}
