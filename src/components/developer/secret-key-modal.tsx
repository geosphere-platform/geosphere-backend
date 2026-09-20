"use client";

import React, { useState } from "react";

interface SecretKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawSecretKey: string;
  keyName: string;
  environment: string;
}

export function SecretKeyModal({
  isOpen,
  onClose,
  rawSecretKey,
  keyName,
  environment,
}: SecretKeyModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(rawSecretKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 shadow-2xl space-y-6 text-gray-900 dark:text-white transition-colors">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">
                Save Your API Key
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                {keyName} ({environment})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 space-y-2">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
            ⚠️ Security Notice
          </p>
          <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed">
            Please store this API key in a secure secret store or environment
            file immediately. For security reasons,{" "}
            <strong>it will never be displayed again</strong>.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600 dark:text-slate-400 uppercase tracking-wider">
            Raw Secret API Key
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              readOnly
              value={rawSecretKey}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl text-emerald-600 dark:text-emerald-400 font-mono text-sm focus:outline-none select-all"
            />
            <button
              onClick={handleCopy}
              className={`px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 flex items-center space-x-2 shrink-0 ${
                copied
                  ? "bg-emerald-600 text-white"
                  : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/20"
              }`}
            >
              <span>{copied ? "✓ Copied!" : "Copy Key"}</span>
            </button>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-200 text-sm font-semibold transition-all"
          >
            Done & Close
          </button>
        </div>
      </div>
    </div>
  );
}
