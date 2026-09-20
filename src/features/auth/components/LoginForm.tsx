"use client";

import React, { useState } from "react";
import { LoginDto } from "../ui/dtos";
import { startTokenRefresh } from "@/core/auth/token-refresh";

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const result = LoginDto.safeParse({ email, password });
    if (!result.success) {
      const formattedErrors: { email?: string; password?: string } = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as keyof typeof formattedErrors;
        if (path && !formattedErrors[path]) {
          formattedErrors[path] = issue.message;
        }
      });
      setErrors(formattedErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Invalid email or password");
      }

      // Store access token in localStorage & document cookie
      if (json.data?.accessToken) {
        localStorage.setItem("gis_access_token", json.data.accessToken);
        document.cookie = `gis_access_token=${json.data.accessToken}; path=/; max-age=900; SameSite=Lax`;
      }

      // Start auto-refresh timer (refreshes every 14 min using HttpOnly refresh cookie)
      startTokenRefresh();

      // Redirect seamlessly to Dashboard
      window.location.assign("/dashboard");
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
      {/* Brand & Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded-2xl mb-1">
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          GeoSphere Operations Portal
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Sign in to access GeoSphere spatial telemetry & operations center
        </p>
      </div>

      {/* Global API Error Alert Banner */}
      {apiError && (
        <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <svg
            className="w-4 h-4 shrink-0 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{apiError}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 text-left" noValidate>
        {/* Email Field */}
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block text-xs font-bold text-slate-700 dark:text-slate-300"
          >
            User ID / Enterprise Email
          </label>
          <div className="relative">
            <input
              id="email"
              type="text"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email)
                  setErrors((prev) => ({ ...prev, email: undefined }));
              }}
              placeholder="admin or operator@fleetcompany.com"
              disabled={isSubmitting}
              className={`w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border text-xs font-medium transition-all focus:outline-none focus:ring-2 ${
                errors.email
                  ? "border-red-500 focus:ring-red-400 text-red-900 dark:text-red-100"
                  : "border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-blue-500"
              }`}
            />
          </div>
          {errors.email && (
            <p className="text-[11px] font-semibold text-red-600 dark:text-red-400 mt-1">
              {errors.email}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label
              htmlFor="password"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              Password
            </label>
            <a
              href="#forgot"
              className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Forgot password?
            </a>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password)
                  setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              placeholder="••••••••••••"
              disabled={isSubmitting}
              className={`w-full pl-4 pr-11 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border text-xs font-medium transition-all focus:outline-none focus:ring-2 ${
                errors.password
                  ? "border-red-500 focus:ring-red-400 text-red-900 dark:text-red-100"
                  : "border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-blue-500"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs p-1"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
          {errors.password && (
            <p className="text-[11px] font-semibold text-red-600 dark:text-red-400 mt-1">
              {errors.password}
            </p>
          )}
        </div>

        {/* Remember Me Checkbox */}
        <div className="flex items-center space-x-2 pt-1">
          <input
            id="rememberMe"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
          />
          <label
            htmlFor="rememberMe"
            className="text-xs text-slate-600 dark:text-slate-400 select-none cursor-pointer"
          >
            Remember me on this workstation
          </label>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-xs transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Authenticating Credentials...</span>
              </>
            ) : (
              <span>Sign In to Dashboard</span>
            )}
          </button>
        </div>

        {/* Quick 1-Click Demo Credentials */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-center">
            ⚡ Quick 1-Click Demo Logins
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail("admin@fleet.com");
                setPassword("12345678");
                setErrors({});
                setApiError(null);
              }}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/70 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left transition-colors"
            >
              <span className="text-[11px] font-bold text-slate-800 dark:text-white block">👑 Super Admin</span>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block">admin@fleet.com</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail("admin");
                setPassword("12345678");
                setErrors({});
                setApiError(null);
              }}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/70 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left transition-colors"
            >
              <span className="text-[11px] font-bold text-slate-800 dark:text-white block">🛰️ Dispatcher</span>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block">admin / 12345678</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
