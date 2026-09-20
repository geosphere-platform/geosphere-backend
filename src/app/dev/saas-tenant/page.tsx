"use client";

import React, { useState } from "react";
import {
  TenantProvider,
  useTenantContext,
} from "../../../core/context/tenant-context";
import { OrganizationSwitcher } from "../../../components/tenant/organization-switcher";
import { WorkspaceSwitcher } from "../../../components/tenant/workspace-switcher";
import { OrganizationAdminPanel } from "../../../components/tenant/organization-admin-panel";

function SaasTenantPlaygroundContent() {
  const {
    activeOrg,
    activeWorkspace,
    userOrgs,
    orgWorkspaces,
    refreshTenantState,
  } = useTenantContext();
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgSlug, setNewOrgSlug] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName || !newOrgSlug) return;
    setMsg(null);
    try {
      const res = await fetch("/api/v1/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newOrgName, slug: newOrgSlug }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg(
          `Organization '${data.data.organization.name}' created! Default workspace created.`,
        );
        setNewOrgName("");
        setNewOrgSlug("");
        refreshTenantState();
      } else {
        setMsg(`Error: ${data.error?.message || "Failed to create org"}`);
      }
    } catch (err) {
      setMsg(
        `Error: ${err instanceof Error ? err.message : "Failed to create org"}`,
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 space-y-8 font-sans">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center font-bold text-white text-lg shadow-md">
            SaaS
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Multi-Tenant SaaS Foundation
            </h1>
            <p className="text-xs text-slate-400">
              Phase 12 — Organization, Workspace & Tenant Isolation Playground
            </p>
          </div>
        </div>

        {/* Global Context Switchers */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase text-slate-500 font-semibold">
              Org:
            </span>
            <OrganizationSwitcher />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase text-slate-500 font-semibold">
              Workspace:
            </span>
            <WorkspaceSwitcher />
          </div>
        </div>
      </div>

      {msg && (
        <div className="p-4 bg-indigo-950/80 border border-indigo-700 text-indigo-200 rounded-xl text-sm font-medium">
          {msg}
        </div>
      )}

      {/* Grid: Context Overview & Create Org */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Context Summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h3 className="text-lg font-semibold text-white border-b border-slate-800 pb-2">
            Active Context State
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-xs uppercase text-slate-500 font-semibold block">
                Active Organization
              </span>
              <p className="font-semibold text-emerald-400 text-base">
                {activeOrg ? activeOrg.name : "None"}
              </p>
              <p className="text-xs font-mono text-slate-500">
                {activeOrg?.id}
              </p>
            </div>
            <div>
              <span className="text-xs uppercase text-slate-500 font-semibold block">
                Active Workspace
              </span>
              <p className="font-semibold text-cyan-400 text-base">
                {activeWorkspace ? activeWorkspace.name : "None"}
              </p>
              <p className="text-xs font-mono text-slate-500">
                {activeWorkspace?.id}
              </p>
            </div>
            <div>
              <span className="text-xs uppercase text-slate-500 font-semibold block">
                Total Accessible Orgs
              </span>
              <p className="font-semibold text-slate-200">{userOrgs.length}</p>
            </div>
            <div>
              <span className="text-xs uppercase text-slate-500 font-semibold block">
                Workspaces in Active Org
              </span>
              <p className="font-semibold text-slate-200">
                {orgWorkspaces.length}
              </p>
            </div>
          </div>
        </div>

        {/* Create Organization Card */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h3 className="text-lg font-semibold text-white border-b border-slate-800 pb-2">
            Create New SaaS Organization
          </h3>
          <form onSubmit={handleCreateOrg} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-400 block mb-1">
                  Organization Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acme Logistics Global"
                  value={newOrgName}
                  onChange={(e) => {
                    setNewOrgName(e.target.value);
                    setNewOrgSlug(
                      e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-"),
                    );
                  }}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-slate-400 block mb-1">
                  Organization Slug
                </label>
                <input
                  type="text"
                  placeholder="e.g. acme-logistics"
                  value={newOrgSlug}
                  onChange={(e) => setNewOrgSlug(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl text-sm font-semibold transition-all shadow-md"
            >
              Create Organization
            </button>
          </form>
        </div>
      </div>

      {/* Main Organization Admin Panel */}
      <OrganizationAdminPanel />
    </div>
  );
}

export default function SaasTenantPlaygroundPage() {
  return (
    <TenantProvider>
      <SaasTenantPlaygroundContent />
    </TenantProvider>
  );
}
