"use client";

import React from "react";
import { FleetTrip } from "../../types/fleet";

interface RecentTripsWidgetProps {
  trips: FleetTrip[];
}

export const RecentTripsWidget: React.FC<RecentTripsWidgetProps> = ({
  trips,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white">
          Active Fleet Trips
        </h3>
        <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold cursor-pointer hover:underline">
          View All Trips
        </span>
      </div>

      <div className="space-y-3">
        {trips.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">
            No active trips
          </p>
        ) : (
          trips.slice(0, 3).map((trip) => (
            <div
              key={trip.id}
              className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-2 text-left"
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {trip.vehicleName}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                    trip.status === "in_progress"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                  }`}
                >
                  {trip.status.replace("_", " ")}
                </span>
              </div>

              <div className="flex justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                <span>
                  Driver:{" "}
                  <strong className="text-slate-700 dark:text-slate-300">
                    {trip.driverName}
                  </strong>
                </span>
                <span>{trip.distanceKm} km</span>
              </div>

              <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2 rounded border border-slate-100 dark:border-slate-800 space-y-1">
                <div className="flex items-center space-x-1.5 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="truncate">{trip.origin}</span>
                </div>
                <div className="flex items-center space-x-1.5 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  <span className="truncate">{trip.destination}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
