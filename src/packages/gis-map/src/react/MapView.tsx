/**
 * GIS Map SDK — React MapView Component
 *
 * Thin, high-performance React component for embedding a GIS Map SDK instance.
 */

"use client";

import React, { useEffect, useRef } from "react";
import { GISMap } from "../map/map";
import { MapOptions } from "../types";

export interface MapViewComponentProps {
  options?: Partial<MapOptions>;
  className?: string;
  onMapReady?: (map: GISMap) => void;
  children?: React.ReactNode;
}

export const MapView: React.FC<MapViewComponentProps> = ({
  options,
  className = "w-full h-[500px] relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800",
  onMapReady,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<GISMap | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    // Load OpenLayers CSS dynamically in client browser
    import("ol/ol.css").catch(() => {});

    const map = new GISMap(options);
    mapInstanceRef.current = map;
    map.initialize(containerRef.current, options);

    if (onMapReady) {
      onMapReady(map);
    }

    const currentContainer = containerRef.current;
    let observer: ResizeObserver | null = null;

    if (typeof ResizeObserver !== "undefined" && currentContainer) {
      observer = new ResizeObserver(() => {
        map.resize();
      });
      observer.observe(currentContainer);
    }

    return () => {
      if (observer && currentContainer) {
        observer.unobserve(currentContainer);
        observer.disconnect();
      }
      map.destroy();
      mapInstanceRef.current = null;
    };
  }, []);

  return (
    <div className={className}>
      <div ref={containerRef} className="w-full h-full" />
      {children}
    </div>
  );
};
