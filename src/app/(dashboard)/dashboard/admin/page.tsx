"use client";

import React from "react";
import Link from "next/link";

export default function AdminHubPage() {
  const adminModules = [
    {
      title: "Applications & Builder",
      description: "Manage registered tenant applications, white-label configs, and business modules.",
      href: "/dashboard/admin/applications",
      icon: "📱",
      badge: "App Studio",
    },
    {
      title: "License Management",
      description: "Issue, activate, and audit offline/online enterprise software license keys.",
      href: "/dashboard/admin/licenses",
      icon: "🔑",
      badge: "Entitlements",
    },
    {
      title: "Subscription Plans",
      description: "Define multi-tenant SaaS tiers, quota limits, and feature access matrices.",
      href: "/dashboard/admin/plans",
      icon: "💎",
      badge: "SaaS Plans",
    },
    {
      title: "SDK Product Catalog",
      description: "Publish and release Web SDK & Kotlin Multiplatform packages to enterprise clients.",
      href: "/dashboard/admin/sdk",
      icon: "📦",
      badge: "SDK Registry",
    },
    {
      title: "Tenant Subscriptions",
      description: "Monitor active tenant organizations, plan assignments, and billing states.",
      href: "/dashboard/admin/subscriptions",
      icon: "🏢",
      badge: "Tenants",
    },
  ];

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm dark:shadow-xl text-gray-900 dark:text-white transition-colors">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-wider rounded uppercase bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30">
            Super Admin Authority
          </span>
          <span className="text-xs text-gray-500 dark:text-slate-400">• Master Control Plane</span>
        </div>
        <h1 className="text-2xl font-black tracking-tight mt-1.5 text-gray-900 dark:text-white">
          Enterprise Platform Administration Console
        </h1>
        <p className="text-xs text-gray-500 dark:text-slate-300 mt-1">
          Centralized governance for multi-tenant applications, SDK product distribution, license lifecycle, and SaaS billing.
        </p>
      </div>

      {/* Admin Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {adminModules.map((mod) => (
          <Link
            key={mod.href}
            href={mod.href}
            className="group p-5 bg-white dark:bg-slate-900/90 hover:bg-gray-50 dark:hover:bg-slate-800/80 border border-gray-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/50 rounded-2xl transition-all shadow-sm dark:shadow-md flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-2xl p-2 rounded-xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800">
                  {mod.icon}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {mod.badge}
                </span>
              </div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mt-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                {mod.title}
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">
                {mod.description}
              </p>
            </div>

            <div className="flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
              <span>Open Console &rarr;</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
