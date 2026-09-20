"use client";

import React, { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";

export default function ApiDocsPage() {
  const [loaded, setLoaded] = useState(false);
  const [stats, setStats] = useState({ paths: 177, operations: 234, categories: 26 });

  useEffect(() => {
    // Inject Swagger UI stylesheet
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/swagger-ui-dist@5/swagger-ui.css";
    document.head.appendChild(link);

    // Inject custom Swagger UI style overrides to match dark/light theme
    const customStyle = document.createElement("style");
    customStyle.innerHTML = `
      .swagger-ui .topbar { display: none !important; }
      .swagger-ui .info { margin: 20px 0 !important; }
      .swagger-ui .info .title { font-family: inherit; font-weight: 700; color: #1e293b; }
      .swagger-ui .scheme-container { background: #f8fafc; padding: 15px 0; border-radius: 8px; margin-bottom: 20px; box-shadow: none; border: 1px solid #e2e8f0; }
      .swagger-ui .opblock { border-radius: 8px !important; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
      .swagger-ui .btn.authorize { color: #2563eb; border-color: #2563eb; }
      .swagger-ui .btn.authorize svg { fill: #2563eb; }
      .dark .swagger-ui { filter: invert(88%) hue-rotate(180deg); }
      .dark .swagger-ui img { filter: invert(100%) hue-rotate(180deg); }
    `;
    document.head.appendChild(customStyle);

    // Inject Swagger UI bundle script
    const script = document.createElement("script");
    script.src = "https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js";
    script.crossOrigin = "anonymous";
    script.onload = () => {
      // @ts-expect-error SwaggerUIBundle is defined globally
      if (window.SwaggerUIBundle) {
        // @ts-expect-error SwaggerUIBundle call
        window.SwaggerUIBundle({
          url: "/openapi.json",
          dom_id: "#swagger-ui",
          deepLinking: true,
          presets: [
            // @ts-expect-error SwaggerUIBundle presets
            window.SwaggerUIBundle.presets.apis,
            // @ts-expect-error SwaggerUIBundle StandalonePreset
            window.SwaggerUIBundle.SwaggerUIStandalonePreset,
          ],
          layout: "BaseLayout",
          docExpansion: "list",
          defaultModelsExpandDepth: 1,
          defaultModelExpandDepth: 1,
        });
        setLoaded(true);
      }
    };
    document.body.appendChild(script);

    return () => {
      if (link.parentNode) link.parentNode.removeChild(link);
      if (customStyle.parentNode) customStyle.parentNode.removeChild(customStyle);
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Platform Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-500/30">
            G
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                GeoSphere API Reference
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                OpenAPI 3.0.3
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interactive Swagger UI explorer for Enterprise GIS, Fleet Telemetry, & SaaS Platform
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{stats.categories} Categories</span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span>{stats.operations} Operations</span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span>{stats.paths} Endpoints</span>
          </div>

          <a
            href="/openapi.json"
            target="_blank"
            download="geosphere-openapi.json"
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold transition flex items-center gap-1.5 shadow-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download JSON
          </a>

          <Link
            href="/dashboard"
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition shadow-sm"
          >
            Go to Dashboard &rarr;
          </Link>
        </div>
      </header>

      {/* Main Swagger Explorer */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {!loaded && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
              Loading GeoSphere Interactive API Documentation...
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
              Parsing 177 OpenAPI 3.0 route schemas, parameters, security schemes, and model definitions.
            </p>
          </div>
        )}

        <div id="swagger-ui" className="bg-white dark:bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-slate-200 dark:border-slate-300" />
      </main>
    </div>
  );
}
