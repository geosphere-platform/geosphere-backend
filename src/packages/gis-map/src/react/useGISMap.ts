/**
 * GIS Map SDK — React useGISMap Hook
 *
 * Manages map initialization, container resize observer, and lifecycle cleanup safely.
 */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { GISMap } from "../map/map";
import { MapOptions } from "../types";

export function useGISMap(options?: Partial<MapOptions>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GISMap | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    if (!mapRef.current) {
      const mapInstance = new GISMap(options);
      mapRef.current = mapInstance;

      mapInstance.initialize(containerRef.current, options);
      setIsReady(true);
    }

    const currentContainer = containerRef.current;
    let resizeObserver: ResizeObserver | null = null;

    if (typeof ResizeObserver !== "undefined" && currentContainer) {
      resizeObserver = new ResizeObserver(() => {
        if (mapRef.current) {
          mapRef.current.resize();
        }
      });
      resizeObserver.observe(currentContainer);
    }

    return () => {
      if (resizeObserver && currentContainer) {
        resizeObserver.unobserve(currentContainer);
        resizeObserver.disconnect();
      }
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
      setIsReady(false);
    };
  }, []);

  return {
    containerRef,
    // eslint-disable-next-line react-hooks/refs
    map: mapRef.current,
    isReady,
  };
}
