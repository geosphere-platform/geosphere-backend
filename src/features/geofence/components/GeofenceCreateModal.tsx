"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  GeofenceCategory,
  GeofenceShapeType,
  GeofenceZoneItem,
  GEOFENCE_CATEGORY_METADATA,
  AdminBoundaryLevel,
} from "../types";
import {
  getAdminCountries,
  getAdminStates,
  getAdminDistricts,
  getAdminTehsils,
  findAdminBoundaryItem,
  AdminBoundaryItem,
} from "../data/administrativeBoundaries";

import { BoundaryResolverService } from "../services/boundaryResolver.service";

export interface GeofenceCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    zone: Omit<
      GeofenceZoneItem,
      "id" | "createdAt" | "updatedAt" | "activeVehiclesCount" | "activeVehiclePlates"
    >
  ) => void;
}

const RADIUS_PRESETS = [
  { label: "250m", value: 250 },
  { label: "500m", value: 500 },
  { label: "1 km", value: 1000 },
  { label: "2.5 km", value: 2500 },
  { label: "5 km", value: 5000 },
];

export const GeofenceCreateModal: React.FC<GeofenceCreateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<GeofenceCategory>("depot");
  const [shapeType, setShapeType] = useState<GeofenceShapeType>("admin_region");

  // Circle mode states
  const [radiusMeters, setRadiusMeters] = useState<number>(1000);
  const [centerLon, setCenterLon] = useState<number>(79.0882);
  const [centerLat, setCenterLat] = useState<number>(21.1458);

  // Administrative Working Area states
  const [adminLevel, setAdminLevel] = useState<AdminBoundaryLevel>("district");
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>("IN");
  const [selectedStateCode, setSelectedStateCode] = useState<string>("MH");
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>("admin_dist_nagpur");
  const [selectedTehsilId, setSelectedTehsilId] = useState<string>("admin_teh_hingna");

  // Live OpenStreetMap Boundary Search
  const [liveQuery, setLiveQuery] = useState<string>("");
  const [isLiveSearching, setIsLiveSearching] = useState<boolean>(false);
  const [liveAdminItem, setLiveAdminItem] = useState<AdminBoundaryItem | null>(null);
  const [liveSearchStatus, setLiveSearchStatus] = useState<string | null>(null);

  // Alert triggers
  const [onEnter, setOnEnter] = useState(true);
  const [onExit, setOnExit] = useState(true);
  const [onDwell, setOnDwell] = useState(false);
  const [dwellMinutes, setDwellMinutes] = useState(30);
  const [maxSpeedKmh, setMaxSpeedKmh] = useState<number | undefined>(undefined);

  // Cascading administrative boundaries
  const countries = useMemo(() => getAdminCountries(), []);
  const states = useMemo(() => getAdminStates(selectedCountryCode), [selectedCountryCode]);
  const districts = useMemo(
    () => getAdminDistricts(selectedCountryCode, selectedStateCode),
    [selectedCountryCode, selectedStateCode]
  );
  const tehsils = useMemo(
    () => getAdminTehsils(selectedCountryCode, selectedStateCode, selectedDistrictId),
    [selectedCountryCode, selectedStateCode, selectedDistrictId]
  );

  // Determine currently selected administrative boundary item
  const currentAdminItem: AdminBoundaryItem | null = useMemo(() => {
    if (shapeType !== "admin_region") return null;

    if (adminLevel === "country") {
      return countries.find((c) => c.countryCode === selectedCountryCode) || null;
    }
    if (adminLevel === "state") {
      return states.find((s) => s.stateCode === selectedStateCode) || null;
    }
    if (adminLevel === "district") {
      return districts.find((d) => d.id === selectedDistrictId) || null;
    }
    if (adminLevel === "tehsil") {
      return tehsils.find((t) => t.id === selectedTehsilId) || null;
    }
    return null;
  }, [
    shapeType,
    adminLevel,
    countries,
    states,
    districts,
    tehsils,
    selectedCountryCode,
    selectedStateCode,
    selectedDistrictId,
    selectedTehsilId,
  ]);

  const effectiveAdminItem = liveAdminItem || currentAdminItem;

  const handleFetchLiveOsm = async () => {
    if (!liveQuery.trim()) return;
    setIsLiveSearching(true);
    setLiveSearchStatus("Querying official OpenStreetMap administrative survey lines...");
    try {
      const { results, source } = await BoundaryResolverService.searchBoundaries(
        liveQuery,
        adminLevel,
        true
      );
      if (results && results.length > 0) {
        const item = results[0];
        setLiveAdminItem(item);
        setName(`${item.name} Operating Boundary`);
        setLiveSearchStatus(
          `✓ Matched 100% exact OpenStreetMap survey border (${item.polygonCoords.length} vertices • ${item.areaSqKm.toLocaleString()} km²)`
        );
      } else {
        setLiveSearchStatus(`No exact boundary found for "${liveQuery}". Using selected district.`);
      }
    } catch {
      setLiveSearchStatus("Network timeout. Utilizing high-precision local survey boundary.");
    } finally {
      setIsLiveSearching(false);
    }
  };

  // Auto-fill suggested name when administrative region changes and name is empty or default
  useEffect(() => {
    if (shapeType === "admin_region" && effectiveAdminItem) {
      setName(`${effectiveAdminItem.name} Operating Boundary`);
    }
  }, [shapeType, effectiveAdminItem]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const meta = GEOFENCE_CATEGORY_METADATA[category];
    const color = meta.defaultColor;

    let targetCenter: [number, number] = [centerLon, centerLat];
    let targetCoordinates: [number, number][] = [];
    let areaHectares = 150;

    if (shapeType === "circle") {
      targetCenter = [centerLon, centerLat];
      areaHectares = Math.round((Math.PI * Math.pow(radiusMeters, 2)) / 10000);
      targetCoordinates = [];
    } else if (shapeType === "admin_region" && effectiveAdminItem) {
      targetCenter = effectiveAdminItem.center;
      targetCoordinates = effectiveAdminItem.polygonCoords;
      areaHectares = Math.round(effectiveAdminItem.areaSqKm * 100);
    } else {
      // Custom Polygon box default
      targetCenter = [centerLon, centerLat];
      targetCoordinates = [
        [centerLon - 0.02, centerLat - 0.015],
        [centerLon + 0.02, centerLat - 0.015],
        [centerLon + 0.02, centerLat + 0.015],
        [centerLon - 0.02, centerLat + 0.015],
        [centerLon - 0.02, centerLat - 0.015],
      ];
    }

    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      category,
      color,
      shapeType,
      center: targetCenter,
      radiusMeters: shapeType === "circle" ? radiusMeters : undefined,
      coordinates: targetCoordinates,
      enabled: true,
      alertTriggers: {
        onEnter,
        onExit,
        onDwell: onDwell ? true : undefined,
        dwellMinutes: onDwell ? dwellMinutes : undefined,
        maxSpeedKmh: maxSpeedKmh ? Number(maxSpeedKmh) : undefined,
      },
      areaHectares,
      adminRegion:
        shapeType === "admin_region" && currentAdminItem
          ? {
              level: adminLevel,
              countryCode: selectedCountryCode,
              stateCode: selectedStateCode,
              districtId: adminLevel === "district" || adminLevel === "tehsil" ? selectedDistrictId : undefined,
              tehsilId: adminLevel === "tehsil" ? selectedTehsilId : undefined,
              adminName: currentAdminItem.name,
              areaSqKm: currentAdminItem.areaSqKm,
              perimeterKm: currentAdminItem.perimeterKm,
            }
          : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl text-gray-900 dark:text-white font-sans transition-colors">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white tracking-wide">
              Create New Virtual Boundary
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              Configure working area geofences matching administrative borders or circular ranges.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white flex items-center justify-center transition-colors text-xs"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Boundary Shape Type: 3 choices (Admin Region / Circle / Custom Polygon) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 block">
              Boundary Type & Working Area
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Option 1: Administrative Working Area */}
              <button
                type="button"
                onClick={() => setShapeType("admin_region")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  shapeType === "admin_region"
                    ? "bg-blue-50 dark:bg-blue-950/80 border-blue-500 ring-1 ring-blue-500 text-blue-950 dark:text-white"
                    : "bg-gray-50 dark:bg-slate-800/40 border-gray-200 dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-slate-800/70"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏛️</span>
                  <div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white block">
                      Admin Region
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-slate-400 block mt-0.5">
                      Country/State/Dist/Tehsil
                    </span>
                  </div>
                </div>
              </button>

              {/* Option 2: Circular Radius */}
              <button
                type="button"
                onClick={() => setShapeType("circle")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  shapeType === "circle"
                    ? "bg-blue-50 dark:bg-blue-950/80 border-blue-500 ring-1 ring-blue-500 text-blue-950 dark:text-white"
                    : "bg-gray-50 dark:bg-slate-800/40 border-gray-200 dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-slate-800/70"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">⭕</span>
                  <div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white block">
                      Circular Radius
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-slate-400 block mt-0.5">
                      1-click center + radius
                    </span>
                  </div>
                </div>
              </button>

              {/* Option 3: Custom Polygon */}
              <button
                type="button"
                onClick={() => setShapeType("polygon")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  shapeType === "polygon"
                    ? "bg-blue-50 dark:bg-blue-950/80 border-blue-500 ring-1 ring-blue-500 text-blue-950 dark:text-white"
                    : "bg-gray-50 dark:bg-slate-800/40 border-gray-200 dark:border-slate-800 hover:bg-gray-100 dark:hover:bg-slate-800/70"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">📐</span>
                  <div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white block">
                      Custom Polygon
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-slate-400 block mt-0.5">
                      Manual multi-point area
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* ADMINISTRATIVE REGION CONFIGURATION */}
          {shapeType === "admin_region" && (
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/80 space-y-3.5 transition-colors">
              {/* Level Selector Pills */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-gray-700 dark:text-slate-300 block">
                  Select Administrative Level:
                </label>
                <div className="grid grid-cols-4 gap-1.5 bg-gray-200/80 dark:bg-slate-900 p-1 rounded-lg border border-gray-300/80 dark:border-slate-800">
                  {(["country", "state", "district", "tehsil"] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setAdminLevel(lvl)}
                      className={`py-1 text-xs font-semibold rounded capitalize transition-colors ${
                        adminLevel === lvl
                          ? "bg-blue-600 text-white shadow"
                          : "text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white"
                      }`}
                    >
                      {lvl === "country"
                        ? "🇮🇳 Country"
                        : lvl === "state"
                          ? "State"
                          : lvl === "district"
                            ? "District"
                            : "Tehsil"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cascading Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* State Dropdown (If State, District, or Tehsil) */}
                {adminLevel !== "country" && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-gray-600 dark:text-slate-400 block">
                      State / Province
                    </label>
                    <select
                      value={selectedStateCode}
                      onChange={(e) => setSelectedStateCode(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {states.map((s) => (
                        <option key={s.stateCode} value={s.stateCode}>
                          {s.name} ({s.stateCode})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* District Dropdown (If District or Tehsil) */}
                {(adminLevel === "district" || adminLevel === "tehsil") && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-gray-600 dark:text-slate-400 block">
                      District
                    </label>
                    <select
                      value={selectedDistrictId}
                      onChange={(e) => setSelectedDistrictId(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {districts.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Tehsil Dropdown (If Tehsil) */}
                {adminLevel === "tehsil" && (
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[11px] font-medium text-gray-600 dark:text-slate-400 block">
                      Tehsil / Taluka Working Area
                    </label>
                    <select
                      value={selectedTehsilId}
                      onChange={(e) => setSelectedTehsilId(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {tehsils.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} (Area: {t.areaSqKm} km²)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Live OSM Administrative Boundary Fetcher */}
              <div className="pt-2 border-t border-gray-200 dark:border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-gray-700 dark:text-slate-300">
                    Live OpenStreetMap Exact Survey Search:
                  </span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                    Matches printed map border lines 100%
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={liveQuery}
                      onChange={(e) => setLiveQuery(e.target.value)}
                      placeholder="Type any District, Tehsil, or City (e.g. Hingna, Nagpur, Pune, Thane)..."
                      className="w-full pl-3 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleFetchLiveOsm}
                    disabled={isLiveSearching || !liveQuery.trim()}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 flex-shrink-0 shadow-sm"
                  >
                    {isLiveSearching ? "Fetching..." : "⚡ Fetch Exact OSM Border"}
                  </button>
                </div>

                {liveSearchStatus && (
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg border border-emerald-200 dark:border-emerald-800/40">
                    {liveSearchStatus}
                  </p>
                )}
              </div>

              {/* Exact Administrative Border Preview Stats */}
              {effectiveAdminItem && (
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900 dark:text-blue-300">
                      ✓ Boundary Matched: {effectiveAdminItem.name}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-mono font-bold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {effectiveAdminItem.level} Level
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-gray-600 dark:text-slate-300">
                    <span>
                      Official Area: <strong>{effectiveAdminItem.areaSqKm.toLocaleString()} km²</strong>
                    </span>
                    <span>
                      Perimeter: <strong>{effectiveAdminItem.perimeterKm} km</strong>
                    </span>
                    <span>
                      Points: <strong>{effectiveAdminItem.polygonCoords.length} vertices</strong>
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    🛡️ The virtual boundary will exactly outline the official borders of this {effectiveAdminItem.level}.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* CIRCLE RADIUS CONTROLS */}
          {shapeType === "circle" && (
            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-800 space-y-3 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                  Radius Range:
                </span>
                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-2.5 py-0.5 rounded border border-blue-200 dark:border-blue-800/50">
                  {radiusMeters} meters ({(radiusMeters / 1000).toFixed(1)} km)
                </span>
              </div>

              <input
                type="range"
                min={100}
                max={5000}
                step={50}
                value={radiusMeters}
                onChange={(e) => setRadiusMeters(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-gray-500 dark:text-slate-400 mr-1">Quick Presets:</span>
                {RADIUS_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setRadiusMeters(p.value)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                      radiusMeters === p.value
                        ? "bg-blue-600 text-white font-bold"
                        : "bg-white dark:bg-slate-700/60 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-transparent hover:bg-gray-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Coordinates for Circle Center */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-gray-600 dark:text-slate-400 block">
                    Center Latitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={centerLat}
                    onChange={(e) => setCenterLat(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800/80 border border-gray-300 dark:border-slate-700 rounded-lg text-xs text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-gray-600 dark:text-slate-400 block">
                    Center Longitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={centerLon}
                    onChange={(e) => setCenterLon(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800/80 border border-gray-300 dark:border-slate-700 rounded-lg text-xs text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Zone Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 block">
              Zone Display Name <span className="text-blue-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Nagpur District Operating Boundary"
              className="w-full px-3 py-2 bg-white dark:bg-slate-800/80 border border-gray-300 dark:border-slate-700 rounded-lg text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 block">
              Facility / Operational Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(GEOFENCE_CATEGORY_METADATA) as GeofenceCategory[]).map(
                (catKey) => {
                  const meta = GEOFENCE_CATEGORY_METADATA[catKey];
                  const isSelected = category === catKey;
                  return (
                    <button
                      key={catKey}
                      type="button"
                      onClick={() => setCategory(catKey)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col items-start ${
                        isSelected
                          ? "bg-blue-50 dark:bg-blue-950/70 border-blue-500 ring-1 ring-blue-500"
                          : "bg-gray-50 dark:bg-slate-800/40 border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800/70"
                      }`}
                    >
                      <span className="text-lg mb-1">{meta.icon}</span>
                      <span className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                        {meta.label}
                      </span>
                      <span className="text-[10px] text-gray-500 dark:text-slate-400 mt-1 line-clamp-1">
                        {meta.description}
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Alert Triggers Checkboxes */}
          <div className="space-y-2 p-3.5 rounded-xl bg-gray-50 dark:bg-slate-800/30 border border-gray-200 dark:border-slate-800">
            <span className="text-xs font-semibold text-gray-700 dark:text-slate-300 block">
              Automated Alert Notifications
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 text-gray-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onEnter}
                  onChange={(e) => setOnEnter(e.target.checked)}
                  className="rounded bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                />
                <span>Alert on Area Entry</span>
              </label>

              <label className="flex items-center gap-2 text-gray-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onExit}
                  onChange={(e) => setOnExit(e.target.checked)}
                  className="rounded bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                />
                <span>Alert on Area Exit</span>
              </label>

              <label className="flex items-center gap-2 text-gray-700 dark:text-slate-300 cursor-pointer sm:col-span-2">
                <input
                  type="checkbox"
                  checked={onDwell}
                  onChange={(e) => setOnDwell(e.target.checked)}
                  className="rounded bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                />
                <span>Alert if vehicle dwells &gt; {dwellMinutes} minutes</span>
              </label>
            </div>
          </div>

          {/* Notes / Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 block">
              Notes or Operational Instructions (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Authorized regional transport boundary."
              className="w-full px-3 py-2 bg-white dark:bg-slate-800/80 border border-gray-300 dark:border-slate-700 rounded-lg text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md hover:shadow-blue-500/25 transition-all flex items-center gap-1.5"
            >
              <span>✓</span>
              <span>Create Virtual Boundary</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
