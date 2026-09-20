"use client";

import React, { useState } from "react";
import { UserProfile } from "../types";

interface DashboardUserMenuProps {
  user: UserProfile;
  onLogout: () => void;
}

export const DashboardUserMenu: React.FC<DashboardUserMenuProps> = ({
  user,
  onLogout,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const initials =
    `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() ||
    "U";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={`User menu for ${user.firstName} ${user.lastName}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="flex items-center space-x-3 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <div className="w-8 h-8 rounded-full bg-blue-600 dark:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center">
          {initials}
        </div>
        <div className="hidden md:flex flex-col text-left">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-none">
            {user.firstName} {user.lastName}
          </span>
          <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
            {user.role}
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
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
        <div
          role="menu"
          aria-orientation="vertical"
          aria-label="User account menu"
          className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg py-1 z-50"
        >
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user.email}
            </p>
            <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-semibold rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {user.role}
            </span>
          </div>

          <a
            href="/dashboard/settings"
            role="menuitem"
            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Account Settings
          </a>

          <button
            type="button"
            role="menuitem"
            onClick={onLogout}
            className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
};
