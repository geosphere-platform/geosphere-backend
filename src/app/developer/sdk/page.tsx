"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface SdkProduct {
  id: string;
  name: string;
  slug: string;
  description?: string;
  productType: string;
  status: string;
  packageScope?: string;
  licenseId?: string;
  licenseStatus?: string;
  licenseExpiresAt?: string;
}

function productTypeIcon(type: string) {
  const map: Record<string, string> = {
    WEB_SDK: "🌐",
    MOBILE_SDK: "📱",
    SERVER_SDK: "🖥️",
    CORE_LIBRARY: "⚙️",
    PLUGIN: "🔌",
    OTHER: "📦",
  };
  return map[type] ?? "📦";
}

function statusColor(status: string) {
  const map: Record<string, string> = {
    ACTIVE: "text-emerald-400",
    DEPRECATED: "text-yellow-400",
    DRAFT: "text-slate-400",
    RETIRED: "text-red-400",
  };
  return map[status] ?? "text-slate-400";
}

export default function SdkCatalogPage() {
  const [products, setProducts] = useState<SdkProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/developer/sdk/catalog")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setProducts(d.data);
        else setError(d.error?.message ?? "Failed to load SDK catalog");
      })
      .catch(() => setError("Failed to load SDK catalog"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          SDK Catalog
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          SDK products your organization is licensed to use
        </p>
      </div>

      {/* Info banner */}
      <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 text-xs text-slate-400 flex items-start gap-3">
        <span className="text-lg mt-0.5">💡</span>
        <div>
          <p className="text-slate-300 font-medium mb-1">
            Private Package Distribution
          </p>
          <p>
            SDK packages are distributed through a private registry. Only
            licensed organizations can install packages. See{" "}
            <Link
              href="/developer/access"
              className="text-cyan-400 hover:underline"
            >
              Package Access
            </Link>{" "}
            to generate installation credentials.
          </p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-4 h-4 border-2 border-slate-600 border-t-cyan-400 rounded-full animate-spin" />
          Loading SDK catalog…
        </div>
      )}

      {error && (
        <div className="bg-red-950/30 border border-red-800/30 rounded-xl p-4 text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <div className="text-5xl mb-4">📦</div>
          <p className="text-lg font-medium text-slate-400">
            No SDK products licensed
          </p>
          <p className="text-sm mt-2 max-w-md mx-auto">
            Your organization does not have any active SDK licenses. Contact
            your administrator or upgrade your subscription to get SDK access.
          </p>
          <Link
            href="/developer/licenses"
            className="inline-flex items-center gap-2 mt-6 px-6 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-semibold hover:bg-cyan-500/20 transition-all"
          >
            View Licenses
          </Link>
        </div>
      )}

      {!loading && products.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/developer/sdk/${product.slug}`}
              className="group bg-slate-900/60 border border-slate-800/60 rounded-2xl p-6 hover:border-cyan-700/40 hover:bg-slate-900/80 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 flex items-center justify-center text-2xl">
                  {productTypeIcon(product.productType)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-bold text-white text-base group-hover:text-cyan-300 transition-colors">
                      {product.name}
                    </h2>
                    <span
                      className={`text-xs font-medium ${statusColor(product.status)}`}
                    >
                      {product.status === "DEPRECATED"
                        ? "⚠ Deprecated"
                        : product.status === "ACTIVE"
                          ? ""
                          : product.status}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs line-clamp-2 mb-3">
                    {product.description ?? "GIS Platform SDK product"}
                  </p>
                  <div className="flex items-center gap-3">
                    {product.packageScope && (
                      <span className="text-slate-500 font-mono text-xs bg-slate-800/60 px-2 py-0.5 rounded">
                        {product.packageScope}/{product.slug}
                      </span>
                    )}
                    {product.licenseStatus && (
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-md border ${
                          product.licenseStatus === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                        }`}
                      >
                        🪪 {product.licenseStatus}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-slate-600 group-hover:text-slate-400 text-lg transition-colors">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
