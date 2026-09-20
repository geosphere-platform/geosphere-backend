"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { INITIAL_APPLICATION_TEMPLATES } from "@/database/seed-application-builder";

interface ApplicationItem {
  id: string;
  name: string;
  code: string;
  description?: string;
  environment: string;
  platform: string;
  status: string;
  version: number;
  updatedAt: string;
}

export default function ApplicationsAdminPage() {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states
  const [newAppName, setNewAppName] = useState("");
  const [newAppCode, setNewAppCode] = useState("");
  const [newAppDescription, setNewAppDescription] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/applications");
      const data = await res.json();
      if (data.success && data.data?.applications) {
        setApplications(data.data.applications);
      }
    } catch (e) {
      console.error("Failed to load applications", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName || !newAppCode) return;

    setCreating(true);
    try {
      const res = await fetch("/api/v1/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newAppName,
          code: newAppCode,
          description: newAppDescription,
          templateCode: selectedTemplate || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setNewAppName("");
        setNewAppCode("");
        setNewAppDescription("");
        setSelectedTemplate("");
        fetchApplications();
      } else {
        alert(data.error || "Failed to create application");
      }
    } catch (e) {
      alert("Error creating application");
    } finally {
      setCreating(false);
    }
  };

  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(search.toLowerCase()) ||
      app.code.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 text-gray-900 dark:text-slate-100 transition-colors">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Customer Application Builder
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
            Data-driven GIS business module composer and white-label platform
            management.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-lg transition shadow-md shadow-blue-500/20"
        >
          + Create New Application
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm transition-colors">
        <input
          type="text"
          placeholder="Search by name or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-80 px-3.5 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="VALIDATED">VALIDATED</option>
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </div>
      </div>

      {/* Applications Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-slate-500 text-sm animate-pulse">
          Loading application inventory...
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
          <p className="text-gray-600 dark:text-slate-400 font-medium">No applications found</p>
          <p className="text-gray-400 dark:text-slate-600 text-xs mt-1">
            Create your first application or pick from pre-built starter
            templates.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-5 hover:border-blue-400 dark:hover:border-slate-700 transition shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-slate-100 text-base">
                      {app.name}
                    </h3>
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-mono mt-0.5">
                      {app.code}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      app.status === "PUBLISHED"
                        ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30"
                        : app.status === "VALIDATED"
                          ? "bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30"
                          : "bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30"
                    }`}
                  >
                    {app.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-3 line-clamp-2">
                  {app.description || "No description provided."}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                <div className="text-[11px] text-gray-400 dark:text-slate-500 font-mono">
                  v{app.version} &bull; {app.environment}
                </div>
                <Link
                  href={`/dashboard/admin/applications/${app.id}`}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs font-medium rounded-md transition"
                >
                  Open Builder &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Application Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl w-full max-w-lg p-6 text-gray-900 dark:text-slate-100 space-y-4 shadow-2xl transition-colors">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Create New GIS Application</h3>

            <form onSubmit={handleCreateApp} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                  Application Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ABC Field Service Suite"
                  value={newAppName}
                  onChange={(e) => {
                    setNewAppName(e.target.value);
                    if (!newAppCode) {
                      setNewAppCode(
                        e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "_"),
                      );
                    }
                  }}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                  Application Code (Unique Identifier) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. abc_field_service"
                  value={newAppCode}
                  onChange={(e) => setNewAppCode(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-lg text-sm font-mono text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                  Starter Template
                </label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">
                    Start from Scratch (Default GIS Base)
                  </option>
                  {INITIAL_APPLICATION_TEMPLATES.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.name} ({t.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional application description..."
                  value={newAppDescription}
                  onChange={(e) => setNewAppDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-sm rounded-lg transition"
                >
                  {creating ? "Creating..." : "Create Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
