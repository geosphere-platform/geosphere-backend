"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";
import { GISSDK, GISSDKConfig } from "@gis-sdk/core";
import { EntitlementsSDK } from "@gis-sdk/entitlements";
import { SpatialSDK } from "@gis-sdk/spatial";
import { GeofenceSDK } from "@gis-sdk/geofence";
import { TrackingSDK } from "@gis-sdk/tracking";
import { RealtimeSDK } from "@gis-sdk/realtime";
import { RulesSDK, AlertsSDK } from "@gis-sdk/rules";

export interface GISContextValue {
  sdk: GISSDK;
  entitlements: EntitlementsSDK;
  spatial: SpatialSDK;
  geofence: GeofenceSDK;
  tracking: TrackingSDK;
  realtime: RealtimeSDK;
  rules: RulesSDK;
  alerts: AlertsSDK;
  isReady: boolean;
}

const GISContext = createContext<GISContextValue | null>(null);

export interface GISProviderProps {
  config: GISSDKConfig;
  children: React.ReactNode;
}

export const GISProvider: React.FC<GISProviderProps> = ({
  config,
  children,
}) => {
  const [isReady, setIsReady] = useState(false);

  const services = useMemo(() => {
    const sdk = GISSDK.configure(config);
    const entitlements = new EntitlementsSDK(sdk.getApiClient());
    const spatial = new SpatialSDK(sdk.getApiClient());
    const geofence = new GeofenceSDK(sdk.getApiClient());
    const tracking = new TrackingSDK(sdk.getApiClient());
    const realtime = new RealtimeSDK();
    const rules = new RulesSDK(sdk.getApiClient());
    const alerts = new AlertsSDK(sdk.getApiClient());

    return {
      sdk,
      entitlements,
      spatial,
      geofence,
      tracking,
      realtime,
      rules,
      alerts,
    };
  }, [
    config.apiBaseUrl,
    config.organizationId,
    config.workspaceId,
    config.accessToken,
  ]);

  useEffect(() => {
    setIsReady(true);
    return () => {
      services.realtime.disconnect();
    };
  }, [services]);

  const value: GISContextValue = {
    ...services,
    isReady,
  };

  return <GISContext.Provider value={value}>{children}</GISContext.Provider>;
};

export const useGISContext = (): GISContextValue => {
  const ctx = useContext(GISContext);
  if (!ctx) {
    throw new Error("useGISContext must be used within a <GISProvider>");
  }
  return ctx;
};
