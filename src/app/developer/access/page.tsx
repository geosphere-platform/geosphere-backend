"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Credential {
  id: string;
  name: string;
  tokenPrefix: string;
  allowedPackages: string[];
  status: string;
  expiresAt?: string;
  lastUsedAt?: string;
  createdAt: string;
  applicationId: string;
}

interface NewCredentialResult {
  credential: Credential;
  tokenPrefix: string;
  rawToken: string;
  installConfig: string;
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    ACTIVE: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    EXPIRED: "bg-slate-500/15 text-slate-400 border-slate-500/30",
    REVOKED: "bg-red-500/15 text-red-400 border-red-500/30",
  };
  return map[status] ?? "bg-slate-500/15 text-slate-400 border-slate-500/30";
}

export default function PackageAccessPage() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(false);
  const [newResult, setNewResult] = useState<NewCredentialResult | null>(null);
  const [form, setForm] = useState({
    applicationId: "",
    name: "",
    allowedPackages: "@gis-platform/gis-web-sdk",
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCredentials = (appId: string) => {
    if (!appId) return;
    setLoading(true);
    fetch(`/api/v1/developer/package-credentials?applicationId=${appId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCredentials(d.data);
      })
      .finally(() => setLoading(false));
  };

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    setNewResult(null);
    try {
      const res = await fetch("/api/v1/developer/package-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: form.applicationId,
          name: form.name || undefined,
          allowedPackages: form.allowedPackages.split(",").map((s) => s.trim()),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewResult(data.data);
        loadCredentials(form.applicationId);
      } else {
        setError(data.error?.message ?? "Failed to create credential");
      }
    } catch {
      setError("Failed to create credential");
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (credId: string) => {
    if (
      !confirm(
        "Revoke this credential? Downloads using this token will be blocked immediately.",
      )
    )
      return;
    await fetch(`/api/v1/developer/package-credentials/${credId}`, {
      method: "DELETE",
    });
    setCredentials((prev) => prev.filter((c) => c.id !== credId));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Package Access
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Scoped credentials for installing SDK packages from the private
          registry
        </p>
      </div>

      {/* Security model */}
      <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 text-sm">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex items-start gap-2">
            <span className="text-lg">🔐</span>
            <div>
              <p className="text-slate-300 font-medium text-xs mb-0.5">
                Scoped Read-Only
              </p>
              <p className="text-slate-500 text-xs">
                Only packages you are licensed to access
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-lg">👁️</span>
            <div>
              <p className="text-slate-300 font-medium text-xs mb-0.5">
                Shown Once
              </p>
              <p className="text-slate-500 text-xs">
                Raw token displayed once — store it securely
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-lg">🚫</span>
            <div>
              <p className="text-slate-300 font-medium text-xs mb-0.5">
                No Write Access
              </p>
              <p className="text-slate-500 text-xs">
                Customers cannot publish to the registry
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Create credential */}
      <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-6">
        <h2 className="text-base font-bold text-white mb-4">
          Generate Package Credential
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Application ID
            </label>
            <input
              type="text"
              value={form.applicationId}
              onChange={(e) => {
                setForm((f) => ({ ...f, applicationId: e.target.value }));
                loadCredentials(e.target.value);
              }}
              placeholder="Your application UUID"
              className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Label (optional)
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Production Server"
              className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Allowed Packages (comma-separated)
            </label>
            <input
              type="text"
              value={form.allowedPackages}
              onChange={(e) =>
                setForm((f) => ({ ...f, allowedPackages: e.target.value }))
              }
              className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2.5 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
            />
          </div>
        </div>

        {error && <p className="text-red-400 text-sm mt-3">⚠️ {error}</p>}

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleCreate}
            disabled={creating || !form.applicationId}
            className="px-6 py-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 font-semibold text-sm hover:bg-cyan-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? "Generating…" : "Generate Token"}
          </button>
        </div>

        {/* Show raw token — ONCE */}
        {newResult && (
          <div className="mt-5 bg-amber-950/30 border border-amber-700/40 rounded-xl p-4">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="text-amber-400 font-bold text-sm">
                  Store this token now — it will NOT be shown again
                </p>
                <p className="text-amber-300/70 text-xs mt-0.5">
                  Set as environment variable:{" "}
                  <code className="font-mono">GIS_PLATFORM_PACKAGE_TOKEN</code>
                </p>
              </div>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-sm text-white break-all select-all">
              {newResult.rawToken}
            </div>
            <div className="mt-3">
              <p className="text-xs text-slate-400 font-semibold mb-2">
                .npmrc configuration:
              </p>
              <pre className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 overflow-x-auto">
                {newResult.installConfig}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Existing credentials */}
      {credentials.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-white mb-4">
            Existing Credentials
          </h2>
          <div className="space-y-3">
            {credentials.map((c) => (
              <div
                key={c.id}
                className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4 flex items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-medium text-sm">
                      {c.name}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${statusBadge(c.status)}`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-slate-500">
                    {c.tokenPrefix}••••••••
                  </p>
                  <div className="flex gap-3 mt-1.5 text-xs text-slate-500">
                    <span>
                      Created: {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                    {c.lastUsedAt && (
                      <span>
                        Last used: {new Date(c.lastUsedAt).toLocaleDateString()}
                      </span>
                    )}
                    {c.expiresAt && (
                      <span>
                        Expires: {new Date(c.expiresAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                {c.status === "ACTIVE" && (
                  <button
                    onClick={() => handleRevoke(c.id)}
                    className="px-3 py-1.5 text-xs rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
