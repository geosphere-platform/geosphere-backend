"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { INITIAL_BUSINESS_MODULES } from "@/database/seed-application-builder";
import { ApplicationPreviewModal } from "@/features/application-builder/components/ApplicationPreviewModal";

export default function ApplicationBuilderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const appId = params.id as string;

  const [activeTab, setActiveTab] = useState<number>(1);
  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [versionHistory, setVersionHistory] = useState<any[]>([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Form State
  const [config, setConfig] = useState<any>(null);
  const [appName, setAppName] = useState("");
  const [appCode, setAppCode] = useState("");
  const [description, setDescription] = useState("");
  const [environment, setEnvironment] = useState("PRODUCTION");
  const [platform, setPlatform] = useState("BOTH");

  const fetchApplicationDetails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/applications/${appId}`);
      const data = await res.json();
      if (data.success && data.data?.application) {
        const item = data.data.application;
        setApp(item);
        setAppName(item.name);
        setAppCode(item.code);
        setDescription(item.description || "");
        setEnvironment(item.environment);
        setPlatform(item.platform);
        setConfig(item.configuration);
      }

      // Fetch version history
      const vRes = await fetch(`/api/v1/applications/${appId}/versions`);
      const vData = await vRes.json();
      if (vData.success && vData.data?.versions) {
        setVersionHistory(vData.data.versions);
      }
    } catch (e) {
      console.error("Failed to load application builder detail", e);
    } finally {
      setLoading(false);
    }
  }, [appId]);

  useEffect(() => {
    if (appId) {
      fetchApplicationDetails();
    }
  }, [appId, fetchApplicationDetails]);

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/applications/${appId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: appName,
          description,
          environment,
          platform,
          configuration: config,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setApp(data.data.application);
        alert("Draft configuration saved successfully.");
      } else {
        alert(data.error || "Failed to save draft");
      }
    } catch (e) {
      alert("Error saving draft configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleValidate = async () => {
    try {
      const res = await fetch(`/api/v1/applications/${appId}/validate`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setValidationResult(data.data.validation);
      }
    } catch (e) {
      console.error("Validation request failed", e);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const res = await fetch(`/api/v1/applications/${appId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          changeSummary: "Published via Admin Application Builder UI",
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(
          `Application successfully published as version ${data.data.application.version}!`,
        );
        fetchApplicationDetails();
      } else {
        alert(data.error || "Failed to publish application configuration");
      }
    } catch (e) {
      alert("Error publishing application");
    } finally {
      setPublishing(false);
    }
  };

  const handleRollback = async (targetVersion: number) => {
    if (
      !confirm(`Are you sure you want to rollback to version ${targetVersion}?`)
    )
      return;
    try {
      const res = await fetch(`/api/v1/applications/${appId}/rollback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetVersion }),
      });
      const data = await res.json();
      if (data.success) {
        alert(
          `Rolled back application configuration to version ${targetVersion}`,
        );
        fetchApplicationDetails();
      } else {
        alert(data.error || "Failed to rollback configuration");
      }
    } catch (e) {
      alert("Error rolling back configuration");
    }
  };

  const toggleModule = (moduleCode: string) => {
    if (!config) return;
    const currentModules: string[] = config.modules || [];
    const isEnabled = currentModules.includes(moduleCode);
    const updatedModules = isEnabled
      ? currentModules.filter((m) => m !== moduleCode && m !== "MAP")
      : [...currentModules, moduleCode];

    setConfig({ ...config, modules: Array.from(new Set(updatedModules)) });
  };

  if (loading || !config) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm animate-pulse">
        Loading Application Builder Environment...
      </div>
    );
  }

  const tabs = [
    { id: 1, label: "1. Overview" },
    { id: 2, label: "2. Branding" },
    { id: 3, label: "3. Modules" },
    { id: 4, label: "4. GIS Layers" },
    { id: 5, label: "5. Map Config" },
    { id: 6, label: "6. Forms" },
    { id: 7, label: "7. Workflows" },
    { id: 8, label: "8. Permissions" },
    { id: 9, label: "9. Location" },
    { id: 10, label: "10. Offline" },
    { id: 11, label: "11. Notifications" },
    { id: 12, label: "12. Dashboard" },
    { id: 13, label: "13. Subscription" },
    { id: 14, label: "14. Versioning" },
    { id: 15, label: "15. Publish" },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 text-gray-900 dark:text-slate-100 transition-colors">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-3">
            <Link
              href="/dashboard/admin/applications"
              className="text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white text-sm transition-colors"
            >
              &larr; Applications
            </Link>
            <span className="text-gray-400 dark:text-slate-600">/</span>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{appName}</h1>
            <span className="text-xs font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-500/20">
              {appCode}
            </span>
          </div>
          <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-slate-400 mt-1">
            <span>
              Status: <strong className="text-emerald-600 dark:text-emerald-400">{app.status}</strong>
            </span>
            <span>&bull;</span>
            <span>
              Version:{" "}
              <strong className="text-gray-700 dark:text-slate-200">v{app.version}</strong>
            </span>
            <span>&bull;</span>
            <span>
              Environment:{" "}
              <strong className="text-gray-700 dark:text-slate-200">{environment}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowPreviewModal(true)}
            className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 font-medium text-xs rounded-lg transition"
          >
            Live Preview
          </button>
          <button
            onClick={handleValidate}
            className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 font-medium text-xs rounded-lg transition"
          >
            Validate Rule Check
          </button>
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded-lg transition shadow-md shadow-blue-500/20"
          >
            {saving ? "Saving..." : "Save Draft"}
          </button>
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-lg transition shadow-md shadow-emerald-500/20"
          >
            {publishing ? "Publishing..." : "Publish Version"}
          </button>
        </div>
      </div>

      {/* 15 Builder Tabs */}
      <div className="flex items-center space-x-1 overflow-x-auto pb-2 border-b border-gray-200 dark:border-slate-800 scrollbar-thin">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition ${
              activeTab === tab.id
                ? "bg-blue-600 text-white shadow"
                : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Builder Tab Content Panels */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-6 shadow-sm dark:shadow-xl transition-colors">
        {/* Tab 1: Overview */}
        {activeTab === 1 && (
          <div className="space-y-4 max-w-2xl">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">
              Application Information
            </h3>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Application Name
              </label>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Application Code
              </label>
              <input
                type="text"
                disabled
                value={appCode}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm font-mono text-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Environment
              </label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm"
              >
                <option value="DEVELOPMENT">DEVELOPMENT</option>
                <option value="STAGING">STAGING</option>
                <option value="PRODUCTION">PRODUCTION</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Target Platform
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm"
              >
                <option value="BOTH">WEB & MOBILE (Both)</option>
                <option value="WEB">WEB ONLY</option>
                <option value="MOBILE">MOBILE ONLY</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm"
              />
            </div>
          </div>
        )}

        {/* Tab 2: White-Label Branding */}
        {activeTab === 2 && (
          <div className="space-y-4 max-w-2xl">
            <h3 className="text-base font-bold text-white mb-4">
              White-Label Branding & Theme
            </h3>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                App Header Title
              </label>
              <input
                type="text"
                value={config.branding?.appTitle || ""}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    branding: { ...config.branding, appTitle: e.target.value },
                  })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Primary Color
                </label>
                <input
                  type="color"
                  value={config.branding?.primaryColor || "#0F172A"}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      branding: {
                        ...config.branding,
                        primaryColor: e.target.value,
                      },
                    })
                  }
                  className="w-full h-10 p-1 bg-slate-950 border border-slate-700 rounded-lg cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Accent Color
                </label>
                <input
                  type="color"
                  value={config.branding?.accentColor || "#3B82F6"}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      branding: {
                        ...config.branding,
                        accentColor: e.target.value,
                      },
                    })
                  }
                  className="w-full h-10 p-1 bg-slate-950 border border-slate-700 rounded-lg cursor-pointer"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Logo Image URL
              </label>
              <input
                type="text"
                placeholder="https://cdn.example.com/logo.png"
                value={config.branding?.logoUrl || ""}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    branding: { ...config.branding, logoUrl: e.target.value },
                  })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm"
              />
            </div>
          </div>
        )}

        {/* Tab 3: Modules */}
        {activeTab === 3 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white mb-2">
              Reusable Module Composer
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Enable or disable capabilities. Dependencies are automatically
              validated before publication.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {INITIAL_BUSINESS_MODULES.map((mod) => {
                const enabled = (config.modules || []).includes(mod.code);
                return (
                  <div
                    key={mod.code}
                    onClick={() => toggleModule(mod.code)}
                    className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                      enabled
                        ? "bg-blue-950/40 border-blue-500/50 text-white"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-sm">{mod.name}</h4>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            enabled
                              ? "bg-blue-500 text-white"
                              : "bg-slate-800 text-slate-500"
                          }`}
                        >
                          {enabled ? "ENABLED" : "DISABLED"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                        {mod.description}
                      </p>
                    </div>
                    {mod.dependencies.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-slate-500">
                        Requires: {mod.dependencies.join(", ")}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 4: GIS Layers */}
        {activeTab === 4 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">
                Configured GIS Layers
              </h3>
              <button
                onClick={() => {
                  const newLayer = {
                    id: `layer_${Date.now()}`,
                    name: "New Vector Layer",
                    geometryType: "Point",
                    enabled: true,
                  };
                  setConfig({
                    ...config,
                    layers: [...(config.layers || []), newLayer],
                  });
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg"
              >
                + Add Layer
              </button>
            </div>
            <div className="space-y-3">
              {(config.layers || []).map((layer: any, idx: number) => (
                <div
                  key={layer.id || idx}
                  className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <span className="font-semibold text-sm text-slate-100">
                      {layer.name}
                    </span>
                    <span className="text-xs text-blue-400 font-mono ml-3">
                      {layer.id}
                    </span>
                    <p className="text-xs text-slate-500">
                      Type: {layer.geometryType || "Point"}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const updated = config.layers.filter(
                        (_: any, i: number) => i !== idx,
                      );
                      setConfig({ ...config, layers: updated });
                    }}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Map Configuration */}
        {activeTab === 5 && (
          <div className="space-y-4 max-w-2xl">
            <h3 className="text-base font-bold text-white mb-4">
              Map Viewport & Basemap Settings
            </h3>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Vector Tile Service Endpoint
              </label>
              <input
                type="text"
                value={
                  config.mapConfig?.vectorTileUrl ||
                  "/api/v1/tiles/{layerId}/{z}/{x}/{y}"
                }
                onChange={(e) =>
                  setConfig({
                    ...config,
                    mapConfig: {
                      ...config.mapConfig,
                      vectorTileUrl: e.target.value,
                    },
                  })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Initial Zoom
                </label>
                <input
                  type="number"
                  value={config.mapConfig?.zoom || 12}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      mapConfig: {
                        ...config.mapConfig,
                        zoom: parseInt(e.target.value) || 12,
                      },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Min Zoom
                </label>
                <input
                  type="number"
                  value={config.mapConfig?.minZoom || 2}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      mapConfig: {
                        ...config.mapConfig,
                        minZoom: parseInt(e.target.value) || 2,
                      },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Max Zoom
                </label>
                <input
                  type="number"
                  value={config.mapConfig?.maxZoom || 18}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      mapConfig: {
                        ...config.mapConfig,
                        maxZoom: parseInt(e.target.value) || 18,
                      },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 14: Versioning */}
        {activeTab === 14 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white mb-4">
              Application Snapshot & Version History
            </h3>
            <div className="space-y-3">
              {versionHistory.map((v) => (
                <div
                  key={v.id}
                  className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-white">
                        Version {v.version}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        {new Date(v.publishedAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {v.changeSummary}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRollback(v.version)}
                    className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-medium rounded-md transition"
                  >
                    Rollback to v{v.version}
                  </button>
                </div>
              ))}
              {versionHistory.length === 0 && (
                <p className="text-slate-500 text-xs italic">
                  No previous published versions found.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Tab 15: Validation & Publish */}
        {activeTab === 15 && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h3 className="text-base font-bold text-white">
                Configuration Rule Verification
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Before publishing to mobile and web clients, the configuration
                validator verifies module dependencies, form schemas, and map
                bounds.
              </p>
            </div>

            {validationResult ? (
              <div
                className={`p-4 rounded-lg border ${
                  validationResult.isValid
                    ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                    : "bg-red-950/30 border-red-500/40 text-red-300"
                }`}
              >
                <div className="font-semibold text-sm mb-2">
                  {validationResult.isValid
                    ? "Configuration Passed All Rules"
                    : "Configuration Validation Failed"}
                </div>
                {validationResult.issues.map((iss: any, i: number) => (
                  <div key={i} className="text-xs mt-1 font-mono">
                    [{iss.severity}] {iss.message}
                  </div>
                ))}
              </div>
            ) : (
              <button
                onClick={handleValidate}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg"
              >
                Run Validation Check Now
              </button>
            )}

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-white">
                  Ready to Deploy?
                </span>
                <p className="text-xs text-slate-400">
                  Publishing generates an immutable version snapshot (v
                  {(app?.version || 1) + 1}).
                </p>
              </div>
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-emerald-500/20 transition"
              >
                {publishing ? "Publishing Snapshot..." : "Publish Application"}
              </button>
            </div>
          </div>
        )}

        {/* Fallback for middle tabs (6..13) */}
        {activeTab >= 6 && activeTab <= 13 && (
          <div className="space-y-3 max-w-2xl py-4">
            <h3 className="text-base font-bold text-white">
              {tabs.find((t) => t.id === activeTab)?.label} Configuration
            </h3>
            <p className="text-xs text-slate-400">
              Configure parameters for this section. Settings are saved into the
              application configuration payload.
            </p>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-400">
              Active configuration payload key:{" "}
              <code className="text-blue-400 font-mono">
                configuration.
                {tabs
                  .find((t) => t.id === activeTab)
                  ?.label.toLowerCase()
                  .replace(/[^a-z]/g, "")}
              </code>
            </div>
          </div>
        )}
      </div>

      {/* Live Preview Modal */}
      <ApplicationPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        config={config}
        appName={appName}
      />
    </div>
  );
}
