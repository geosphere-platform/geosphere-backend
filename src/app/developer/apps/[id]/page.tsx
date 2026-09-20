"use client";

import React, { useEffect, useState, useCallback, use } from "react";
import { SecretKeyModal } from "@/components/developer/secret-key-modal";

interface ApplicationDetailsData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  type: string;
  status: string;
  environment: string;
  clientId: string;
  allowedOrigins: string[];
  grantedScopes: string[];
  activeKeysCount: number;
  enabledSdkModules: string[];
  createdAt: string;
  updatedAt: string;
}

interface ApiKeyItem {
  id: string;
  keyId: string;
  name: string;
  prefix: string;
  environment: string;
  status: string;
  createdAt: string;
  lastUsedAt?: string;
}

export default function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [app, setApp] = useState<ApplicationDetailsData | null>(null);
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "keys" | "scopes" | "origins" | "modules"
  >("keys");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [newKeyData, setNewKeyData] = useState<{
    rawSecretKey: string;
    keyName: string;
  } | null>(null);

  // New Key Form State
  const [newKeyName, setNewKeyName] = useState("");
  const [creatingKey, setCreatingKey] = useState(false);

  const loadAppData = useCallback(async () => {
    try {
      const [appRes, keysRes] = await Promise.all([
        fetch(`/api/v1/developer/apps/${id}`),
        fetch(`/api/v1/developer/keys?applicationId=${id}`),
      ]);
      const appData = await appRes.json();
      const keysData = await keysRes.json();

      if (appData.success) setApp(appData.data);
      if (keysData.success) setKeys(keysData.data);
    } catch (err) {
      console.error("Failed to load application details", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadAppData();
  }, [loadAppData]);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim() || !app) return;

    setCreatingKey(true);
    try {
      const res = await fetch("/api/v1/developer/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: app.id,
          name: newKeyName.trim(),
          environment: app.environment,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNewKeyData({
          rawSecretKey: data.data.rawSecretKey,
          keyName: data.data.apiKey.name,
        });
        setModalOpen(true);
        setNewKeyName("");
        loadAppData();
      }
    } catch (err) {
      console.error("Failed to create key", err);
    } finally {
      setCreatingKey(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (
      !confirm(
        "Are you sure you want to revoke this API key? This action is permanent.",
      )
    )
      return;

    try {
      const res = await fetch("/api/v1/developer/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "revoke",
          keyId,
        }),
      });
      if (res.ok) loadAppData();
    } catch (err) {
      console.error("Failed to revoke key", err);
    }
  };

  const handleAction = async (action: "suspend" | "reactivate" | "archive") => {
    try {
      const res = await fetch(`/api/v1/developer/apps/${id}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) loadAppData();
    } catch (err) {
      console.error("Failed action", err);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm">
        Loading application configuration...
      </div>
    );
  }

  if (!app) {
    return (
      <div className="p-8 text-center text-rose-400 text-sm">
        Application not found
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Info */}
      <div className="p-8 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-extrabold text-white">{app.name}</h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                  app.environment === "PRODUCTION"
                    ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                    : app.environment === "STAGING"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                }`}
              >
                {app.environment}
              </span>
              <span
                className={`text-xs font-semibold ${app.status === "ACTIVE" ? "text-emerald-400" : "text-rose-400"}`}
              >
                ● {app.status}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {app.description || "No description provided."}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {app.status === "ACTIVE" ? (
              <button
                onClick={() => handleAction("suspend")}
                className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-xl text-xs font-semibold"
              >
                Suspend App
              </button>
            ) : (
              <button
                onClick={() => handleAction("reactivate")}
                className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-semibold"
              >
                Reactivate App
              </button>
            )}
            <button
              onClick={() => handleAction("archive")}
              className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-semibold"
            >
              Archive
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800 text-xs">
          <div className="space-y-1">
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
              Public Client Identifier (clientId)
            </span>
            <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 font-mono text-cyan-400 text-xs select-all">
              {app.clientId}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
              Application Type
            </span>
            <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 font-medium text-slate-200 text-xs">
              {app.type}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
              Active Credentials Count
            </span>
            <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 font-medium text-slate-200 text-xs">
              {app.activeKeysCount} Active API Keys
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        {(["keys", "scopes", "origins", "modules"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all capitalize ${
              activeTab === tab
                ? "bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab === "keys"
              ? "🔑 API Keys & Credentials"
              : tab === "scopes"
                ? "🛡️ Granted Scopes"
                : tab === "origins"
                  ? "🌐 Allowed Origins"
                  : "🧩 Enabled SDK Modules"}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "keys" && (
        <div className="space-y-6">
          {/* Create Key Form */}
          <form
            onSubmit={handleCreateKey}
            className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col md:flex-row gap-4 items-end"
          >
            <div className="flex-1 space-y-1.5 w-full">
              <label className="text-xs font-medium text-slate-300">
                New API Key Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Production Web SDK Key"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
            <button
              type="submit"
              disabled={creatingKey}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl text-xs transition-all shrink-0 w-full md:w-auto"
            >
              {creatingKey ? "Generating..." : "+ Generate API Key"}
            </button>
          </form>

          {/* Keys Table */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Key Name</th>
                  <th className="p-4">Key Prefix</th>
                  <th className="p-4">Environment</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Last Used</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {keys.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No API keys generated yet for this application.
                    </td>
                  </tr>
                ) : (
                  keys.map((k) => (
                    <tr
                      key={k.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="p-4 font-semibold text-slate-200">
                        {k.name}
                      </td>
                      <td className="p-4 font-mono text-cyan-400">
                        {k.prefix}...
                      </td>
                      <td className="p-4 font-medium text-slate-300">
                        {k.environment}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${k.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}
                        >
                          {k.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400">
                        {k.lastUsedAt
                          ? new Date(k.lastUsedAt).toLocaleString()
                          : "Never"}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {k.status === "ACTIVE" && (
                          <button
                            onClick={() => handleRevokeKey(k.keyId)}
                            className="text-rose-400 hover:text-rose-300 text-xs font-medium"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "scopes" && (
        <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
          <h3 className="font-bold text-white text-sm">
            Granted API Permissions & Scopes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {app.grantedScopes.map((scope) => (
              <div
                key={scope}
                className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between"
              >
                <span className="font-mono text-cyan-400 text-xs">{scope}</span>
                <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded">
                  Granted
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "origins" && (
        <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
          <h3 className="font-bold text-white text-sm">
            Allowed Browser Origins (CORS)
          </h3>
          <div className="space-y-2">
            {app.allowedOrigins.map((origin, i) => (
              <div
                key={i}
                className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-cyan-400 text-xs"
              >
                {origin}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "modules" && (
        <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
          <h3 className="font-bold text-white text-sm">
            SDK Module Entitlements Status
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              "MAP",
              "LAYERS",
              "TRACKING",
              "GEOFENCE",
              "REALTIME",
              "ANALYTICS",
              "RULES",
            ].map((mod) => {
              const enabled = app.enabledSdkModules.includes(mod);
              return (
                <div
                  key={mod}
                  className={`p-4 rounded-xl border space-y-1 ${enabled ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" : "bg-slate-950 border-slate-800 text-slate-500 opacity-60"}`}
                >
                  <div className="text-xs font-bold">{mod}</div>
                  <div className="text-[10px] uppercase font-semibold">
                    {enabled ? "✓ Enabled" : "✕ Disabled"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* One-time secret key modal */}
      {newKeyData && (
        <SecretKeyModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          rawSecretKey={newKeyData.rawSecretKey}
          keyName={newKeyData.keyName}
          environment={app.environment}
        />
      )}
    </div>
  );
}
