"use client";

import React from "react";

interface DashboardContentProps {
  children: React.ReactNode;
}

export const DashboardContent: React.FC<DashboardContentProps> = ({
  children,
}) => {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex-1 p-4 md:p-6 lg:p-8 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors focus:outline-none"
    >
      {children}
    </main>
  );
};
