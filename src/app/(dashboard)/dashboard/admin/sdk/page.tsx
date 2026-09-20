"use client";

import { useEffect, useState } from "react";

interface SdkProduct {
  id: string;
  name: string;
  slug: string;
  description?: string;
  productType: string;
  status: string;
  packageScope?: string;
  createdAt: string;
}

export default function AdminSdkManagementPage() {
  const [products, setProducts] = useState<SdkProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New product form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    productType: "WEB_SDK",
    packageScope: "@gis-platform",
  });
  const [creating, setCreating] = useState(false);

  const loadProducts = () => {
    setLoading(true);
    fetch("/api/v1/admin/sdk/products")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setProducts(d.data);
        else setError(d.error?.message ?? "Failed to load SDK products");
      })
      .catch(() => setError("Failed to load SDK products"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleCreate = async () => {
    if (!form.name || !form.slug) return;
    setCreating(true);
    try {
      const res = await fetch("/api/v1/admin/sdk/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setForm({
          name: "",
          slug: "",
          description: "",
          productType: "WEB_SDK",
          packageScope: "@gis-platform",
        });
        loadProducts();
      } else {
        alert(data.error?.message ?? "Failed to create product");
      }
    } catch {
      alert("Failed to create product");
    } finally {
      setCreating(false);
    }
  };

  const handlePublish = async (id: string) => {
    if (!confirm("Publish this product to ACTIVE status?")) return;
    const res = await fetch(`/api/v1/admin/sdk/products/${id}/publish`, {
      method: "POST",
    });
    const data = await res.json();
    if (data.success) loadProducts();
    else alert(data.error?.message ?? "Failed to publish");
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">
            Platform Admin — SDK Products
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
            Manage distributable SDK software products and release status
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-cyan-600/20"
        >
          + Create SDK Product
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-3 text-gray-500 dark:text-slate-400">
          <div className="w-4 h-4 border-2 border-gray-300 dark:border-slate-600 border-t-cyan-500 rounded-full animate-spin" />
          Loading products…
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/30 rounded-xl p-4 text-red-600 dark:text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800/60 rounded-2xl overflow-hidden shadow-sm dark:shadow-xl transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-800 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider bg-gray-50 dark:bg-slate-950/40">
                  <th className="px-6 py-4">Product Name</th>
                  <th className="px-4 py-4">Slug</th>
                  <th className="px-4 py-4">Type</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Scope</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800/40 text-gray-700 dark:text-slate-300">
                {products.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-gray-50 dark:hover:bg-slate-800/20 transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                      {p.name}
                      {p.description && (
                        <p className="text-xs font-normal text-gray-500 dark:text-slate-400 mt-0.5">
                          {p.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-cyan-600 dark:text-cyan-400">
                      {p.slug}
                    </td>
                    <td className="px-4 py-4 text-xs">{p.productType}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider border ${
                          p.status === "ACTIVE"
                            ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                            : p.status === "DRAFT"
                              ? "bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/20"
                              : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-gray-500 dark:text-slate-400">
                      {p.packageScope ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {p.status === "DRAFT" && (
                        <button
                          onClick={() => handlePublish(p.id)}
                          className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-600/20 hover:bg-emerald-100 dark:hover:bg-emerald-600/30 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-medium transition-all"
                        >
                          Publish Active
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl text-gray-900 dark:text-white transition-colors">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create SDK Product</h2>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                      slug: e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, "-"),
                    })
                  }
                  placeholder="e.g. GIS Web SDK"
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl px-3 py-2 text-cyan-600 dark:text-cyan-400 font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">
                  Product Type
                </label>
                <select
                  value={form.productType}
                  onChange={(e) =>
                    setForm({ ...form, productType: e.target.value })
                  }
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="WEB_SDK">WEB_SDK</option>
                  <option value="MOBILE_SDK">MOBILE_SDK</option>
                  <option value="SERVER_SDK">SERVER_SDK</option>
                  <option value="CORE_LIBRARY">CORE_LIBRARY</option>
                  <option value="PLUGIN">PLUGIN</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={2}
                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm disabled:opacity-50 transition-colors shadow-sm"
              >
                {creating ? "Creating…" : "Create Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
