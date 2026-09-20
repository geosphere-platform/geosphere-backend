"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface SdkVersion {
  id: string;
  version: string;
  status: string;
  channel: string;
  releaseDate?: string;
  deprecatedAt?: string;
  isSecurityRevoked: boolean;
  securityRevokedReason?: string;
  recommendedVersion?: string;
  minimumApiVersion?: string;
  isRecommended?: boolean;
  securityWarning?: string;
  migrationWarning?: string;
}

interface CatalogData {
  product: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    productType: string;
    status: string;
    packageScope?: string;
  };
  versions: SdkVersion[];
  recommendedVersion?: SdkVersion;
  installInstructions: string;
}

function versionStatusBadge(v: SdkVersion) {
  if (v.isSecurityRevoked) {
    return "bg-red-500/15 text-red-400 border-red-500/30";
  }
  const map: Record<string, string> = {
    RELEASED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    DEPRECATED: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    RETIRED: "bg-slate-600/30 text-slate-400 border-slate-600/30",
    RELEASE_CANDIDATE: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    DRAFT: "bg-slate-700/30 text-slate-500 border-slate-700/30",
  };
  return map[v.status] ?? "bg-slate-700/30 text-slate-500 border-slate-700/30";
}

export default function SdkProductPage() {
  const params = useParams();
  const slug = params?.product as string;

  const [data, setData] = useState<CatalogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInstallConfig, setShowInstallConfig] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/v1/developer/sdk/${slug}/versions`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setData(d.data);
        else setError(d.error?.message ?? "Failed to load SDK product");
      })
      .catch(() => setError("Failed to load SDK product"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-slate-400">
        <div className="w-4 h-4 border-2 border-slate-600 border-t-cyan-400 rounded-full animate-spin" />
        Loading…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-950/30 border border-red-800/30 rounded-xl p-4 text-red-400 text-sm">
        ⚠️ {error ?? "SDK product not found"}
      </div>
    );
  }

  const hasSecurityIssues = data.versions.some((v) => v.isSecurityRevoked);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-2 text-slate-500 text-sm">
        <Link
          href="/developer/sdk"
          className="hover:text-cyan-400 transition-colors"
        >
          SDK Catalog
        </Link>
        <span>/</span>
        <span className="text-slate-300">{data.product.name}</span>
      </div>

      <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 flex items-center justify-center text-3xl">
            🌐
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              {data.product.name}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {data.product.description}
            </p>
            {data.product.packageScope && (
              <p className="text-slate-500 font-mono text-xs mt-2">
                {data.product.packageScope}/{data.product.slug}
              </p>
            )}
          </div>
        </div>

        {/* Recommended version */}
        {data.recommendedVersion && (
          <div className="mt-4 bg-emerald-950/20 border border-emerald-800/20 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
                  ✅ Recommended Version
                </p>
                <p className="text-white font-mono font-bold text-lg">
                  v{data.recommendedVersion.version}
                </p>
                {data.recommendedVersion.releaseDate && (
                  <p className="text-slate-500 text-xs mt-0.5">
                    Released{" "}
                    {new Date(
                      data.recommendedVersion.releaseDate,
                    ).toLocaleDateString()}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowInstallConfig(!showInstallConfig)}
                className="px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-semibold hover:bg-cyan-500/20 transition-all"
              >
                {showInstallConfig ? "Hide" : "Show"} Install Config
              </button>
            </div>

            {showInstallConfig && (
              <div className="mt-4">
                <p className="text-slate-400 text-xs font-semibold mb-2">
                  Add to your <code className="font-mono">.npmrc</code>:
                </p>
                <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap">
                  {data.installInstructions}
                </pre>
                <p className="text-xs text-slate-500 mt-2">
                  Then install:{" "}
                  <code className="font-mono text-cyan-400">
                    npm install {data.product.packageScope}/{data.product.slug}@
                    {data.recommendedVersion.version}
                  </code>
                </p>
                <Link
                  href="/developer/access"
                  className="inline-flex items-center gap-1.5 mt-3 text-xs text-cyan-400 hover:underline"
                >
                  🔐 Generate Package Credentials →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Security alert */}
      {hasSecurityIssues && (
        <div className="bg-red-950/30 border border-red-800/40 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">🚨</span>
            <div>
              <p className="text-red-400 font-bold text-sm">
                Security Advisory
              </p>
              <p className="text-red-300 text-sm mt-1">
                One or more versions of this SDK have known security
                vulnerabilities. Upgrade to the recommended version immediately.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Version table */}
      <div>
        <h2 className="text-base font-bold text-white mb-4">Version History</h2>
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800/60">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Version
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Channel
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Released
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    API
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.versions.map((v) => (
                  <tr
                    key={v.id}
                    className={`border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors ${v.isSecurityRevoked ? "bg-red-950/10" : ""}`}
                  >
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-white font-medium">
                          v{v.version}
                        </span>
                        {v.isRecommended && (
                          <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold">
                            RECOMMENDED
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${versionStatusBadge(v)}`}
                      >
                        {v.isSecurityRevoked ? "SECURITY REVOKED" : v.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-400 capitalize">
                        {v.channel}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-400">
                        {v.releaseDate
                          ? new Date(v.releaseDate).toLocaleDateString()
                          : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-slate-400">
                        {v.minimumApiVersion ?? "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
