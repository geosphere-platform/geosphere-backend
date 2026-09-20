import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
export const GeofenceManagerScreen = ({ geofences = [
    { id: "g1", name: "Central Substation Zone B4", type: "POLYGON", status: "ACTIVE" },
    { id: "g2", name: "North Logistics Depot", type: "CIRCLE", radiusMeters: 500, status: "ACTIVE" },
    { id: "g3", name: "South Terminal Facility", type: "POLYGON", status: "INACTIVE" },
], onGeofenceToggle, }) => {
    const [zones, setZones] = useState(geofences);
    const toggleStatus = (id) => {
        setZones((prev) => prev.map((z) => {
            if (z.id === id) {
                const nextStatus = z.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
                if (onGeofenceToggle)
                    onGeofenceToggle(id, nextStatus);
                return { ...z, status: nextStatus };
            }
            return z;
        }));
    };
    return (_jsxs("div", { style: { padding: "16px", backgroundColor: "#0f172a", color: "#f8fafc", borderRadius: "12px", fontFamily: "sans-serif" }, children: [_jsx("h2", { style: { margin: "0 0 16px 0", fontSize: "1.25rem", color: "#38bdf8" }, children: "Geofence Policy & Zone Manager" }), _jsx("div", { style: { display: "flex", flexDirection: "column", gap: "10px" }, children: zones.map((zone) => (_jsxs("div", { style: {
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        backgroundColor: "#1e293b",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        border: "1px solid #334155",
                    }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontWeight: "bold", fontSize: "0.95rem", color: "#f1f5f9" }, children: zone.name }), _jsxs("div", { style: { fontSize: "0.8rem", color: "#94a3b8", marginTop: "2px" }, children: ["Type: ", zone.type, " ", zone.radiusMeters ? `(${zone.radiusMeters}m)` : ""] })] }), _jsx("button", { onClick: () => toggleStatus(zone.id), style: {
                                backgroundColor: zone.status === "ACTIVE" ? "#065f46" : "#475569",
                                color: zone.status === "ACTIVE" ? "#34d399" : "#cbd5e1",
                                border: "none",
                                borderRadius: "6px",
                                padding: "6px 12px",
                                cursor: "pointer",
                                fontWeight: "bold",
                                fontSize: "0.8rem",
                            }, children: zone.status })] }, zone.id))) })] }));
};
//# sourceMappingURL=GeofenceManagerScreen.js.map