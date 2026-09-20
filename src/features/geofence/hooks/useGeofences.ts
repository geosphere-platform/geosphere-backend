import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  GeofenceZoneItem,
  GeofenceFilterState,
  GeofenceStats,
  GeofenceCategory,
  GeofenceShapeType,
} from "../types";
import { DEFAULT_GEOFENCE_ZONES } from "../mock/mockGeofences";

export interface UseGeofencesReturn {
  // Data
  zones: GeofenceZoneItem[];
  filteredZones: GeofenceZoneItem[];
  stats: GeofenceStats;
  selectedZoneId: string | null;
  selectedZone: GeofenceZoneItem | null;
  filterState: GeofenceFilterState;

  // Modals & Drawers
  isCreateModalOpen: boolean;
  isDetailsDrawerOpen: boolean;
  zoneToDelete: GeofenceZoneItem | null;

  // Fullscreen State
  isFullscreen: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;

  // Actions
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (category: "all" | GeofenceCategory) => void;
  setShapeFilter: (shape: "all" | GeofenceShapeType) => void;
  selectZone: (id: string | null) => void;
  setIsCreateModalOpen: (open: boolean) => void;
  setIsDetailsDrawerOpen: (open: boolean) => void;
  setZoneToDelete: (zone: GeofenceZoneItem | null) => void;
  toggleFullscreen: () => void;
  addZone: (
    newZone: Omit<
      GeofenceZoneItem,
      "id" | "createdAt" | "updatedAt" | "activeVehiclesCount" | "activeVehiclePlates"
    > & { activeVehiclePlates?: string[] }
  ) => void;
  toggleZoneEnabled: (id: string) => void;
  deleteZone: (id: string) => void;
  updateZone: (id: string, updates: Partial<GeofenceZoneItem>) => void;
}

export function useGeofences(): UseGeofencesReturn {
  const [zones, setZones] = useState<GeofenceZoneItem[]>(DEFAULT_GEOFENCE_ZONES);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(
    DEFAULT_GEOFENCE_ZONES[0]?.id || null
  );

  const [filterState, setFilterState] = useState<GeofenceFilterState>({
    searchQuery: "",
    category: "all",
    shape: "all",
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const [zoneToDelete, setZoneToDelete] = useState<GeofenceZoneItem | null>(null);

  // Fullscreen Support
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Listen to browser fullscreen changes & Escape key
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isDocFs = !!document.fullscreenElement;
      if (!isDocFs && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        setIsFullscreen(false);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen]);

  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  // Setters for filters
  const setSearchQuery = useCallback((query: string) => {
    setFilterState((prev) => ({ ...prev, searchQuery: query }));
  }, []);

  const setCategoryFilter = useCallback((category: "all" | GeofenceCategory) => {
    setFilterState((prev) => ({ ...prev, category }));
  }, []);

  const setShapeFilter = useCallback((shape: "all" | GeofenceShapeType) => {
    setFilterState((prev) => ({ ...prev, shape }));
  }, []);

  // Filtered zones calculation
  const filteredZones = useMemo(() => {
    return zones.filter((zone) => {
      // Query filter
      if (filterState.searchQuery.trim()) {
        const q = filterState.searchQuery.toLowerCase();
        const matchesName = zone.name.toLowerCase().includes(q);
        const matchesDesc = (zone.description || "").toLowerCase().includes(q);
        const matchesPlate = zone.activeVehiclePlates.some((p) =>
          p.toLowerCase().includes(q)
        );
        if (!matchesName && !matchesDesc && !matchesPlate) return false;
      }

      // Category filter
      if (filterState.category !== "all" && zone.category !== filterState.category) {
        return false;
      }

      // Shape filter
      if (filterState.shape !== "all" && zone.shapeType !== filterState.shape) {
        return false;
      }

      return true;
    });
  }, [zones, filterState]);

  // Key performance indicators calculation
  const stats: GeofenceStats = useMemo(() => {
    const total = zones.length;
    const active = zones.filter((z) => z.enabled).length;
    const vehiclesInside = zones.reduce((acc, z) => acc + (z.activeVehiclesCount || 0), 0);
    // Simulated alerts count (sum of vehicles inside + active zones trigger activity)
    const alertsToday = 14 + vehiclesInside * 2;

    return {
      total,
      active,
      vehiclesInside,
      alertsToday,
    };
  }, [zones]);

  const selectedZone = useMemo(() => {
    return zones.find((z) => z.id === selectedZoneId) || null;
  }, [zones, selectedZoneId]);

  const selectZone = useCallback((id: string | null) => {
    setSelectedZoneId(id);
    if (id) {
      setIsDetailsDrawerOpen(true);
    }
  }, []);

  // CRUD actions
  const addZone = useCallback(
    (
      newZone: Omit<
        GeofenceZoneItem,
        "id" | "createdAt" | "updatedAt" | "activeVehiclesCount" | "activeVehiclePlates"
      > & { activeVehiclePlates?: string[] }
    ) => {
      const id = `geo-${Date.now().toString(36)}`;
      const plates = newZone.activeVehiclePlates || [];
      const created: GeofenceZoneItem = {
        ...newZone,
        id,
        activeVehiclesCount: plates.length,
        activeVehiclePlates: plates,
        createdAt: new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString().split("T")[0],
      };
      setZones((prev) => [created, ...prev]);
      setSelectedZoneId(id);
      setIsCreateModalOpen(false);
    },
    []
  );

  const toggleZoneEnabled = useCallback((id: string) => {
    setZones((prev) =>
      prev.map((z) => (z.id === id ? { ...z, enabled: !z.enabled } : z))
    );
  }, []);

  const deleteZone = useCallback(
    (id: string) => {
      setZones((prev) => prev.filter((z) => z.id !== id));
      if (selectedZoneId === id) {
        setSelectedZoneId(null);
        setIsDetailsDrawerOpen(false);
      }
      setZoneToDelete(null);
    },
    [selectedZoneId]
  );

  const updateZone = useCallback((id: string, updates: Partial<GeofenceZoneItem>) => {
    setZones((prev) =>
      prev.map((z) => (z.id === id ? { ...z, ...updates, updatedAt: new Date().toISOString() } : z))
    );
  }, []);

  return {
    zones,
    filteredZones,
    stats,
    selectedZoneId,
    selectedZone,
    filterState,
    isCreateModalOpen,
    isDetailsDrawerOpen,
    zoneToDelete,
    isFullscreen,
    containerRef,
    setSearchQuery,
    setCategoryFilter,
    setShapeFilter,
    selectZone,
    setIsCreateModalOpen,
    setIsDetailsDrawerOpen,
    setZoneToDelete,
    toggleFullscreen,
    addZone,
    toggleZoneEnabled,
    deleteZone,
    updateZone,
  };
}
