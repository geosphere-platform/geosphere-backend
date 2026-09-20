import React from "react";
import Link from "next/link";

export const metadata = {
  title: "GIS Developer Portal | API & SDK Management",
  description:
    "Register applications, manage environment API keys, configure scopes, and monitor SDK usage.",
};

export default function DeveloperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans antialiased">
      {/* Developer Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-cyan-500/20">
              ⚡
            </div>
            <div>
              <h1 className="font-bold text-slate-100 text-sm tracking-tight">
                Developer Portal
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                GIS SaaS Platform
              </p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1.5 flex-1">
          <Link
            href="/developer"
            className="flex items-center space-x-3 px-4 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all font-medium text-sm"
          >
            <span>📊</span>
            <span>Dashboard</span>
          </Link>
          <Link
            href="/developer/apps"
            className="flex items-center space-x-3 px-4 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all font-medium text-sm"
          >
            <span>📱</span>
            <span>Applications</span>
          </Link>
          <Link
            href="/developer/keys"
            className="flex items-center space-x-3 px-4 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all font-medium text-sm"
          >
            <span>🔑</span>
            <span>API Keys</span>
          </Link>
          <Link
            href="/developer/usage"
            className="flex items-center space-x-3 px-4 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all font-medium text-sm"
          >
            <span>📈</span>
            <span>API & Metered Usage</span>
          </Link>
          <Link
            href="/developer/docs"
            className="flex items-center space-x-3 px-4 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all font-medium text-sm"
          >
            <span>📖</span>
            <span>SDK & API Docs</span>
          </Link>

          {/* Phase 16 — SDK Distribution */}
          <div className="pt-3 pb-1">
            <p className="px-4 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
              SDK Distribution
            </p>
          </div>
          <Link
            href="/developer/licenses"
            className="flex items-center space-x-3 px-4 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all font-medium text-sm"
          >
            <span>🪪</span>
            <span>Licenses</span>
          </Link>
          <Link
            href="/developer/sdk"
            className="flex items-center space-x-3 px-4 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all font-medium text-sm"
          >
            <span>📦</span>
            <span>SDK Catalog</span>
          </Link>
          <Link
            href="/developer/access"
            className="flex items-center space-x-3 px-4 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all font-medium text-sm"
          >
            <span>🔐</span>
            <span>Package Access</span>
          </Link>
          <Link
            href="/developer/downloads"
            className="flex items-center space-x-3 px-4 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all font-medium text-sm"
          >
            <span>⬇️</span>
            <span>Downloads</span>
          </Link>

          <Link
            href="/dev/developer-quickstart"
            className="flex items-center space-x-3 px-4 py-2.5 rounded-xl text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 hover:bg-cyan-900/40 transition-all font-medium text-sm"
          >
            <span>🚀</span>
            <span>Interactive Playground</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span>Org Subscription:</span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold text-[10px]">
              PRO PLAN
            </span>
          </div>
          <p className="text-[11px] text-slate-400 pt-1">
            API Version: v1 (GIS SDK 1.2.0)
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-7xl">
        {children}
      </main>
    </div>
  );
}
