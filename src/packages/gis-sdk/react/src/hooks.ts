"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useGISContext } from "./gis-provider";
import { GISMap, MapOptions } from "@gis-sdk/map";
import { LocationUpdate } from "@gis-sdk/tracking";
import { GeofenceDefinition } from "@gis-sdk/geofence";
import { ConnectionState, RealtimeEventPayload } from "@gis-sdk/realtime";

export function useGIS() {
  const { sdk, isReady } = useGISContext();
  return { sdk, isReady };
}

export function useMap(targetId: string, options?: Omit<MapOptions, "target">) {
  const [map, setMap] = useState<GISMap | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || initializedRef.current) return;
    const targetElem = document.getElementById(targetId);
    if (!targetElem) return;

    initializedRef.current = true;
    const gisMap = new GISMap({ target: targetId, ...options });
    setMap(gisMap);

    return () => {
      gisMap.destroy();
      setMap(null);
      initializedRef.current = false;
    };
  }, [targetId]);

  return map;
}

export function useLayers(map: GISMap | null) {
  return map ? map.getLayers() : null;
}

export function useTracking() {
  const { tracking } = useGISContext();
  const [updates, setUpdates] = useState<LocationUpdate[]>([]);

  useEffect(() => {
    const unbind = tracking.subscribeToWorkspace((update) => {
      setUpdates((prev) => [update, ...prev.slice(0, 49)]);
    });
    return unbind;
  }, [tracking]);

  return { tracking, updates };
}

export function useGeofences() {
  const { geofence } = useGISContext();
  const [geofences, setGeofences] = useState<GeofenceDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await geofence.listGeofences();
      if (mountedRef.current) {
        setGeofences(Array.isArray(list) ? list : []);
      }
    } catch {
      if (mountedRef.current) {
        setGeofences([]);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [geofence]);

  useEffect(() => {
    mountedRef.current = true;
    refresh();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    geofence,
    geofences: Array.isArray(geofences) ? geofences : [],
    refresh,
    loading,
  };
}

export function useRealtime(channel?: string) {
  const { realtime } = useGISContext();
  const [state, setState] = useState<ConnectionState>(
    realtime.getConnectionState(),
  );
  const [events, setEvents] = useState<RealtimeEventPayload[]>([]);

  useEffect(() => {
    const unbindState = realtime.onConnectionStateChange(setState);
    let unbindChannel = () => {};

    if (channel) {
      unbindChannel = realtime.subscribe(channel, (event) => {
        setEvents((prev) => [event, ...prev.slice(0, 49)]);
      });
    }

    return () => {
      unbindState();
      unbindChannel();
    };
  }, [realtime, channel]);

  return { realtime, connectionState: state, events };
}

export function useEntitlements() {
  const { entitlements } = useGISContext();
  const [features, setFeatures] = useState<Record<string, boolean>>({});

  const checkFeature = useCallback(
    async (featureKey: string): Promise<boolean> => {
      const has = await entitlements.hasFeature(featureKey);
      setFeatures((prev) => ({ ...prev, [featureKey]: has }));
      return has;
    },
    [entitlements],
  );

  return { entitlements, checkFeature, features };
}

export function useSpatialQuery() {
  const { spatial } = useGISContext();
  return spatial;
}

export function useRules() {
  const { rules, alerts } = useGISContext();
  return { rules, alerts };
}
