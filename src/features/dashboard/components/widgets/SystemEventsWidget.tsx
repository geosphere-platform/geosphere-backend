"use client";

import React from "react";
import { SystemEvent } from "../../types/fleet";

interface SystemEventsWidgetProps {
  events: SystemEvent[];
}

export const SystemEventsWidget: React.FC<SystemEventsWidgetProps> = ({
  events,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 text-left">
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white">
          System Activity Timeline
        </h3>
        <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold cursor-pointer hover:underline">
          View Audit Logs
        </span>
      </div>

      <div className="relative border-l border-slate-200 dark:border-slate-800 ml-2 pl-4 space-y-4">
        {events.length === 0 ? (
          <p className="text-xs text-slate-400 py-2">
            No recent system activity
          </p>
        ) : (
          events.slice(0, 4).map((evt) => (
            <div key={evt.id} className="relative text-xs space-y-0.5">
              <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white dark:border-slate-900" />
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {evt.title}
                </span>
                <span className="text-[10px] text-slate-400">
                  {evt.timestamp}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-snug">
                {evt.description}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
