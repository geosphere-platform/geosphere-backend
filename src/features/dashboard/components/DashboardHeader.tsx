"use client";

import React from "react";
import { UserProfile, BreadcrumbItem } from "../types";
import { DashboardBreadcrumb } from "./DashboardBreadcrumb";
import { DashboardNotificationButton } from "./DashboardNotificationButton";
import { DashboardUserMenu } from "./DashboardUserMenu";
import { ThemeToggle } from "@/core/theme/ThemeProvider";

interface DashboardHeaderProps {
  user: UserProfile;
  breadcrumbs: BreadcrumbItem[];
  isCollapsed: boolean;
  onCollapseToggle: () => void;
  onMobileToggle: () => void;
  onLogout: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  user,
  breadcrumbs,
  isCollapsed,
  onCollapseToggle,
  onMobileToggle,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-30 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 flex items-center justify-between transition-colors">
      <div className="flex items-center space-x-4">
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={onMobileToggle}
          aria-label="Open sidebar navigation"
          className="lg:hidden p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
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
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Desktop Sidebar Collapse Button */}
        <button
          type="button"
          onClick={onCollapseToggle}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden lg:flex p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <svg
            className={`w-5 h-5 transition-transform ${isCollapsed ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Breadcrumb Navigation */}
        <DashboardBreadcrumb items={breadcrumbs} />
      </div>

      {/* Right Utilities */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        <ThemeToggle />
        <DashboardNotificationButton unreadCount={2} />
        <div className="h-6 w-px bg-gray-200 dark:bg-gray-800 hidden sm:block" />
        <DashboardUserMenu user={user} onLogout={onLogout} />
      </div>
    </header>
  );
};
