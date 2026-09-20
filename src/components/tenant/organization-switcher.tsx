"use client";

import React, { useState } from "react";
import {
  useTenantContext,
  OrganizationInfo,
} from "../../core/context/tenant-context";

export const OrganizationSwitcher: React.FC = () => {
  const { activeOrg, userOrgs, setActiveOrg } = useTenantContext();
  const [isOpen, setIsOpen] = useState(false);

  if (!activeOrg) {
    return (
      <div className="px-3 py-1.5 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 rounded-lg text-sm font-medium transition-colors">
        No Organization
      </div>
    );
  }

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-900 dark:text-white rounded-lg text-sm font-medium transition-colors border border-gray-300 dark:border-slate-700 shadow-sm"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <span className="font-semibold text-gray-900 dark:text-slate-100">{activeOrg.name}</span>
        <span className="text-xs px-1.5 py-0.5 bg-gray-200 dark:bg-slate-900 text-gray-700 dark:text-slate-400 rounded font-mono uppercase">
          {activeOrg.slug}
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
        <div className="absolute left-0 mt-2 w-64 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 shadow-2xl z-50 overflow-hidden py-1 transition-colors">
          <div className="px-3 py-2 border-b border-gray-100 dark:border-slate-800">
            <p className="text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-slate-400">
              Select Organization
            </p>
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {userOrgs.map((org: OrganizationInfo) => (
              <button
                key={org.id}
                onClick={() => {
                  setActiveOrg(org);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors ${
                  org.id === activeOrg.id
                    ? "bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 font-semibold"
                    : "text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                }`}
              >
                <div>
                  <div className="font-medium text-gray-900 dark:text-slate-100">{org.name}</div>
                  <div className="text-xs text-gray-400 dark:text-slate-500 font-mono">
                    {org.slug}
                  </div>
                </div>
                {org.id === activeOrg.id && (
                  <span className="text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
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
