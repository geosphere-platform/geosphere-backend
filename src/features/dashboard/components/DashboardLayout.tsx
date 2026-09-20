"use client";

import React from "react";
import Link from "next/link";
import { useDashboardAuth } from "../hooks/useDashboardAuth";
import { useSidebarState } from "../hooks/useSidebarState";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardContent } from "./DashboardContent";
import { BreadcrumbItem } from "../types";

interface DashboardLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Overview" },
  ],
}) => {
  const { user, permissions, isLoading, error, logout } = useDashboardAuth();
  const sidebar = useSidebarState();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center space-y-4 text-gray-900 dark:text-white transition-colors">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">
          Verifying Session & Permissions...
        </p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 text-center transition-colors">
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Authentication Required
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {error || "You must be signed in to access the Dashboard."}
          </p>
          <Link
            href="/login"
            className="inline-block w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-colors shadow-md"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Responsive Sidebar */}
      <DashboardSidebar
        userPermissions={permissions}
        isCollapsed={sidebar.isCollapsed}
        isMobileOpen={sidebar.isMobileOpen}
        onMobileClose={sidebar.closeMobile}
      />

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader
          user={user}
          breadcrumbs={breadcrumbs}
          isCollapsed={sidebar.isCollapsed}
          onCollapseToggle={sidebar.toggleCollapse}
          onMobileToggle={sidebar.toggleMobile}
          onLogout={logout}
        />
        <DashboardContent>{children}</DashboardContent>
      </div>
    </div>
  );
};
