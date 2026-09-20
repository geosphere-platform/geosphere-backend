"use client";

import { useEffect, useState, useCallback } from "react";
import { UserProfile } from "../types";
import { Permission } from "@/core/constants";
import { DashboardService } from "../services/dashboard.service";
import { startTokenRefresh, stopTokenRefresh } from "@/core/auth/token-refresh";

export interface UseDashboardAuthReturn {
  user: UserProfile | null;
  permissions: Permission[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  logout: () => Promise<void>;
}

export function useDashboardAuth(): UseDashboardAuthReturn {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await DashboardService.fetchCurrentUser();
      setUser(data.user);
      setPermissions(data.permissions);
      // Start silent token refresh now that session is confirmed valid
      startTokenRefresh();
    } catch (err) {
      setUser(null);
      setPermissions([]);
      setError(err instanceof Error ? err.message : "Authentication error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Stop token refresh timer before logout
      stopTokenRefresh();
      await fetch("/api/v1/auth/logout", { method: "POST" });
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setPermissions([]);
      localStorage.removeItem("gis_access_token");
      document.cookie = "gis_access_token=; path=/; max-age=0";
      window.location.assign("/login");
    }
  }, []);

  useEffect(() => {
    let isSubscribed = true;
    const load = async () => {
      if (isSubscribed) {
        await fetchSession();
      }
    };
    load();
    return () => {
      isSubscribed = false;
    };
  }, [fetchSession]);

  return {
    user,
    permissions,
    isLoading,
    error,
    refetch: fetchSession,
    logout,
  };
}
