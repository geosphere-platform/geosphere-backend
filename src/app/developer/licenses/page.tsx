"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface License {
  id: string;
  productId: string;
  status: string;
  licenseType: string;
  licenseKeyPrefix?: string;
  startsAt: string;
  expiresAt?: string;
  revokedAt?: string;
  suspendedAt?: string;
  createdAt: string;
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    ACTIVE: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    PENDING: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    SUSPENDED: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    EXPIRED: "bg-slate-500/15 text-slate-400 border-slate-500/30",
    REVOKED: "bg-red-500/15 text-red-400 border-red-500/30",
  };
  return map[status] ?? "bg-slate-500/15 text-slate-400 border-slate-500/30";
}

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/developer/licenses")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setLicenses(d.data);
        else setError(d.error?.message ?? "Failed to load licenses");
      })
      .catch(() => setError("Failed to load licenses"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            SDK Licenses
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Commercial permissions to use GIS Platform SDK products
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2">
          <span>🔒</span>
          <span>Licenses are managed by your platform administrator</span>
        </div>
      </div>

      {/* Distinction notice */}
      <div className="bg-blue-950/30 border border-blue-800/30 rounded-xl p-4 text-sm text-blue-300">
        <strong className="text-blue-200">License vs. Subscription:</strong>{" "}
        Your <span className="text-white font-medium">Subscription</span>{" "}
        represents your commercial plan. A{" "}
        <span className="text-white font-medium">License</span> grants you
        permission to use a specific SDK software product. Both are required for
        SDK access.
      </div>

      {/* Content */}
      {loading && (
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-4 h-4 border-2 border-slate-600 border-t-cyan-400 rounded-full animate-spin" />
          Loading licenses…
        </div>
      )}

      {error && (
        <div className="bg-red-950/30 border border-red-800/30 rounded-xl p-4 text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {!loading && !error && licenses.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <div className="text-4xl mb-4">🪪</div>
          <p className="text-lg font-medium text-slate-400">No licenses yet</p>
          <p className="text-sm mt-2">
            Contact your platform administrator to provision SDK licenses for
            your organization.
          </p>
        </div>
      )}

      {!loading && licenses.length > 0 && (
        <div className="grid gap-4">
          {licenses.map((license) => (
            <div
              key={license.id}
              className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-6 hover:border-slate-700/60 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${statusBadge(license.status)}`}
                    >
                      {license.status}
                    </span>
                    <span className="text-xs text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-md">
                      {license.licenseType}
                    </span>
                  </div>
                  <p className="text-slate-300 font-mono text-sm truncate">
                    {license.licenseKeyPrefix
                      ? `${license.licenseKeyPrefix}••••••••`
                      : "License ID: " + license.id.slice(0, 16) + "…"}
                  </p>
                  <div className="flex gap-4 mt-3 text-xs text-slate-500">
                    <span>
                      Issued: {new Date(license.startsAt).toLocaleDateString()}
                    </span>
                    {license.expiresAt && (
                      <span
                        className={
                          new Date(license.expiresAt) < new Date()
                            ? "text-red-400"
                            : ""
                        }
                      >
                        Expires:{" "}
                        {new Date(license.expiresAt).toLocaleDateString()}
                      </span>
                    )}
                    {!license.expiresAt && (
                      <span className="text-emerald-400">No expiry</span>
                    )}
                  </div>
                </div>
                <Link
                  href={`/developer/sdk`}
                  className="flex-shrink-0 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold hover:bg-cyan-500/20 transition-all"
                >
                  View SDK →
                </Link>
              </div>

              {license.status === "SUSPENDED" && (
                <div className="mt-4 p-3 bg-orange-950/30 border border-orange-800/30 rounded-lg text-orange-400 text-xs">
                  ⚠️ This license is temporarily suspended. Contact support to
                  reactivate.
                </div>
              )}

              {license.status === "REVOKED" && (
                <div className="mt-4 p-3 bg-red-950/30 border border-red-800/30 rounded-lg text-red-400 text-xs">
                  ❌ This license has been permanently revoked. Contact your
                  administrator for a new license.
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
