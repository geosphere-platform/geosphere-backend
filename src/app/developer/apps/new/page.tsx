"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterApplicationPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("WEB");
  const [environment, setEnvironment] = useState("DEVELOPMENT");
  const [originInput, setOriginInput] = useState("http://localhost:3000");
  const [origins, setOrigins] = useState<string[]>(["http://localhost:3000"]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddOrigin = () => {
    if (originInput && !origins.includes(originInput.trim())) {
      setOrigins([...origins, originInput.trim()]);
      setOriginInput("");
    }
  };

  const handleRemoveOrigin = (index: number) => {
    setOrigins(origins.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Application name is required");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/developer/apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          type,
          environment,
          allowedOrigins: origins,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error?.message || "Failed to create application");
      }

      router.push(`/developer/apps/${data.data.id}`);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-extrabold text-white">
          Register New Application
        </h2>
        <p className="text-sm text-slate-400">
          Register an application to obtain public client identifiers and API
          access credentials.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="p-8 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-6 shadow-xl"
      >
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Application Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Acme Logistics Dashboard"
            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Description
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the application software..."
            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Application Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500 text-sm"
            >
              <option value="WEB">WEB (Browser SDK)</option>
              <option value="MOBILE">MOBILE (Android / iOS App)</option>
              <option value="SERVER">SERVER (Backend API Integration)</option>
              <option value="DESKTOP">DESKTOP (Electron / Native)</option>
              <option value="OTHER">OTHER</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Target Environment
            </label>
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500 text-sm"
            >
              <option value="DEVELOPMENT">
                DEVELOPMENT (Testing & Sandbox)
              </option>
              <option value="STAGING">
                STAGING (Pre-production Integration)
              </option>
              <option value="PRODUCTION">
                PRODUCTION (Live Customer Traffic)
              </option>
            </select>
          </div>
        </div>

        {/* Allowed Origins Section */}
        {type === "WEB" && (
          <div className="space-y-3 pt-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Allowed Web Origins (CORS Security)
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={originInput}
                onChange={(e) => setOriginInput(e.target.value)}
                placeholder="https://app.customer.com"
                className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-cyan-500 text-sm font-mono"
              />
              <button
                type="button"
                onClick={handleAddOrigin}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
              >
                + Add Origin
              </button>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {origins.map((org, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-cyan-400 flex items-center space-x-2"
                >
                  <span>{org}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveOrigin(i)}
                    className="text-slate-500 hover:text-rose-400"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 flex items-center justify-end space-x-4 border-t border-slate-800">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-semibold transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
          >
            {submitting ? "Registering..." : "Complete Registration"}
          </button>
        </div>
      </form>
    </div>
  );
}
