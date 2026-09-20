import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
export const VehicleTrackingScreen = ({ vehicles = [
    { id: "v1", plateNumber: "MH-31-FA-1001", driverName: "Alex Rivera", speedKmh: 42, status: "MOVING", batteryPct: 88, latitude: 21.1458, longitude: 79.0882 },
    { id: "v2", plateNumber: "MH-31-FA-2002", driverName: "Sarah Chen", speedKmh: 0, status: "IDLE", batteryPct: 95, latitude: 21.1550, longitude: 79.0950 },
    { id: "v3", plateNumber: "MH-31-FA-3003", driverName: "Devon Vance", speedKmh: 0, status: "OFFLINE", batteryPct: 45, latitude: 21.1300, longitude: 79.0700 },
], onVehicleSelect, onRefresh, }) => {
    const [selectedId, setSelectedId] = useState(null);
    const handleSelect = (v) => {
        setSelectedId(v.id);
        if (onVehicleSelect)
            onVehicleSelect(v);
    };
    return (_jsxs("div", { style: { padding: "16px", backgroundColor: "#0f172a", color: "#f8fafc", borderRadius: "12px", fontFamily: "sans-serif" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }, children: [_jsxs("div", { children: [_jsx("h2", { style: { margin: 0, fontSize: "1.25rem", color: "#38bdf8" }, children: "Vehicle Fleet Tracking Screen" }), _jsx("p", { style: { margin: "4px 0 0 0", fontSize: "0.85rem", color: "#94a3b8" }, children: "Real-time location, speed, and telemetry status" })] }), _jsx("button", { onClick: onRefresh, style: { backgroundColor: "#0284c7", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 14px", cursor: "pointer", fontWeight: 600 }, children: "Refresh Live Data" })] }), _jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px" }, children: vehicles.map((v) => {
                    const isSelected = selectedId === v.id;
                    const statusColor = v.status === "MOVING" ? "#10b981" : v.status === "IDLE" ? "#f59e0b" : "#ef4444";
                    return (_jsxs("div", { onClick: () => handleSelect(v), style: {
                            border: isSelected ? "2px solid #38bdf8" : "1px solid #334155",
                            borderRadius: "8px",
                            padding: "14px",
                            backgroundColor: isSelected ? "#1e293b" : "#0f172a",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                        }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }, children: [_jsx("span", { style: { fontWeight: "bold", fontSize: "1rem", color: "#f1f5f9" }, children: v.plateNumber }), _jsx("span", { style: { fontSize: "0.75rem", backgroundColor: statusColor, color: "#0f172a", padding: "2px 8px", borderRadius: "12px", fontWeight: "bold" }, children: v.status })] }), _jsxs("div", { style: { fontSize: "0.85rem", color: "#cbd5e1", display: "flex", flexDirection: "column", gap: "4px" }, children: [_jsxs("div", { children: [_jsx("strong", { children: "Driver:" }), " ", v.driverName] }), _jsxs("div", { children: [_jsx("strong", { children: "Speed:" }), " ", v.speedKmh, " km/h"] }), _jsxs("div", { children: [_jsx("strong", { children: "Battery:" }), " ", v.batteryPct, "%"] }), _jsxs("div", { style: { fontSize: "0.75rem", color: "#64748b", marginTop: "4px" }, children: ["Lat: ", v.latitude.toFixed(4), ", Lon: ", v.longitude.toFixed(4)] })] })] }, v.id));
                }) })] }));
};
//# sourceMappingURL=VehicleTrackingScreen.js.map