"use client";

import React, { useEffect, useState } from "react";

interface SubscriptionItem {
  id: string;
  organizationId: string;
  planId: string;
  status: string;
  startsAt: string;
  endsAt: string | null;
  currency: string;
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/admin/subscriptions")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setSubscriptions(data.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-7xl p-6 text-gray-900 dark:text-slate-100 space-y-6 transition-colors">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-50">
            Platform Subscriptions Administration
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Inspect, assign, suspend, reactivate, or change plans for customer
            organizations.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-xl bg-gray-100 dark:bg-slate-900/50" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm dark:shadow-xl transition-colors">
          <table className="w-full text-left text-sm text-gray-700 dark:text-slate-300">
            <thead className="bg-gray-50 dark:bg-slate-950 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3">Subscription ID</th>
                <th className="px-6 py-3">Organization ID</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Starts At</th>
                <th className="px-6 py-3">Ends At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {subscriptions.map((sub) => (
                <tr
                  key={sub.id}
                  className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="px-6 py-4 font-mono text-xs text-gray-500 dark:text-slate-400">
                    {sub.id.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-cyan-600 dark:text-cyan-400">
                    {sub.organizationId}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                        sub.status === "ACTIVE"
                          ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                          : sub.status === "SUSPENDED"
                            ? "bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20"
                            : "bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20"
                      }`}
                    >
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500 dark:text-slate-400">
                    {new Date(sub.startsAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500 dark:text-slate-400">
                    {sub.endsAt
                      ? new Date(sub.endsAt).toLocaleDateString()
                      : "Lifetime / Auto-renew"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
