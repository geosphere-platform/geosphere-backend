"use client";

import React from "react";
import Link from "next/link";
import { BreadcrumbItem } from "../types";

interface DashboardBreadcrumbProps {
  items: BreadcrumbItem[];
}

export const DashboardBreadcrumb: React.FC<DashboardBreadcrumbProps> = ({
  items,
}) => {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center text-sm font-medium"
    >
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center space-x-2">
              {index > 0 && (
                <span
                  className="text-gray-400 dark:text-gray-600 select-none"
                  aria-hidden="true"
                >
                  /
                </span>
              )}
              {isLast || !item.href ? (
                <span
                  className="text-gray-900 dark:text-gray-100 font-semibold"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
