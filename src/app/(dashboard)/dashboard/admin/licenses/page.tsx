"use client";

import { useEffect, useState } from "react";

interface License {
  id: string;
  organizationId: string;
  productId: string;
  status: string;
  licenseType: string;
  licenseKeyPrefix?: string;
  startsAt: string;
  expiresAt?: string;
  createdAt: string;
}

export default function AdminLicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);

  // Issue modal
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueForm, setIssueForm] = useState({
    organizationId: "00000000-0000-0000-0000-000000000001",
    productId: "",
    licenseType: "SUBSCRIPTION",
  });
  const [issuedResult, setIssuedResult] = useState<{
    rawLicenseKey: string;
  } | null>(null);
  const [issuing, setIssuing] = useState(false);

  const loadLicenses = () => {
    setLoading(true);
    fetch("/api/v1/admin/licenses")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setLicenses(d.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLicenses();
  }, []);

  const handleIssue = async () => {
    if (!issueForm.organizationId || !issueForm.productId) return;
    setIssuing(true);
    try {
      const res = await fetch("/api/v1/admin/licenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(issueForm),
      });
      const data = await res.json();
      if (data.success) {
        setIssuedResult(data.data);
        loadLicenses();
      } else {
        alert(data.error?.message ?? "Failed to issue license");
      }
    } catch {
      alert("Failed to issue license");
    } finally {
      setIssuing(false);
    }
  };

  const handleActivate = async (id: string) => {
    await fetch(`/api/v1/admin/licenses/${id}/activate`, { method: "POST" });
    loadLicenses();
  };

  const handleRevoke = async (id: string) => {
    const reason = prompt("Enter reason for revoking license:");
    if (!reason) return;
    await fetch(`/api/v1/admin/licenses/${id}/revoke`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    loadLicenses();
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">
            Platform Admin — SDK Licenses
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
            Issue, activate, suspend, and revoke commercial SDK licenses
          </p>
        </div>
        <button
          onClick={() => {
            setIssuedResult(null);
            setShowIssueModal(true);
          }}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-cyan-600/20"
        >
          + Issue New License
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-3 text-gray-500 dark:text-slate-400">
          <div className="w-4 h-4 border-2 border-gray-300 dark:border-slate-600 border-t-cyan-500 rounded-full animate-spin" />
          Loading licenses…
        </div>
      )}

      {!loading && (
        <div className="bg-white dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800/60 rounded-2xl overflow-hidden shadow-sm dark:shadow-xl transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-800 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider bg-gray-50 dark:bg-slate-950/40">
                  <th className="px-6 py-4">License ID / Prefix</th>
                  <th className="px-4 py-4">Organization</th>
                  <th className="px-4 py-4">Type</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Expires</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800/40 text-gray-700 dark:text-slate-300">
                {licenses.map((l) => (
                  <tr
                    key={l.id}
                    className="hover:bg-gray-50 dark:hover:bg-slate-800/20 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-xs text-gray-900 dark:text-white">
                      {l.licenseKeyPrefix
                        ? `${l.licenseKeyPrefix}••••••••`
                        : l.id.slice(0, 18) + "…"}
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-gray-500 dark:text-slate-400">
                      {l.organizationId.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-4 text-xs">{l.licenseType}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider border ${
                          l.status === "ACTIVE"
                            ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                            : l.status === "PENDING"
                              ? "bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/20"
                              : l.status === "SUSPENDED"
                                ? "bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-500/20"
                                : "bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20"
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-gray-500 dark:text-slate-400">
                      {l.expiresAt
                        ? new Date(l.expiresAt).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                      {l.status === "PENDING" && (
                        <button
                          onClick={() => handleActivate(l.id)}
                          className="px-3 py-1 bg-emerald-50 dark:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-transparent rounded-lg text-xs hover:bg-emerald-100 dark:hover:bg-emerald-600/30 transition-colors"
                        >
                          Activate
                        </button>
                      )}
                      {l.status !== "REVOKED" && (
                        <button
                          onClick={() => handleRevoke(l.id)}
                          className="px-3 py-1 bg-red-50 dark:bg-red-600/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-transparent rounded-lg text-xs hover:bg-red-100 dark:hover:bg-red-600/30 transition-colors"
                        >
                          Revoke
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

      {/* Issue Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl text-gray-900 dark:text-white transition-colors">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Issue Commercial License
            </h2>
            {!issuedResult ? (
              <div className="space-y-3 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">
                    Organization ID
                  </label>
                  <input
                    type="text"
                    value={issueForm.organizationId}
                    onChange={(e) =>
                      setIssueForm({
                        ...issueForm,
                        organizationId: e.target.value,
                      })
                    }
                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">
                    Product ID
                  </label>
                  <input
                    type="text"
                    value={issueForm.productId}
                    onChange={(e) =>
                      setIssueForm({ ...issueForm, productId: e.target.value })
                    }
                    placeholder="SDK Product UUID"
                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">
                    License Type
                  </label>
                  <select
                    value={issueForm.licenseType}
                    onChange={(e) =>
                      setIssueForm({
                        ...issueForm,
                        licenseType: e.target.value,
                      })
                    }
                    className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="SUBSCRIPTION">SUBSCRIPTION</option>
                    <option value="TRIAL">TRIAL</option>
                    <option value="ENTERPRISE">ENTERPRISE</option>
                    <option value="DEVELOPMENT">DEVELOPMENT</option>
                    <option value="EVALUATION">EVALUATION</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setShowIssueModal(false)}
                    className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleIssue}
                    disabled={issuing || !issueForm.productId}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm disabled:opacity-50 transition-colors shadow-sm"
                  >
                    {issuing ? "Issuing…" : "Issue License"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-700/50 rounded-xl p-4 text-xs text-amber-800 dark:text-amber-300">
                  ⚠️ <strong>Security Notice:</strong> The raw license key is
                  shown ONLY ONCE. Copy and deliver it securely to the customer.
                </div>
                <div className="bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl p-3 font-mono text-sm text-cyan-600 dark:text-cyan-400 select-all break-all">
                  {issuedResult.rawLicenseKey}
                </div>
                <button
                  onClick={() => setShowIssueModal(false)}
                  className="w-full py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-800 dark:text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
