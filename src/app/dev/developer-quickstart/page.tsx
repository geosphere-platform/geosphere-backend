"use client";

import React, { useState, useEffect } from "react";

export default function DeveloperQuickStartDemoPage() {
  const [step, setStep] = useState(1);
  const [appName, setAppName] = useState("My Logistics Application");
  const [environment, setEnvironment] = useState("DEVELOPMENT");
  const [clientId, setClientId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [appId, setAppId] = useState("");

  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [entitlements, setEntitlements] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const addLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  // Step 1: Create Application
  const handleCreateApp = async () => {
    setLoading(true);
    addLog(`Creating application '${appName}' (${environment})...`);
    try {
      const res = await fetch("/api/v1/developer/apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: appName,
          environment,
          type: "WEB",
          allowedOrigins: ["http://localhost:3000", "http://localhost:3500"],
          scopeCodes: [
            "gis:read",
            "layers:read",
            "tracking:read",
            "geofence:read",
            "analytics:read",
            "realtime:connect",
          ],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAppId(data.data.id);
        setClientId(data.data.clientId);
        addLog(
          `✅ Application registered! Public clientId: ${data.data.clientId}`,
        );
        setStep(2);
      } else {
        addLog(`❌ Error creating app: ${data.error?.message}`);
      }
    } catch (err: any) {
      addLog(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Generate API Key
  const handleGenerateKey = async () => {
    setLoading(true);
    addLog("Generating secret API Key for application...");
    try {
      const res = await fetch("/api/v1/developer/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: appId,
          name: "Playground Demo Key",
          environment,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setApiKey(data.data.rawSecretKey);
        addLog(
          `🔑 API Key generated! Secret: ${data.data.rawSecretKey.slice(0, 16)}...`,
        );
        setStep(3);
      } else {
        addLog(`❌ Error generating key: ${data.error?.message}`);
      }
    } catch (err: any) {
      addLog(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Test API Authentication & Fetch Entitlements
  const handleAuthenticate = async () => {
    setLoading(true);
    addLog(`Authenticating SDK with X-API-Key: ${apiKey.slice(0, 16)}...`);
    try {
      const res = await fetch("/api/v1/developer/usage", {
        headers: {
          "X-API-Key": apiKey,
          "X-SDK-Name": "gis-web-sdk",
          "X-SDK-Version": "1.2.0",
        },
      });
      const data = await res.json();
      if (data.success) {
        setEntitlements(data.data);
        addLog(
          "✅ API Authentication successful! Scopes & Entitlements resolved.",
        );
        setStep(4);
      } else {
        addLog(`❌ Auth failed: ${data.error?.message || data.error}`);
      }
    } catch (err: any) {
      addLog(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Perform Spatial Query via SDK Credentials
  const handleSpatialQuery = async () => {
    setLoading(true);
    addLog("Executing spatial query with application API Key...");
    try {
      const res = await fetch(
        "/api/v1/spatial/search?lat=28.6139&lon=77.2090&radius=5000",
        {
          headers: {
            "X-API-Key": apiKey,
            "X-SDK-Name": "gis-web-sdk",
            "X-SDK-Version": "1.2.0",
          },
        },
      );
      const data = await res.json();
      setSearchResults(data.data || []);
      addLog(
        `🌐 Query complete! Received ${data.data?.length || 0} spatial features.`,
      );
      setStep(5);
    } catch (err: any) {
      addLog(`❌ Spatial query failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div>
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
              Developer Onboarding Sandbox
            </span>
            <h1 className="text-3xl font-extrabold text-white">
              GIS SDK & Developer Platform Playground
            </h1>
          </div>
          <a
            href="/developer"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
          >
            ← Back to Developer Portal
          </a>
        </div>

        {/* Stepper Wizard */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {[
            { num: 1, title: "Create App" },
            { num: 2, title: "API Key" },
            { num: 3, title: "Authenticate" },
            { num: 4, title: "Spatial Query" },
            { num: 5, title: "SDK Ready" },
          ].map((s) => (
            <div
              key={s.num}
              className={`p-4 rounded-xl border transition-all ${
                step === s.num
                  ? "bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-lg shadow-cyan-500/10"
                  : step > s.num
                    ? "bg-slate-900 border-emerald-500/30 text-emerald-400"
                    : "bg-slate-900/40 border-slate-800 text-slate-500"
              }`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider">
                Step {s.num}
              </div>
              <div className="text-sm font-extrabold mt-0.5">{s.title}</div>
            </div>
          ))}
        </div>

        {/* Wizard Action Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 p-8 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-6 shadow-xl">
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="font-bold text-white text-lg">
                  Step 1: Register Application
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 uppercase font-semibold">
                      App Name
                    </label>
                    <input
                      type="text"
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 uppercase font-semibold">
                      Environment
                    </label>
                    <select
                      value={environment}
                      onChange={(e) => setEnvironment(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                    >
                      <option value="DEVELOPMENT">DEVELOPMENT</option>
                      <option value="STAGING">STAGING</option>
                      <option value="PRODUCTION">PRODUCTION</option>
                    </select>
                  </div>
                  <button
                    onClick={handleCreateApp}
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl text-sm transition-all"
                  >
                    {loading ? "Registering..." : "Register Application →"}
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h3 className="font-bold text-white text-lg">
                  Step 2: Generate API Key
                </h3>
                <p className="text-xs text-slate-400">
                  Client ID generated:{" "}
                  <code className="text-cyan-400 font-mono">{clientId}</code>
                </p>
                <button
                  onClick={handleGenerateKey}
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl text-sm transition-all"
                >
                  {loading ? "Generating..." : "Generate Secret API Key →"}
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h3 className="font-bold text-white text-lg">
                  Step 3: Authenticate SDK
                </h3>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto">
                  ApiKey: {apiKey}
                </div>
                <button
                  onClick={handleAuthenticate}
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl text-sm transition-all"
                >
                  {loading ? "Authenticating..." : "Test SDK Authentication →"}
                </button>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <h3 className="font-bold text-white text-lg">
                  Step 4: Execute Spatial Query
                </h3>
                <p className="text-xs text-slate-400">
                  Perform a radius spatial query via the GIS SDK using your
                  credentials.
                </p>
                <button
                  onClick={handleSpatialQuery}
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl text-sm transition-all"
                >
                  {loading ? "Querying..." : "Run Spatial Query →"}
                </button>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <h3 className="font-bold text-emerald-400 text-lg">
                  🎉 Step 5: Integration Verification Complete!
                </h3>
                <p className="text-xs text-slate-300">
                  Your application credentials and SDK integration have been
                  fully validated.
                </p>
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
                >
                  Reset & Start Over
                </button>
              </div>
            )}
          </div>

          {/* Console Logs Side Panel */}
          <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-3">
            <h3 className="font-bold text-slate-300 text-xs uppercase tracking-wider">
              Execution Logs
            </h3>
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 h-64 overflow-y-auto font-mono text-[11px] space-y-1.5 text-slate-300">
              {logs.length === 0 ? (
                <span className="text-slate-600">
                  Click a button above to run the onboarding wizard...
                </span>
              ) : (
                logs.map((log, i) => <div key={i}>{log}</div>)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
