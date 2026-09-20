import React from "react";
export interface GeofenceZone {
    id: string;
    name: string;
    type: "POLYGON" | "CIRCLE";
    radiusMeters?: number;
    status: "ACTIVE" | "INACTIVE";
}
export interface GeofenceManagerScreenProps {
    geofences?: GeofenceZone[];
    onGeofenceToggle?: (id: string, newStatus: "ACTIVE" | "INACTIVE") => void;
}
export declare const GeofenceManagerScreen: React.FC<GeofenceManagerScreenProps>;
//# sourceMappingURL=GeofenceManagerScreen.d.ts.map