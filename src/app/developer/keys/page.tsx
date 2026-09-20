"use client";

import React, { useEffect, useState } from "react";

interface ApiKeyRow {
  id: string;
  keyId: string;
  name: string;
  prefix: string;
  environment: string;
  status: string;
  createdAt: string;
  lastUsedAt?: string;
}

export default function OrganizationKeysPage() {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadKeys = async () => {
    try {
      const res = await fetch("/api/v1/developer/keys");
      const data = await res.json();
      if (data.success) setKeys(data.data);
    } catch (err) {
      console.error("Failed to load keys", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to revoke this API key?")) return;
    try {
      const res = await fetch("/api/v1/developer/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke", keyId }),
      });
      if (res.ok) loadKeys();
    } catch (err) {
      console.error("Failed to revoke", err);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-extrabold text-white">
          API Keys Management
        </h2>
        <p className="text-sm text-slate-400">
          Organization-wide view of all development, staging, and production
          credentials.
        </p>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
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
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  Loading API keys...
                </td>
              </tr>
            ) : keys.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  No active API keys found.
                </td>
              </tr>
            ) : (
              keys.map((k) => (
                <tr
                  key={k.id}
                  className="hover:bg-slate-800/40 transition-colors"
                >
                  <td className="p-4 font-semibold text-slate-200">{k.name}</td>
                  <td className="p-4 font-mono text-cyan-400">{k.prefix}...</td>
                  <td className="p-4 font-medium text-slate-300">
                    {k.environment}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        k.status === "ACTIVE"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {k.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400">
                    {k.lastUsedAt
                      ? new Date(k.lastUsedAt).toLocaleString()
                      : "Never"}
                  </td>
                  <td className="p-4 text-right">
                    {k.status === "ACTIVE" && (
                      <button
                        onClick={() => handleRevokeKey(k.keyId)}
                        className="text-rose-400 hover:text-rose-300 font-medium"
                      >
                        Revoke Key
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
  );
}
