"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { UserLiveLocation, DEFAULT_INDIA_CENTER } from "../types";

export interface UseUserLiveLocationReturn {
  userLocation: UserLiveLocation;
  isLocating: boolean;
  locationError: string | null;
  requestLiveLocation: () => void;
}

export function useUserLiveLocation(): UseUserLiveLocationReturn {
  const [userLocation, setUserLocation] = useState<UserLiveLocation>({
    latitude: DEFAULT_INDIA_CENTER.latitude,
    longitude: DEFAULT_INDIA_CENTER.longitude,
    accuracyMeters: 20,
    heading: 0,
    speed: 0,
    timestamp: "Default India Location",
    isRealGps: false,
    address: `${DEFAULT_INDIA_CENTER.region}, ${DEFAULT_INDIA_CENTER.country}`,
  });

  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const handleSuccess = useCallback((pos: GeolocationPosition) => {
    setIsLocating(false);
    setLocationError(null);
    setUserLocation({
      latitude: Number(pos.coords.latitude.toFixed(6)),
      longitude: Number(pos.coords.longitude.toFixed(6)),
      accuracyMeters: Math.round(pos.coords.accuracy),
      heading: pos.coords.heading,
      speed: pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 0, // m/s -> km/h
      timestamp: new Date(pos.timestamp).toLocaleTimeString(),
      isRealGps: true,
      address: `Current Live Location (±${Math.round(pos.coords.accuracy)}m)`,
    });
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    setIsLocating(false);
    let msg = "Unable to retrieve GPS location.";
    if (err.code === err.PERMISSION_DENIED) {
      msg = "Location permission denied. Showing default India region.";
    } else if (err.code === err.POSITION_UNAVAILABLE) {
      msg = "GPS position unavailable. Showing default India region.";
    } else if (err.code === err.TIMEOUT) {
      msg = "GPS request timed out. Showing default India region.";
    }
    setLocationError(msg);
  }, []);

  const requestLiveLocation = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.");
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000,
    });
  }, [handleSuccess, handleError]);

  // Start watching user location on mount
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      return;
    }

    setIsLocating(true);

    // Initial position
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000,
    });

    // Continuous watch
    try {
      watchIdRef.current = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 5000,
        },
      );
    } catch {
      // Ignore watch failure
    }

    return () => {
      if (watchIdRef.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [handleSuccess, handleError]);

  return {
    userLocation,
    isLocating,
    locationError,
    requestLiveLocation,
  };
}
