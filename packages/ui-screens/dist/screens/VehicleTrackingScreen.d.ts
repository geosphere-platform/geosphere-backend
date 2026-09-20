import React from "react";
export interface Vehicle {
    id: string;
    plateNumber: string;
    driverName: string;
    speedKmh: number;
    status: "MOVING" | "IDLE" | "OFFLINE";
    batteryPct: number;
    latitude: number;
    longitude: number;
}
export interface VehicleTrackingScreenProps {
    vehicles?: Vehicle[];
    onVehicleSelect?: (vehicle: Vehicle) => void;
    onRefresh?: () => void;
}
export declare const VehicleTrackingScreen: React.FC<VehicleTrackingScreenProps>;
//# sourceMappingURL=VehicleTrackingScreen.d.ts.map