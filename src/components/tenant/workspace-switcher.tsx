"use client";

import React, { useState } from "react";
import {
  useTenantContext,
  WorkspaceInfo,
} from "../../core/context/tenant-context";

export const WorkspaceSwitcher: React.FC = () => {
  const { activeWorkspace, orgWorkspaces, setActiveWorkspace } =
    useTenantContext();
  const [isOpen, setIsOpen] = useState(false);

  if (!activeWorkspace) {
    return (
      <div className="px-3 py-1.5 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 rounded-lg text-sm font-medium transition-colors">
        No Workspace
      </div>
    );
  }

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-900 dark:text-white rounded-lg text-sm font-medium transition-colors border border-gray-300 dark:border-slate-700 shadow-sm"
      >
        <svg
          className="w-4 h-4 text-cyan-600 dark:text-cyan-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        <span className="font-semibold text-gray-900 dark:text-slate-100">
          {activeWorkspace.name}
        </span>
        <svg
          className="w-4 h-4 text-gray-400 dark:text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-56 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 shadow-2xl z-50 overflow-hidden py-1 transition-colors">
          <div className="px-3 py-2 border-b border-gray-100 dark:border-slate-800">
            <p className="text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-slate-400">
              Select Workspace
            </p>
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {orgWorkspaces.map((ws: WorkspaceInfo) => (
              <button
                key={ws.id}
                onClick={() => {
                  setActiveWorkspace(ws);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors ${
                  ws.id === activeWorkspace.id
                    ? "bg-cyan-50 dark:bg-cyan-600/20 text-cyan-600 dark:text-cyan-400 font-semibold"
                    : "text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                }`}
              >
                <div>
                  <div className="font-medium text-gray-900 dark:text-slate-100">{ws.name}</div>
                  <div className="text-xs text-gray-400 dark:text-slate-500 font-mono">
                    {ws.slug}
                  </div>
                </div>
                {ws.id === activeWorkspace.id && (
                  <span className="text-cyan-600 dark:text-cyan-400 text-xs font-semibold">
                    Active
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
