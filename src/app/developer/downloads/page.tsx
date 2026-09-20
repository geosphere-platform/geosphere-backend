"use client";

import { useEffect, useState } from "react";

interface DownloadRecord {
  id: string;
  organizationId: string;
  applicationId?: string;
  productId: string;
  versionString?: string;
  environment?: string;
  downloadMethod?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export default function DownloadsPage() {
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/developer/downloads?limit=50")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setDownloads(d.data);
        else setError(d.error?.message ?? "Failed to load download history");
      })
      .catch(() => setError("Failed to load download history"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Download History
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            SDK package download and access audit log
          </p>
        </div>
        <div className="text-xs text-slate-500 bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2">
          Last 50 events
        </div>
      </div>

      {/* Privacy notice */}
      <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-3 text-xs text-slate-500 flex items-center gap-2">
        <span>🛡️</span>
        <span>
          Download events are logged for security and compliance. No source code
          or sensitive data is collected.
        </span>
      </div>

      {loading && (
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-4 h-4 border-2 border-slate-600 border-t-cyan-400 rounded-full animate-spin" />
          Loading history…
        </div>
      )}

      {error && (
        <div className="bg-red-950/30 border border-red-800/30 rounded-xl p-4 text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {!loading && !error && downloads.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <div className="text-4xl mb-4">⬇️</div>
          <p className="text-lg font-medium text-slate-400">No downloads yet</p>
          <p className="text-sm mt-2">
            SDK package download events will appear here once you start
            installing packages.
          </p>
        </div>
      )}

      {!loading && downloads.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800/60">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Package
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Version
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Environment
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Method
                  </th>
                </tr>
              </thead>
              <tbody>
                {downloads.map((d) => (
                  <tr
                    key={d.id}
                    className="border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors"
                  >
                    <td className="px-6 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(d.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-300 truncate max-w-[200px]">
                      {(d.metadata as any)?.packageName ??
                        d.productId.slice(0, 16) + "…"}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-400">
                      {d.versionString ? `v${d.versionString}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {d.environment && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${
                            d.environment === "PRODUCTION"
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              : "bg-slate-700/40 text-slate-400 border border-slate-700/40"
                          }`}
                        >
                          {d.environment}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {d.downloadMethod ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
