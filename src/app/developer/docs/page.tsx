"use client";

import React from "react";
import Link from "next/link";

export default function DeveloperDocsPage() {
  return (
    <div className="space-y-8 max-w-4xl animate-fade-in">
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Developer Documentation & Quick Start
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Complete guide to integrating the Reusable GIS SDK and platform REST
          APIs.
        </p>
      </div>

      {/* Quick Start Steps */}
      <div className="p-8 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-6 shadow-xl">
        <h3 className="text-xl font-bold text-white flex items-center space-x-2">
          <span>⚡</span>
          <span>5-Step Quick Start Integration</span>
        </h3>

        <div className="space-y-6 text-sm text-slate-300">
          <div className="space-y-2">
            <h4 className="font-bold text-cyan-400">
              Step 1: Register Your Application
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Navigate to{" "}
              <Link
                href="/developer/apps/new"
                className="text-cyan-400 underline"
              >
                Applications → Register New Application
              </Link>{" "}
              and select your environment (Development, Staging, Production).
              Each application receives a unique public{" "}
              <code className="text-emerald-400 bg-slate-950 px-1.5 py-0.5 rounded font-mono">
                clientId
              </code>
              .
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-cyan-400">
              Step 2: Generate API Key
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Under Application Details → API Keys, click{" "}
              <strong>+ Generate API Key</strong>. Copy your raw secret key (
              <code className="text-emerald-400 bg-slate-950 px-1.5 py-0.5 rounded font-mono">
                gsk_dev_...
              </code>
              ) immediately.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-cyan-400">Step 3: Install GIS SDK</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Install the private GIS SDK package in your application workspace:
            </p>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-cyan-400">
              npm install @gis/sdk
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-cyan-400">
              Step 4: Initialize the SDK
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Initialize the client with your credentials and render the
              interactive GIS map container:
            </p>
            <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
              {`import { GisMapClient } from '@gis/sdk';

const gis = new GisMapClient({
  clientId: 'app_dev_a1b2c3d4',
  apiKey: 'gsk_dev_9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0',
  environment: 'DEVELOPMENT'
});

await gis.initialize();
gis.renderMap('map-container-id', {
  center: [77.2090, 28.6139],
  zoom: 12
});`}
            </pre>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-cyan-400">
              Step 5: Perform Spatial Operations
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Run spatial queries, buffer calculations, or track live entity
              movements:
            </p>
            <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
              {`// Run spatial search within 5km
const results = await gis.spatial.searchNearby({
  latitude: 28.6139,
  longitude: 77.2090,
  radiusMeters: 5000
});`}
            </pre>
          </div>
        </div>
      </div>

      {/* Security Best Practices */}
      <div className="p-8 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
        <h3 className="text-lg font-bold text-white">
          🔒 Web & Mobile Security Best Practices
        </h3>
        <ul className="space-y-2 text-xs text-slate-400 list-disc list-inside leading-relaxed">
          <li>
            Never embed server secrets in browser JavaScript or mobile APK
            binaries.
          </li>
          <li>
            For browser applications, configure exact Allowed Origins in your
            app settings.
          </li>
          <li>
            Rotate production credentials periodically via the API Keys portal.
          </li>
          <li>
            Assign minimum required API scopes to each application (Least
            Privilege).
          </li>
        </ul>
      </div>
    </div>
  );
}
