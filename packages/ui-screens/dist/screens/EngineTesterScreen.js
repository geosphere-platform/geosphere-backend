"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from "react";
// SLEEK INDUSTRY-STANDARD TOP-DOWN VEHICLE NAVIGATION ICON (Circular Pod + Glowing Directional Arrow)
const VEHICLE_ICON_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48"><circle cx="24" cy="24" r="20" fill="%230f172a" stroke="%2338bdf8" stroke-width="3"/><path fill="%2338bdf8" stroke="%23ffffff" stroke-width="2" stroke-linejoin="round" d="M24 8L34 34L24 28L14 34Z"/></svg>`;
// ADAPTIVE CHAIKIN CORNER-SMOOTHING CURVE INTERPOLATOR FOR ORGANIC GIS BOUNDARY LINES
export const smoothPolygonCoords = (coords, iterations = 1) => {
    if (!coords || coords.length < 3)
        return coords;
    let current = [...coords];
    // Ensure closed ring
    if (current[0][0] !== current[current.length - 1][0] || current[0][1] !== current[current.length - 1][1]) {
        current.push([...current[0]]);
    }
    for (let it = 0; it < iterations; it++) {
        const smoothed = [];
        const len = current.length - 1;
        for (let i = 0; i < len; i++) {
            const p0 = current[i];
            const p1 = current[i + 1];
            const q = [0.75 * p0[0] + 0.25 * p1[0], 0.75 * p0[1] + 0.25 * p1[1]];
            const r = [0.25 * p0[0] + 0.75 * p1[0], 0.25 * p0[1] + 0.75 * p1[1]];
            smoothed.push(q);
            smoothed.push(r);
        }
        smoothed.push([...smoothed[0]]);
        current = smoothed;
    }
    return current;
};
export const GLOBAL_COUNTRIES_DATASET = [
    {
        countryName: "India",
        countryCode: "IN",
        flagEmoji: "🇮🇳",
        capitalName: "New Delhi",
        center: [78.9629, 20.5937],
        zoom: 5,
        states: [
            {
                stateName: "Maharashtra",
                stateCode: "MH",
                capitalName: "Mumbai",
                colorHex: "#2563eb",
                entireStateBoundary: {
                    id: "mh_entire_state",
                    name: "Entire Maharashtra State Boundary",
                    isEntireState: true,
                    center: [76.5000, 19.5000],
                    zoom: 7,
                    areaSqKm: 307713,
                    perimeterKm: 2850,
                    polygonCoords: [
                        [72.75, 20.10], [72.82, 19.80], [72.88, 19.50], [72.82, 18.90], [72.90, 18.50],
                        [72.90, 18.20], [73.30, 16.95], [73.55, 16.30], [73.65, 15.80], [74.00, 15.60],
                        [74.25, 15.85], [74.40, 16.40], [74.60, 16.85], [75.20, 17.20], [75.90, 17.65],
                        [76.50, 17.90], [77.20, 18.20], [77.80, 18.50], [78.35, 18.90], [79.20, 18.85],
                        [79.80, 18.80], [80.35, 18.85], [80.90, 19.50], [80.80, 20.40], [80.60, 21.30],
                        [80.10, 21.50], [79.40, 21.65], [78.50, 21.62], [77.40, 21.60], [76.20, 21.60],
                        [75.20, 21.60], [74.40, 21.50], [73.80, 21.40], [73.20, 20.90], [72.90, 20.30],
                        [72.75, 20.10]
                    ]
                },
                districts: [
                    { id: "mh_nagpur", name: "Nagpur District", center: [79.0882, 21.1458], zoom: 11, areaSqKm: 9892, perimeterKm: 460, polygonCoords: [[78.75, 21.15], [78.85, 21.32], [79.05, 21.45], [79.32, 21.42], [79.52, 21.28], [79.48, 21.02], [79.28, 20.85], [79.02, 20.88], [78.82, 20.98], [78.75, 21.15]] },
                    { id: "mh_mumbai", name: "Mumbai City & Suburban", center: [72.8777, 19.0760], zoom: 11, areaSqKm: 603, perimeterKm: 165, polygonCoords: [[72.80, 18.89], [72.85, 18.92], [72.93, 19.01], [72.98, 19.18], [72.95, 19.28], [72.85, 19.28], [72.78, 19.15], [72.81, 19.04], [72.75, 18.95], [72.80, 18.89]] },
                    { id: "mh_pune", name: "Pune District", center: [73.8567, 18.5204], zoom: 10, areaSqKm: 15643, perimeterKm: 640, polygonCoords: [[73.35, 18.45], [73.50, 18.85], [73.80, 19.15], [74.25, 19.05], [74.60, 18.65], [74.52, 18.25], [74.15, 17.95], [73.72, 18.10], [73.42, 18.25], [73.35, 18.45]] },
                    { id: "mh_nashik", name: "Nashik District", center: [73.7898, 19.9975], zoom: 10, areaSqKm: 15530, perimeterKm: 610, polygonCoords: [[73.30, 20.05], [73.55, 20.45], [73.95, 20.65], [74.45, 20.48], [74.65, 20.05], [74.35, 19.65], [73.92, 19.55], [73.45, 19.75], [73.30, 20.05]] }
                ]
            },
            {
                stateName: "Gujarat",
                stateCode: "GJ",
                capitalName: "Gandhinagar",
                colorHex: "#06b6d4",
                entireStateBoundary: {
                    id: "gj_entire_state",
                    name: "Entire Gujarat State Boundary",
                    isEntireState: true,
                    center: [71.1924, 22.2587],
                    zoom: 7,
                    areaSqKm: 196024,
                    perimeterKm: 2200,
                    polygonCoords: [
                        [68.18, 23.65], [68.80, 23.80], [70.15, 24.70], [71.50, 24.60], [72.85, 24.55],
                        [73.70, 23.80], [74.28, 22.28], [73.80, 21.20], [73.55, 20.25], [72.82, 20.08],
                        [72.70, 20.70], [72.60, 21.48], [72.10, 21.80], [72.20, 22.20], [70.80, 21.00],
                        [70.25, 21.05], [69.20, 21.80], [68.95, 22.48], [69.50, 22.80], [70.20, 22.90],
                        [68.50, 23.40], [68.18, 23.65]
                    ]
                },
                districts: [
                    { id: "gj_ahmedabad", name: "Ahmedabad District", center: [72.5714, 23.0225], zoom: 10, areaSqKm: 8086, perimeterKm: 410, polygonCoords: [[72.15, 22.85], [72.35, 23.25], [72.68, 23.42], [72.92, 23.18], [72.85, 22.72], [72.50, 22.45], [72.22, 22.60], [72.15, 22.85]] }
                ]
            },
            {
                stateName: "Rajasthan",
                stateCode: "RJ",
                capitalName: "Jaipur",
                colorHex: "#d97706",
                entireStateBoundary: {
                    id: "rj_entire_state",
                    name: "Entire Rajasthan State Boundary",
                    isEntireState: true,
                    center: [74.2179, 27.0238],
                    zoom: 6,
                    areaSqKm: 342239,
                    perimeterKm: 3200,
                    polygonCoords: [
                        [69.48, 26.85], [70.25, 28.50], [70.25, 29.85], [72.50, 30.10], [74.52, 30.15],
                        [75.80, 28.50], [77.85, 27.25], [77.80, 26.50], [76.52, 24.12], [75.50, 24.30],
                        [74.50, 24.50], [73.25, 24.62], [71.50, 24.80], [70.52, 25.02], [69.48, 26.85]
                    ]
                },
                districts: [
                    { id: "rj_jaipur", name: "Jaipur District", center: [75.7873, 26.9124], zoom: 10, areaSqKm: 11143, perimeterKm: 490, polygonCoords: [[75.25, 26.65], [75.52, 26.35], [76.05, 26.48], [76.28, 27.15], [75.92, 27.42], [75.45, 27.25], [75.22, 26.88], [75.25, 26.65]] }
                ]
            },
            {
                stateName: "Jammu & Kashmir (UT)",
                stateCode: "JK",
                capitalName: "Srinagar / Jammu",
                colorHex: "#06b6d4",
                entireStateBoundary: {
                    id: "jk_entire_state",
                    name: "Jammu & Kashmir (UT) Boundary",
                    isEntireState: true,
                    center: [75.5000, 34.0000],
                    zoom: 7,
                    areaSqKm: 125535,
                    perimeterKm: 1650,
                    polygonCoords: [
                        [73.50, 32.80], [73.80, 33.50], [74.20, 34.50], [74.80, 35.80], [75.80, 36.80],
                        [76.80, 37.00], [77.50, 36.50], [78.20, 35.50], [79.20, 34.50], [78.90, 33.20],
                        [78.50, 32.50], [77.20, 32.30], [76.50, 32.20], [75.20, 32.30], [74.80, 32.40],
                        [73.50, 32.80]
                    ]
                },
                districts: [
                    { id: "jk_srinagar", name: "Srinagar District", center: [74.7973, 34.0837], zoom: 11, areaSqKm: 294, perimeterKm: 85, polygonCoords: [[74.70, 34.00], [74.88, 34.15], [74.82, 34.18], [74.68, 34.05], [74.70, 34.00]] }
                ]
            },
            {
                stateName: "Kerala",
                stateCode: "KL",
                capitalName: "Thiruvananthapuram",
                colorHex: "#0284c7",
                entireStateBoundary: {
                    id: "kl_entire_state",
                    name: "Entire Kerala State Boundary",
                    isEntireState: true,
                    center: [76.2711, 10.8505],
                    zoom: 7,
                    areaSqKm: 38863,
                    perimeterKm: 1350,
                    polygonCoords: [
                        [74.85, 12.82], [75.20, 12.50], [75.52, 12.25], [75.80, 11.60], [76.20, 10.80],
                        [76.80, 10.20], [77.35, 10.15], [77.50, 9.20], [77.58, 8.25], [76.85, 8.42],
                        [76.50, 9.20], [76.20, 9.80], [75.92, 10.85], [75.40, 11.80], [74.85, 12.82]
                    ]
                },
                districts: [
                    { id: "kl_kochi", name: "Eranakulam / Kochi District", center: [76.2673, 9.9312], zoom: 11, areaSqKm: 3068, perimeterKm: 280, polygonCoords: [[76.12, 9.78], [76.32, 9.68], [76.65, 9.88], [76.72, 10.22], [76.42, 10.32], [76.18, 10.12], [76.10, 9.92], [76.12, 9.78]] }
                ]
            },
            {
                stateName: "Tamil Nadu",
                stateCode: "TN",
                capitalName: "Chennai",
                colorHex: "#9333ea",
                entireStateBoundary: {
                    id: "tn_entire_state",
                    name: "Entire Tamil Nadu State Boundary",
                    isEntireState: true,
                    center: [78.6569, 11.1271],
                    zoom: 7,
                    areaSqKm: 130058,
                    perimeterKm: 1950,
                    polygonCoords: [
                        [76.25, 11.55], [77.20, 12.50], [78.25, 13.52], [79.50, 13.50], [80.35, 13.45],
                        [80.00, 12.20], [79.85, 10.25], [79.20, 9.20], [77.58, 8.08], [76.85, 9.25],
                        [76.80, 10.50], [76.25, 11.55]
                    ]
                },
                districts: [
                    { id: "tn_chennai", name: "Chennai District", center: [80.2707, 13.0827], zoom: 11, areaSqKm: 426, perimeterKm: 125, polygonCoords: [[80.12, 12.92], [80.22, 12.88], [80.32, 12.98], [80.35, 13.18], [80.25, 13.26], [80.15, 13.15], [80.10, 13.02], [80.12, 12.92]] }
                ]
            },
            {
                stateName: "Karnataka",
                stateCode: "KA",
                capitalName: "Bengaluru",
                colorHex: "#84cc16",
                entireStateBoundary: {
                    id: "ka_entire_state",
                    name: "Entire Karnataka State Boundary",
                    isEntireState: true,
                    center: [75.7139, 15.3173],
                    zoom: 7,
                    areaSqKm: 191791,
                    perimeterKm: 2150,
                    polygonCoords: [
                        [74.08, 14.85], [74.52, 15.75], [75.20, 16.80], [75.45, 17.52], [76.50, 18.20],
                        [77.58, 18.45], [77.85, 16.50], [77.85, 14.25], [77.20, 12.80], [76.85, 11.95],
                        [75.80, 12.20], [75.25, 12.55], [74.65, 13.85], [74.08, 14.85]
                    ]
                },
                districts: [
                    { id: "ka_bengaluru", name: "Bengaluru Urban", center: [77.5946, 12.9716], zoom: 11, areaSqKm: 2196, perimeterKm: 230, polygonCoords: [[77.38, 12.82], [77.52, 12.75], [77.78, 12.85], [77.85, 13.12], [77.62, 13.22], [77.42, 13.08], [77.35, 12.95], [77.38, 12.82]] }
                ]
            }
        ]
    },
    {
        countryName: "United States",
        countryCode: "US",
        flagEmoji: "🇺🇸",
        capitalName: "Washington D.C.",
        center: [-95.7129, 37.0902],
        zoom: 4,
        states: [
            {
                stateName: "California",
                stateCode: "CA",
                capitalName: "Sacramento",
                colorHex: "#38bdf8",
                entireStateBoundary: {
                    id: "us_ca_entire_state",
                    name: "Entire California State Boundary",
                    isEntireState: true,
                    center: [-119.4179, 36.7783],
                    zoom: 6,
                    areaSqKm: 423970,
                    perimeterKm: 3400,
                    polygonCoords: [
                        [-124.40, 42.00], [-120.00, 42.00], [-120.00, 39.00], [-114.60, 35.00], [-114.10, 34.30],
                        [-114.70, 32.70], [-117.10, 32.50], [-118.50, 34.00], [-120.50, 34.50], [-122.50, 37.80],
                        [-124.40, 40.50], [-124.40, 42.00]
                    ]
                },
                districts: [
                    { id: "us_ca_los_angeles", name: "Los Angeles County", center: [-118.2437, 34.0522], zoom: 10, areaSqKm: 12305, perimeterKm: 510, polygonCoords: [[-118.70, 34.30], [-118.10, 34.80], [-117.70, 34.00], [-118.20, 33.70], [-118.70, 34.30]] }
                ]
            },
            {
                stateName: "Texas",
                stateCode: "TX",
                capitalName: "Austin",
                colorHex: "#ef4444",
                entireStateBoundary: {
                    id: "us_tx_entire_state",
                    name: "Entire Texas State Boundary",
                    isEntireState: true,
                    center: [-99.9018, 31.9686],
                    zoom: 6,
                    areaSqKm: 695662,
                    perimeterKm: 4500,
                    polygonCoords: [
                        [-106.50, 32.00], [-103.00, 32.00], [-103.00, 36.50], [-100.00, 36.50], [-100.00, 34.50],
                        [-94.10, 33.50], [-93.50, 30.00], [-97.00, 26.00], [-99.00, 26.50], [-104.50, 29.50],
                        [-106.50, 31.80], [-106.50, 32.00]
                    ]
                },
                districts: []
            },
            {
                stateName: "New York",
                stateCode: "NY",
                capitalName: "Albany",
                colorHex: "#a855f7",
                entireStateBoundary: {
                    id: "us_ny_entire_state",
                    name: "Entire New York State Boundary",
                    isEntireState: true,
                    center: [-75.5268, 42.9538],
                    zoom: 7,
                    areaSqKm: 141297,
                    perimeterKm: 1850,
                    polygonCoords: [
                        [-79.76, 42.27], [-78.95, 42.84], [-79.05, 43.62], [-76.80, 44.15], [-74.80, 45.00],
                        [-73.35, 45.00], [-73.25, 43.50], [-73.50, 41.00], [-74.00, 40.50], [-75.30, 41.50],
                        [-79.76, 42.00], [-79.76, 42.27]
                    ]
                },
                districts: []
            }
        ]
    },
    {
        countryName: "United Kingdom",
        countryCode: "GB",
        flagEmoji: "🇬🇧",
        capitalName: "London",
        center: [-3.4360, 55.3781],
        zoom: 5,
        states: [
            {
                stateName: "England",
                stateCode: "ENG",
                capitalName: "London",
                colorHex: "#10b981",
                entireStateBoundary: {
                    id: "gb_england",
                    name: "Entire England Region Boundary",
                    isEntireState: true,
                    center: [-1.1743, 52.3555],
                    zoom: 7,
                    areaSqKm: 130279,
                    perimeterKm: 2800,
                    polygonCoords: [
                        [-5.70, 50.00], [-3.50, 50.70], [-1.00, 50.70], [1.40, 51.30], [1.70, 52.50],
                        [0.20, 53.60], [-1.20, 54.80], [-2.00, 55.80], [-3.10, 55.00], [-3.00, 53.30],
                        [-4.10, 52.00], [-5.70, 50.00]
                    ]
                },
                districts: []
            },
            {
                stateName: "Scotland",
                stateCode: "SCT",
                capitalName: "Edinburgh",
                colorHex: "#0284c7",
                entireStateBoundary: {
                    id: "gb_scotland",
                    name: "Entire Scotland Region Boundary",
                    isEntireState: true,
                    center: [-4.2026, 56.4907],
                    zoom: 6,
                    areaSqKm: 77933,
                    perimeterKm: 3200,
                    polygonCoords: [
                        [-5.00, 54.80], [-6.20, 56.20], [-7.50, 57.50], [-5.00, 58.60], [-3.00, 58.60],
                        [-2.00, 57.50], [-2.00, 56.00], [-3.20, 55.80], [-5.00, 54.80]
                    ]
                },
                districts: []
            }
        ]
    },
    {
        countryName: "Australia",
        countryCode: "AU",
        flagEmoji: "🇦🇺",
        capitalName: "Canberra",
        center: [133.7751, -25.2744],
        zoom: 4,
        states: [
            {
                stateName: "New South Wales",
                stateCode: "NSW",
                capitalName: "Sydney",
                colorHex: "#f59e0b",
                entireStateBoundary: {
                    id: "au_nsw",
                    name: "Entire New South Wales Boundary",
                    isEntireState: true,
                    center: [147.0000, -32.0000],
                    zoom: 6,
                    areaSqKm: 809444,
                    perimeterKm: 4200,
                    polygonCoords: [
                        [141.00, -29.00], [153.50, -28.20], [151.30, -33.80], [150.00, -37.50], [141.00, -34.00], [141.00, -29.00]
                    ]
                },
                districts: []
            }
        ]
    },
    {
        countryName: "Canada",
        countryCode: "CA",
        flagEmoji: "🇨🇦",
        capitalName: "Ottawa",
        center: [-106.3468, 56.1304],
        zoom: 4,
        states: [
            {
                stateName: "Ontario",
                stateCode: "ON",
                capitalName: "Toronto",
                colorHex: "#ec4899",
                entireStateBoundary: {
                    id: "ca_ontario",
                    name: "Entire Ontario Province Boundary",
                    isEntireState: true,
                    center: [-85.3232, 51.2538],
                    zoom: 5,
                    areaSqKm: 1076395,
                    perimeterKm: 5100,
                    polygonCoords: [
                        [-95.15, 48.90], [-89.00, 48.00], [-82.00, 42.00], [-74.50, 45.00], [-79.50, 56.80], [-89.00, 56.80], [-95.15, 48.90]
                    ]
                },
                districts: []
            }
        ]
    }
];
// Helper export for backward compatibility
export const INDIAN_STATES_DISTRICTS_DATASET = GLOBAL_COUNTRIES_DATASET[0].states;
export const EngineTesterScreen = ({ initialEngine = "MAPPING", // Default: Engine 1 (OpenLayers Core Mapping Engine)
 }) => {
    const [activeEngine, setActiveEngine] = useState(initialEngine);
    // Engine 1: Master 10-Feature GIS Engine State
    const [mapStyleView, setMapStyleView] = useState("STANDARD");
    const [projection] = useState("EPSG:3857 (Web Mercator)");
    const [vectorTilesActive, setVectorTilesActive] = useState(true);
    const [layerOpacity, setLayerOpacity] = useState(100);
    const [zoomLevel, setZoomLevel] = useState(14);
    const [bboxExtent, setBboxExtent] = useState("[79.0710, 21.1320, 79.1050, 21.1590]");
    const [showGuide, setShowGuide] = useState(true);
    const [copyFeedback, setCopyFeedback] = useState(false);
    // Engine 1 Features 7-10 State
    const [measuredDistanceKm] = useState(4.82);
    const [measuredAreaSqKm] = useState(1.25);
    const [searchCity, setSearchCity] = useState("Nagpur");
    const [layerZIndex, setLayerZIndex] = useState({ basemap: 0, vector: 1 });
    // Engine 2: Master 10-Feature Telematics Engine State
    const [showEngine2Guide, setShowEngine2Guide] = useState(true);
    const [isSimulatingGps, setIsSimulatingGps] = useState(false);
    const [speedKmh, setSpeedKmh] = useState(55);
    const [latitude, setLatitude] = useState(21.1458);
    const [longitude, setLongitude] = useState(79.0882);
    const [headingDeg, setHeadingDeg] = useState(45);
    const [batteryPct, setBatteryPct] = useState(88);
    const [fuelPct] = useState(76);
    const [odometerKm, setOdometerKm] = useState(14820);
    const [ignitionState] = useState(true);
    const [satellitesCount] = useState(9);
    const [hdopValue] = useState(0.8);
    const [activeAnomaly, setActiveAnomaly] = useState(null);
    const [telemetryLogs, setTelemetryLogs] = useState([]);
    const [copyPayloadFeedback, setCopyPayloadFeedback] = useState(false);
    const [followCamera, setFollowCamera] = useState(true);
    const [showMapBadge, setShowMapBadge] = useState(true);
    const breadcrumbCoordsRef = useRef([]);
    // Engine 3: Master 10-Feature Geofence Engine State & Alternative View Perspectives
    const [showEngine3Guide, setShowEngine3Guide] = useState(true);
    const [geofenceType, setGeofenceType] = useState("POLYGON");
    const [zoneStatus, setZoneStatus] = useState("OUTSIDE");
    const [breachCount, setBreachCount] = useState(0);
    const [breachLogs, setBreachLogs] = useState([]);
    const [activeActionTrigger, setActiveActionTrigger] = useState(null);
    const [copySqlQueryFeedback, setCopySqlQueryFeedback] = useState(false);
    const [copyGeoJsonFeedback, setCopyGeoJsonFeedback] = useState(false);
    const [dwellTimeMins, setDwellTimeMins] = useState(14);
    const [zoneSpeedLimitKmh] = useState(30);
    const [showZoneLabel, setShowZoneLabel] = useState(true);
    const [boundaryStyle, setBoundaryStyle] = useState("DASHED");
    const [scheduleActive, setScheduleActive] = useState(true);
    // ALTERNATIVE GEOFENCE INSPECTION VIEW PERSPECTIVES
    const [geofenceViewMode, setGeofenceViewMode] = useState("STANDARD");
    // Map Layer Display Checkboxes
    const [showStatesLayer, setShowStatesLayer] = useState(true);
    const [showDistrictsLayer, setShowDistrictsLayer] = useState(true);
    const [showCapitalsLayer, setShowCapitalsLayer] = useState(true);
    const [showLabelsLayer, setShowLabelsLayer] = useState(true);
    const [searchFilter, setSearchFilter] = useState("");
    // MULTI-COUNTRY & STATE DROPDOWN SELECTION STATE
    const [selectedCountryCode, setSelectedCountryCode] = useState("IN");
    const [selectedStateName, setSelectedStateName] = useState("Maharashtra");
    const [selectedDistrictId, setSelectedDistrictId] = useState("mh_entire_state");
    const currentCountryObj = GLOBAL_COUNTRIES_DATASET.find((c) => c.countryCode === selectedCountryCode) || GLOBAL_COUNTRIES_DATASET[0];
    const currentStateObj = currentCountryObj.states.find((s) => s.stateName === selectedStateName) || currentCountryObj.states[0];
    // Selectable boundary options for active state (Entire State Boundary FIRST, followed by districts)
    const availableBoundaryOptions = [
        currentStateObj.entireStateBoundary,
        ...currentStateObj.districts
    ];
    const currentDistrictObj = availableBoundaryOptions.find((d) => d.id === selectedDistrictId) || availableBoundaryOptions[0];
    const postGisQuery = `SELECT ST_Contains(geom, ST_SetSRID(ST_MakePoint(${longitude.toFixed(4)}, ${latitude.toFixed(4)}), 4326)) FROM geofence_zones WHERE zone_id = '${currentDistrictObj.id}';`;
    const geoJsonPayload = JSON.stringify({
        type: "Feature",
        geometry: {
            type: "Polygon",
            coordinates: [currentDistrictObj.polygonCoords]
        },
        properties: {
            country_code: selectedCountryCode,
            country_name: currentCountryObj.countryName,
            boundary_type: currentDistrictObj.isEntireState ? "STATE" : "DISTRICT",
            boundary_id: currentDistrictObj.id,
            name: currentDistrictObj.name,
            state_name: selectedStateName,
            area_sq_km: currentDistrictObj.areaSqKm,
            perimeter_km: currentDistrictObj.perimeterKm
        }
    });
    // Engine 4: Routing Engine State
    const [origin, setOrigin] = useState("Civil Lines Depot (79.080, 21.140)");
    const [destination, setDestination] = useState("Substation B4 (79.095, 21.155)");
    const [calculatedDistanceKm] = useState(4.82);
    const [calculatedEtaMins] = useState(12);
    // Engine 5: Offline & Sync Engine State
    const [networkStatus, setNetworkStatus] = useState("ONLINE");
    const [offlineRecordCount, setOfflineRecordCount] = useState(0);
    const [lastSyncOpId, setLastSyncOpId] = useState("op_sync_10019283");
    // OpenLayers Map Element Ref & Instances
    const mapElementRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const tileLayerRef = useRef(null);
    const vectorLayerRef = useRef(null);
    const vehicleFeatureRef = useRef(null);
    const allStateFeaturesMapRef = useRef(new Map());
    const breadcrumbFeatureRef = useRef(null);
    const olModulesRef = useRef(null);
    // Initialize Real OpenLayers Map Engine dynamically on Client-Side DOM mount
    useEffect(() => {
        if (!mapElementRef.current || mapInstanceRef.current || typeof window === "undefined")
            return;
        let isMounted = true;
        Promise.all([
            import("ol/Map.js"), import("ol/View.js"), import("ol/layer/Tile.js"), import("ol/layer/Vector.js"),
            import("ol/source/OSM.js"), import("ol/source/XYZ.js"), import("ol/source/Vector.js"), import("ol/Feature.js"),
            import("ol/geom/Point.js"), import("ol/geom/LineString.js"), import("ol/geom/Polygon.js"), import("ol/geom/Circle.js"), import("ol/proj.js"),
            import("ol/style.js"), import("ol/control/ScaleLine.js")
        ]).then(([{ default: Map }, { default: View }, { default: TileLayer }, { default: VectorLayer }, { default: OSM }, { default: XYZ }, { default: VectorSource }, { default: Feature }, { default: Point }, { default: LineString }, { default: Polygon }, { default: CircleGeom }, { fromLonLat, toLonLat }, { Style, Stroke, Fill, Icon }, { default: ScaleLine }]) => {
            if (!isMounted || !mapElementRef.current)
                return;
            olModulesRef.current = { OSM, XYZ, Style, Stroke, Fill, Icon, LineString, Polygon, CircleGeom, fromLonLat, toLonLat, View };
            // 1. Initial Tile Source (OpenStreetMap Standard)
            const initialTileLayer = new TileLayer({ source: new OSM(), opacity: layerOpacity / 100, zIndex: layerZIndex.basemap });
            tileLayerRef.current = initialTileLayer;
            // 2. OpenLayers Vector Layer for Global Boundary Features
            const vectorSource = new VectorSource();
            const routeFeature = new Feature({ geometry: new LineString([fromLonLat([79.080, 21.140]), fromLonLat([79.085, 21.145]), fromLonLat([79.090, 21.150]), fromLonLat([79.095, 21.155])]) });
            routeFeature.setStyle(new Style({ stroke: new Stroke({ color: "#0284c7", width: 3 }) }));
            // Instantiate Features for ALL Countries, States, and Districts WITH CRISP THIN LINE STYLING
            const featureList = [routeFeature];
            allStateFeaturesMapRef.current.clear();
            GLOBAL_COUNTRIES_DATASET.forEach((cntry) => {
                cntry.states.forEach((st) => {
                    // 1. Transform WGS84 lon/lat degrees into Web Mercator projected meters FIRST
                    const mercatorStateCoords = st.entireStateBoundary.polygonCoords.map((c) => fromLonLat(c));
                    // 2. Perform adaptive Chaikin spline smoothing directly in Mercator meter space
                    const smoothedStateMercatorCoords = smoothPolygonCoords(mercatorStateCoords, 1);
                    // 3. Create OpenLayers Polygon feature in Mercator meter space
                    const stFeature = new Feature({ geometry: new Polygon([smoothedStateMercatorCoords]) });
                    stFeature.set("boundaryId", st.entireStateBoundary.id);
                    stFeature.set("boundaryName", st.entireStateBoundary.name);
                    allStateFeaturesMapRef.current.set(st.entireStateBoundary.id, { feature: stFeature, colorHex: st.colorHex, isDistrict: false });
                    featureList.push(stFeature);
                    // District Features (Smoothed in Mercator Meter Space)
                    st.districts.forEach((dst) => {
                        const mercatorDistrictCoords = dst.polygonCoords.map((c) => fromLonLat(c));
                        const smoothedDistrictMercatorCoords = smoothPolygonCoords(mercatorDistrictCoords, 1);
                        const dstFeature = new Feature({ geometry: new Polygon([smoothedDistrictMercatorCoords]) });
                        dstFeature.set("boundaryId", dst.id);
                        dstFeature.set("boundaryName", dst.name);
                        allStateFeaturesMapRef.current.set(dst.id, { feature: dstFeature, colorHex: st.colorHex, isDistrict: true });
                        featureList.push(dstFeature);
                    });
                });
            });
            const breadcrumbFeature = new Feature({ geometry: new LineString([fromLonLat([79.0882, 21.1458])]) });
            breadcrumbFeature.setStyle(new Style({ stroke: new Stroke({ color: "#10b981", width: 2.5, lineDash: [4, 4] }) }));
            breadcrumbFeatureRef.current = breadcrumbFeature;
            breadcrumbCoordsRef.current = [fromLonLat([79.0882, 21.1458])];
            featureList.push(breadcrumbFeature);
            const vehicleFeature = new Feature({ geometry: new Point(fromLonLat([79.0882, 21.1458])) });
            vehicleFeature.setStyle(new Style({ image: new Icon({ src: VEHICLE_ICON_SVG, scale: 0.8, rotation: (headingDeg * Math.PI) / 180, rotateWithView: true }) }));
            vehicleFeatureRef.current = vehicleFeature;
            featureList.push(vehicleFeature);
            vectorSource.addFeatures(featureList);
            const vectorLayer = new VectorLayer({ source: vectorSource, zIndex: layerZIndex.vector });
            vectorLayerRef.current = vectorLayer;
            // 3. Create Real OpenLayers Map Engine Instance
            const view = new View({ center: fromLonLat(currentDistrictObj.center), zoom: currentDistrictObj.zoom });
            const olMap = new Map({ target: mapElementRef.current, layers: [initialTileLayer, vectorLayer], view, controls: [new ScaleLine({ units: "metric" })] });
            olMap.on("moveend", () => {
                const extent = view.calculateExtent(olMap.getSize());
                const min = toLonLat([extent[0], extent[1]]);
                const max = toLonLat([extent[2], extent[3]]);
                setBboxExtent(`[${min[0].toFixed(4)}, ${min[1].toFixed(4)}, ${max[0].toFixed(4)}, ${max[1].toFixed(4)}]`);
                const viewCenter = view.getCenter();
                if (viewCenter) {
                    const center = toLonLat(viewCenter);
                    if (center) {
                        setLongitude(+center[0].toFixed(4));
                        setLatitude(+center[1].toFixed(4));
                    }
                }
                const currentZoom = view.getZoom();
                if (currentZoom)
                    setZoomLevel(Math.round(currentZoom));
            });
            mapInstanceRef.current = olMap;
        });
        return () => { isMounted = false; if (mapInstanceRef.current) {
            mapInstanceRef.current.setTarget(undefined);
            mapInstanceRef.current = null;
        } };
    }, []);
    // Handle 6 Map Style Views & Satellite Inspection Focus Mode
    useEffect(() => {
        if (!tileLayerRef.current || !olModulesRef.current)
            return;
        const { OSM, XYZ } = olModulesRef.current;
        const styleUrls = {
            SATELLITE: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            HYBRID: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            DARK_MIDNIGHT: "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
            GRAYSCALE: "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
            TERRAIN: "https://a.tile.opentopomap.org/{z}/{x}/{y}.png",
        };
        const targetStyle = geofenceViewMode === "SATELLITE_FOCUS" ? "SATELLITE" : mapStyleView;
        const url = styleUrls[targetStyle];
        tileLayerRef.current.setSource(url ? new XYZ({ url }) : new OSM());
    }, [mapStyleView, geofenceViewMode]);
    // Layer Opacity & Vector Visibility Effects
    useEffect(() => { tileLayerRef.current?.setOpacity(layerOpacity / 100); }, [layerOpacity]);
    useEffect(() => { vectorLayerRef.current?.setVisible(vectorTilesActive); }, [vectorTilesActive]);
    useEffect(() => { tileLayerRef.current?.setZIndex(layerZIndex.basemap); vectorLayerRef.current?.setZIndex(layerZIndex.vector); }, [layerZIndex]);
    // Engine 2: Position, Icon Rotation, Follow Camera, & Breadcrumbs
    useEffect(() => {
        if (!vehicleFeatureRef.current || !olModulesRef.current)
            return;
        const { fromLonLat, Style, Icon } = olModulesRef.current;
        const pointCoords = fromLonLat([longitude, latitude]);
        vehicleFeatureRef.current.getGeometry()?.setCoordinates(pointCoords);
        vehicleFeatureRef.current.setStyle(new Style({ image: new Icon({ src: VEHICLE_ICON_SVG, scale: 0.8, rotation: (headingDeg * Math.PI) / 180, rotateWithView: true }) }));
        if (followCamera && mapInstanceRef.current && isSimulatingGps) {
            mapInstanceRef.current.getView().animate({ center: pointCoords, duration: 400 });
        }
        if (isSimulatingGps && breadcrumbFeatureRef.current) {
            breadcrumbCoordsRef.current.push(pointCoords);
            if (breadcrumbCoordsRef.current.length > 50)
                breadcrumbCoordsRef.current.shift();
            breadcrumbFeatureRef.current.getGeometry().setCoordinates(breadcrumbCoordsRef.current);
        }
    }, [latitude, longitude, headingDeg, isSimulatingGps, followCamera]);
    // Engine 3: SINGLE DROPDOWN SELECTION HIGHLIGHT ENGINE & AUTO-FIT BBOX CAMERA FOCUS
    useEffect(() => {
        if (!olModulesRef.current || !mapInstanceRef.current || allStateFeaturesMapRef.current.size === 0)
            return;
        const { Style, Stroke, Fill, fromLonLat } = olModulesRef.current;
        const isInside = zoneStatus === "INSIDE";
        const strokeDash = boundaryStyle === "DASHED" ? [6, 4] : boundaryStyle === "GLOWING" ? [2, 2] : undefined;
        const hexToRgba = (hex, alpha) => {
            const r = parseInt(hex.slice(1, 3), 16) || 14;
            const g = parseInt(hex.slice(3, 5), 16) || 165;
            const b = parseInt(hex.slice(5, 7), 16) || 233;
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };
        let targetSelectedFeature = null;
        allStateFeaturesMapRef.current.forEach((obj, id) => {
            const { feature, colorHex } = obj;
            if (id === selectedDistrictId) {
                targetSelectedFeature = feature;
                // ACTIVE SELECTED TARGET: Crisp 2.5px solid boundary stroke with high-contrast highlight
                feature.setStyle(new Style({
                    fill: new Fill({ color: isInside ? "rgba(239, 68, 68, 0.40)" : hexToRgba(colorHex, 0.25) }),
                    stroke: new Stroke({ color: isInside ? "#ef4444" : "#ffffff", width: 2.5, lineDash: strokeDash })
                }));
            }
            else {
                // NON-SELECTED BOUNDARIES: Crisp thin 1.5px boundary outline
                feature.setStyle(new Style({
                    fill: new Fill({ color: hexToRgba(colorHex, 0.08) }),
                    stroke: new Stroke({ color: "rgba(56, 189, 248, 0.65)", width: 1.5, lineDash: [3, 3] })
                }));
            }
        });
        if (geofenceViewMode === "AUTO_FIT" && targetSelectedFeature) {
            // AUTO-FIT BBOX FOCUS MODE: Fit OpenLayers view extent to polygon bounding box with 40px padding
            const featureExtent = targetSelectedFeature.getGeometry()?.getExtent();
            if (featureExtent) {
                mapInstanceRef.current.getView().fit(featureExtent, { padding: [40, 40, 40, 40], duration: 800 });
            }
        }
        else {
            mapInstanceRef.current.getView().animate({
                center: fromLonLat(currentDistrictObj.center),
                zoom: currentDistrictObj.zoom,
                duration: 800
            });
        }
    }, [selectedCountryCode, selectedStateName, selectedDistrictId, zoneStatus, geofenceType, boundaryStyle, geofenceViewMode, showStatesLayer, showDistrictsLayer]);
    // Engine 2 & Engine 3 Dwell Time Timer Loop
    useEffect(() => {
        let dwellInterval = null;
        if (zoneStatus === "INSIDE") {
            dwellInterval = setInterval(() => { setDwellTimeMins((m) => m + 1); }, 3000);
        }
        return () => clearInterval(dwellInterval);
    }, [zoneStatus]);
    // Engine 2 Telemetry Simulation Timer Loop
    useEffect(() => {
        if (!isSimulatingGps)
            return;
        const interval = setInterval(() => {
            setLatitude((prev) => +(prev + 0.0003 * Math.cos((headingDeg * Math.PI) / 180)).toFixed(6));
            setLongitude((prev) => +(prev + 0.0003 * Math.sin((headingDeg * Math.PI) / 180)).toFixed(6));
            setHeadingDeg((prev) => (prev + 4) % 360);
            setBatteryPct((prev) => Math.max(10, prev - 1));
            setOdometerKm((prev) => +(prev + 0.02).toFixed(2));
            if (networkStatus === "OFFLINE")
                setOfflineRecordCount((prev) => prev + 1);
            if (latitude > 21.1455 && longitude > 79.0880 && latitude < 21.1485 && longitude < 79.0915 && zoneStatus === "OUTSIDE") {
                setZoneStatus("INSIDE");
                setBreachCount((c) => c + 1);
                setBreachLogs((prev) => [`[${new Date().toLocaleTimeString()}] 🔴 BREACH: Asset entered ${currentDistrictObj.name} geofence!`, ...prev.slice(0, 5)]);
            }
            setTelemetryLogs((prev) => [JSON.stringify({ time: new Date().toLocaleTimeString(), lat: latitude, lon: longitude, speed: speedKmh, heading: headingDeg, battery: batteryPct, ignition: ignitionState, satellites: satellitesCount, hdop: hdopValue }), ...prev.slice(0, 5)]);
        }, 1200);
        return () => clearInterval(interval);
    }, [isSimulatingGps, latitude, longitude, headingDeg, speedKmh, batteryPct, ignitionState, satellitesCount, hdopValue, networkStatus, zoneStatus, geofenceType, currentDistrictObj]);
    // Camera Helper Functions
    const animateCamera = (centerLonLat, zoom) => mapInstanceRef.current && olModulesRef.current && mapInstanceRef.current.getView().animate({ center: olModulesRef.current.fromLonLat(centerLonLat), zoom, duration: 800 });
    const handleZoomToSubstation = () => animateCamera([79.0882, 21.1458], 15);
    const handleJumpCityCenter = () => animateCamera([79.0800, 21.1500], 13);
    const handleResetNorth = () => mapInstanceRef.current?.getView().animate({ rotation: 0, duration: 500 });
    // Copy Handlers
    const handleCopyCoords = () => { navigator.clipboard.writeText(`Lat: ${latitude}, Lon: ${longitude}`); setCopyFeedback(true); setTimeout(() => setCopyFeedback(false), 2000); };
    const handleCopyFixPayload = () => { if (telemetryLogs.length > 0) {
        navigator.clipboard.writeText(telemetryLogs[0]);
        setCopyPayloadFeedback(true);
        setTimeout(() => setCopyPayloadFeedback(false), 2000);
    } };
    const handleCopySqlQuery = () => { navigator.clipboard.writeText(postGisQuery); setCopySqlQueryFeedback(true); setTimeout(() => setCopySqlQueryFeedback(false), 2000); };
    const handleCopyGeoJson = () => { navigator.clipboard.writeText(geoJsonPayload); setCopyGeoJsonFeedback(true); setTimeout(() => setCopyGeoJsonFeedback(false), 2000); };
    // Geocoding Jump Handler
    const handleJumpToCity = (cityName) => {
        setSearchCity(cityName);
        const cityCoordsMap = { Nagpur: [79.0882, 21.1458], Mumbai: [72.8777, 19.0760], Delhi: [77.1025, 28.7041], London: [-0.1276, 51.5074], NewYork: [-74.0060, 40.7128] };
        animateCamera(cityCoordsMap[cityName] || [79.0882, 21.1458], 12);
    };
    // MULTI-COUNTRY & STATE DROPDOWN SELECTION HANDLERS
    const handleSelectCountry = (countryCode) => {
        setSelectedCountryCode(countryCode);
        const foundCountry = GLOBAL_COUNTRIES_DATASET.find((c) => c.countryCode === countryCode);
        if (foundCountry && foundCountry.states.length > 0) {
            const firstState = foundCountry.states[0];
            setSelectedStateName(firstState.stateName);
            setSelectedDistrictId(firstState.entireStateBoundary.id);
        }
    };
    const handleSelectState = (stateName) => {
        setSelectedStateName(stateName);
        const foundState = currentCountryObj.states.find((s) => s.stateName === stateName);
        if (foundState) {
            setSelectedDistrictId(foundState.entireStateBoundary.id);
        }
    };
    const handleSelectDistrict = (districtId) => {
        setSelectedDistrictId(districtId);
    };
    // Map Snapshot PNG Export Handler
    const handleExportMapSnapshot = () => {
        if (!mapInstanceRef.current)
            return;
        mapInstanceRef.current.once("rendercomplete", () => {
            const mapCanvas = document.createElement("canvas");
            const size = mapInstanceRef.current.getSize();
            mapCanvas.width = size[0];
            mapCanvas.height = size[1];
            const mapContext = mapCanvas.getContext("2d");
            Array.prototype.forEach.call(mapElementRef.current?.querySelectorAll(".ol-layer canvas") || [], (canvas) => {
                if (canvas.width > 0 && mapContext) {
                    const opacity = canvas.parentNode.style.opacity;
                    mapContext.globalAlpha = opacity === "" ? 1 : Number(opacity);
                    const matrix = canvas.style.transform.match(/^matrix\(([^\(]*)\)$/)?.[1]?.split(",").map(Number);
                    mapContext.setTransform(matrix ? matrix[0] : 1, matrix ? matrix[1] : 0, matrix ? matrix[2] : 0, matrix ? matrix[3] : 1, matrix ? matrix[4] : 0, matrix ? matrix[5] : 0);
                    mapContext.drawImage(canvas, 0, 0);
                }
            });
            const link = document.createElement("a");
            link.download = `geosphere_map_snapshot_${Date.now()}.png`;
            link.href = mapCanvas.toDataURL("image/png");
            link.click();
        });
        mapInstanceRef.current.renderSync();
    };
    const handleTriggerAnomaly = (type) => { setActiveAnomaly(type); if (type === "SPEEDING")
        setSpeedKmh(105);
    else if (type === "HARSH_BRAKE")
        setSpeedKmh(5); setTimeout(() => setActiveAnomaly(null), 3000); };
    // Engine 3: Toggle Zone Breach Handler
    const handleSimulateGeofence = () => {
        const nextStatus = zoneStatus === "OUTSIDE" ? "INSIDE" : "OUTSIDE";
        setZoneStatus(nextStatus);
        if (nextStatus === "INSIDE") {
            setBreachCount((c) => c + 1);
            setBreachLogs((prev) => [`[${new Date().toLocaleTimeString()}] 🔴 BREACH: Asset entered ${currentDistrictObj.name} geofence!`, ...prev.slice(0, 5)]);
        }
        else {
            setBreachLogs((prev) => [`[${new Date().toLocaleTimeString()}] 🟢 CLEAR: Asset exited ${currentDistrictObj.name} geofence.`, ...prev.slice(0, 5)]);
        }
    };
    // Engine 3: Trigger Action Handler
    const handleTriggerGeofenceAction = (actionType) => {
        setActiveActionTrigger(actionType);
        setTimeout(() => setActiveActionTrigger(null), 2500);
    };
    const handleForceSync = () => { setOfflineRecordCount(0); setLastSyncOpId(`op_sync_${Date.now()}`); };
    // Filtered dataset for left search
    const filteredCountryStates = currentCountryObj.states.filter((s) => s.stateName.toLowerCase().includes(searchFilter.toLowerCase()) || s.districts.some((d) => d.name.toLowerCase().includes(searchFilter.toLowerCase())));
    return (_jsxs("div", { style: { display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", backgroundColor: "#020617", color: "#f8fafc", fontFamily: "sans-serif" }, children: [_jsx("link", { rel: "stylesheet", href: "https://cdn.jsdelivr.net/npm/ol@10.4.0/ol.css" }), _jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#0f172a", padding: "10px 20px", borderBottom: "1px solid #1e293b" }, children: [_jsx("div", { style: { fontSize: "1.05rem", fontWeight: "bold", color: "#38bdf8", letterSpacing: "0.5px" }, children: "\uD83C\uDF0D GEOSPHERE: GLOBAL BOUNDARIES & MULTI-VIEW GEOFENCE ENGINE" }), _jsx("div", { style: { display: "flex", gap: "6px" }, children: ["MAPPING", "TELEMETRY", "GEOFENCE", "ROUTING", "OFFLINE_SYNC"].map((eng, idx) => (_jsx("button", { onClick: () => setActiveEngine(eng), style: { backgroundColor: activeEngine === eng ? "#0284c7" : "#1e293b", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 12px", cursor: "pointer", fontWeight: "bold", fontSize: "0.78rem" }, children: idx === 0 ? "🗺️ 1. Mapping" : idx === 1 ? "🚗 2. Telemetry" : idx === 2 ? "🛡️ 3. Geofence" : idx === 3 ? "🛣️ 4. Routing" : "⚡ 5. Sync" }, eng))) })] }), _jsxs("div", { style: { display: "flex", flex: 1, overflow: "hidden" }, children: [geofenceViewMode !== "FULLSCREEN" && (_jsxs("div", { style: { width: "380px", backgroundColor: "#0f172a", borderRight: "1px solid #1e293b", padding: "16px", overflowY: "auto" }, children: [activeEngine === "MAPPING" && (_jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "14px" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [_jsx("h3", { style: { margin: 0, fontSize: "1.05rem", color: "#38bdf8" }, children: "\uD83D\uDDFA\uFE0F Engine 1: Master 10-Feature GIS Suite" }), _jsx("button", { onClick: () => setShowGuide(!showGuide), style: { backgroundColor: "#0284c7", color: "#fff", border: "none", borderRadius: "4px", padding: "4px 8px", fontSize: "0.75rem", cursor: "pointer", fontWeight: "bold" }, children: showGuide ? "Hide Guide" : "📖 User Guide" })] }), showGuide && (_jsxs("div", { style: { backgroundColor: "#0284c7", color: "#ffffff", padding: "12px", borderRadius: "8px", border: "1px solid #38bdf8", fontSize: "0.78rem", lineHeight: "1.4" }, children: [_jsx("div", { style: { fontWeight: "bold", fontSize: "0.82rem", marginBottom: "6px" }, children: "\uD83D\uDCD6 10-FEATURE MASTER GIS QA TESTING PROTOCOL:" }), _jsxs("ol", { style: { margin: 0, paddingLeft: "16px" }, children: [_jsxs("li", { children: [_jsx("strong", { children: "Map Styles" }), ": Switch between 6 Map Style radios."] }), _jsxs("li", { children: [_jsx("strong", { children: "Spatial CRS" }), ": Verify `EPSG:3857` & `EPSG:4326` badges."] }), _jsxs("li", { children: [_jsx("strong", { children: "Tile Opacity" }), ": Drag Opacity slider (0%-100%)."] }), _jsxs("li", { children: [_jsx("strong", { children: "Vector Feed" }), ": Toggle Vector Layer Feed (`ENABLED`/`DISABLED`)."] }), _jsxs("li", { children: [_jsx("strong", { children: "Camera Presets" }), ": Click \"Zoom Substation\", \"Jump City Center\", or \"Reset North\"."] }), _jsxs("li", { children: [_jsx("strong", { children: "BBOX & Coords Inspector" }), ": Click \"Copy Coords\" to export active Lat/Lon."] }), _jsxs("li", { children: [_jsx("strong", { children: "Distance & Area Tool" }), ": Inspect live geodesic calculations (`4.82 km`, `1.25 sq km`)."] }), _jsxs("li", { children: [_jsx("strong", { children: "Location Search" }), ": Click city presets (Nagpur, Mumbai, Delhi, London, NY)."] }), _jsxs("li", { children: [_jsx("strong", { children: "PNG Export" }), ": Click \"Export PNG Snapshot\" to download map screenshot."] }), _jsxs("li", { children: [_jsx("strong", { children: "Z-Index Manager" }), ": Toggle Z-Index stacking rendering order."] })] })] })), _jsxs("div", { style: { backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }, children: [_jsx("div", { style: { fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "8px" }, children: "1. Type of Map Style View (6 Industry Modes):" }), _jsx("div", { style: { display: "flex", flexDirection: "column", gap: "6px" }, children: [
                                                    { id: "STANDARD", label: "🗺️ Standard Vector Road View" }, { id: "SATELLITE", label: "🛰️ Satellite Imagery Mode" },
                                                    { id: "HYBRID", label: "🏷️ Satellite Hybrid View" }, { id: "DARK_MIDNIGHT", label: "🌙 Dark Midnight Canvas" },
                                                    { id: "GRAYSCALE", label: "⚪ Monochromatic Grayscale" }, { id: "TERRAIN", label: "⛰️ Topographic Terrain View" },
                                                ].map((s) => (_jsxs("label", { style: { display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", color: "#f1f5f9", cursor: "pointer" }, children: [_jsx("input", { type: "radio", name: "mapStyleView", value: s.id, checked: mapStyleView === s.id, onChange: () => setMapStyleView(s.id), style: { accentColor: "#0284c7", cursor: "pointer" } }), s.label] }, s.id))) })] }), _jsxs("div", { style: { backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }, children: [_jsx("div", { style: { fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "6px" }, children: "2. Spatial Projection & CRS Engine:" }), _jsxs("div", { style: { fontSize: "0.75rem", color: "#94a3b8", marginBottom: "2px" }, children: ["Active Projection: ", _jsx("strong", { style: { color: "#34d399" }, children: projection })] }), _jsxs("div", { style: { fontSize: "0.75rem", color: "#94a3b8", marginBottom: "2px" }, children: ["Primary Data Space: ", _jsx("strong", { style: { color: "#f1f5f9" }, children: "EPSG:4326 (WGS84 Geodetic)" })] }), _jsxs("div", { style: { fontSize: "0.75rem", color: "#94a3b8" }, children: ["Camera Zoom Level: ", _jsx("strong", { style: { color: "#f8fafc" }, children: zoomLevel }), " (Range 1-20)"] })] }), _jsxs("div", { style: { backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "6px" }, children: [_jsx("span", { children: "3. Tile Layer Opacity Engine:" }), _jsxs("span", { style: { color: "#34d399" }, children: [layerOpacity, "%"] })] }), _jsx("input", { type: "range", min: "0", max: "100", value: layerOpacity, onChange: (e) => setLayerOpacity(+e.target.value), style: { width: "100%", cursor: "pointer", accentColor: "#0284c7" } })] }), _jsxs("div", { style: { backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }, children: [_jsx("div", { style: { fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "6px" }, children: "4. OpenLayers Vector Layer Feed Control:" }), _jsx("button", { onClick: () => setVectorTilesActive(!vectorTilesActive), style: { width: "100%", padding: "8px", backgroundColor: vectorTilesActive ? "#065f46" : "#475569", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "0.75rem" }, children: vectorTilesActive ? "OpenLayers Vector Layer Feed ENABLED" : "Vector Layer Feed DISABLED" })] }), _jsxs("div", { style: { backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }, children: [_jsx("div", { style: { fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "6px" }, children: "5. OpenLayers Camera View Presets:" }), _jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "6px" }, children: [_jsxs("div", { style: { display: "flex", gap: "6px" }, children: [_jsx("button", { onClick: handleZoomToSubstation, style: { flex: 1, backgroundColor: "#0284c7", color: "#fff", border: "none", borderRadius: "6px", padding: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "0.75rem" }, children: "\uD83D\uDD0D Zoom Substation" }), _jsx("button", { onClick: handleJumpCityCenter, style: { flex: 1, backgroundColor: "#0284c7", color: "#fff", border: "none", borderRadius: "6px", padding: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "0.75rem" }, children: "\uD83D\uDCCD Jump City Center" })] }), _jsx("button", { onClick: handleResetNorth, style: { width: "100%", backgroundColor: "#334155", color: "#fff", border: "none", borderRadius: "6px", padding: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "0.75rem" }, children: "\uD83E\uDDED Reset North Heading (0\u00B0)" })] })] }), _jsxs("div", { style: { backgroundColor: "#020617", padding: "12px", borderRadius: "8px", border: "1px solid #1e293b" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }, children: [_jsx("div", { style: { fontSize: "0.75rem", fontWeight: "bold", color: "#94a3b8" }, children: "6. Viewport BBOX & Center Inspector:" }), _jsx("button", { onClick: handleCopyCoords, style: { backgroundColor: copyFeedback ? "#10b981" : "#334155", color: "#fff", border: "none", borderRadius: "4px", padding: "3px 8px", fontSize: "0.7rem", cursor: "pointer", fontWeight: "bold" }, children: copyFeedback ? "✓ Copied!" : "📋 Copy Coords" })] }), _jsxs("div", { style: { fontSize: "0.75rem", color: "#38bdf8", marginBottom: "4px" }, children: ["Center: Lat ", latitude.toFixed(4), ", Lon ", longitude.toFixed(4)] }), _jsx("div", { style: { fontSize: "0.75rem", color: "#94a3b8", marginBottom: "2px" }, children: "BBOX Bounds:" }), _jsx("code", { style: { fontSize: "0.72rem", color: "#34d399", wordBreak: "break-all" }, children: bboxExtent })] }), _jsxs("div", { style: { backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }, children: [_jsx("div", { style: { fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "6px" }, children: "7. Geodesic Measurement Engine:" }), _jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "4px" }, children: [_jsx("span", { style: { color: "#94a3b8" }, children: "Line Distance:" }), _jsxs("strong", { style: { color: "#34d399" }, children: [measuredDistanceKm, " km (", Math.round(measuredDistanceKm * 1000), " m)"] })] }), _jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }, children: [_jsx("span", { style: { color: "#94a3b8" }, children: "Polygon Area:" }), _jsxs("strong", { style: { color: "#38bdf8" }, children: [measuredAreaSqKm, " sq km"] })] })] }), _jsxs("div", { style: { backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }, children: [_jsx("div", { style: { fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "6px" }, children: "8. Geocoding Location Search:" }), _jsx("div", { style: { display: "flex", gap: "4px", flexWrap: "wrap" }, children: ["Nagpur", "Mumbai", "Delhi", "London", "NewYork"].map((city) => (_jsxs("button", { onClick: () => handleJumpToCity(city), style: { backgroundColor: searchCity === city ? "#0284c7" : "#020617", color: "#fff", border: "1px solid #334155", borderRadius: "4px", padding: "4px 8px", fontSize: "0.72rem", cursor: "pointer", fontWeight: "bold" }, children: ["\uD83D\uDCCD ", city] }, city))) })] }), _jsxs("div", { style: { backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }, children: [_jsx("div", { style: { fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "6px" }, children: "9. Map Snapshot & PNG Export:" }), _jsx("button", { onClick: handleExportMapSnapshot, style: { width: "100%", padding: "8px", backgroundColor: "#0284c7", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "0.75rem" }, children: "\uD83D\uDDBC\uFE0F Download Map Canvas Screenshot (.png)" })] }), _jsxs("div", { style: { backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }, children: [_jsx("div", { style: { fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "6px" }, children: "10. Layer Z-Index Stacking Manager:" }), _jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", marginBottom: "4px" }, children: [_jsx("span", { style: { color: "#94a3b8" }, children: "Basemap Layer:" }), _jsxs("button", { onClick: () => setLayerZIndex((z) => ({ ...z, basemap: z.basemap === 0 ? 3 : 0 })), style: { backgroundColor: "#020617", color: "#38bdf8", border: "1px solid #334155", borderRadius: "4px", padding: "2px 6px", fontSize: "0.7rem", cursor: "pointer" }, children: ["Z-Index: ", layerZIndex.basemap] })] }), _jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem" }, children: [_jsx("span", { style: { color: "#94a3b8" }, children: "Vector Features:" }), _jsxs("button", { onClick: () => setLayerZIndex((z) => ({ ...z, vector: z.vector === 1 ? 4 : 1 })), style: { backgroundColor: "#020617", color: "#34d399", border: "1px solid #334155", borderRadius: "4px", padding: "2px 6px", fontSize: "0.7rem", cursor: "pointer" }, children: ["Z-Index: ", layerZIndex.vector] })] })] })] })), activeEngine === "TELEMETRY" && (_jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "14px" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [_jsx("h3", { style: { margin: 0, fontSize: "1.05rem", color: "#38bdf8" }, children: "\uD83D\uDE97 Engine 2: Master 10-Feature Telematics Suite" }), _jsx("button", { onClick: () => setShowEngine2Guide(!showEngine2Guide), style: { backgroundColor: "#0284c7", color: "#fff", border: "none", borderRadius: "4px", padding: "4px 8px", fontSize: "0.75rem", cursor: "pointer", fontWeight: "bold" }, children: showEngine2Guide ? "Hide Guide" : "📖 User Guide" })] }), showEngine2Guide && (_jsxs("div", { style: { backgroundColor: "#0284c7", color: "#ffffff", padding: "12px", borderRadius: "8px", border: "1px solid #38bdf8", fontSize: "0.78rem", lineHeight: "1.4" }, children: [_jsx("div", { style: { fontWeight: "bold", fontSize: "0.82rem", marginBottom: "6px" }, children: "\uD83D\uDCD6 10-FEATURE TELEMETRY QA TESTING PROTOCOL:" }), _jsxs("ol", { style: { margin: 0, paddingLeft: "16px" }, children: [_jsxs("li", { children: ["Click ", _jsx("strong", { children: "\"Start Live GPS Motion\"" }), " to animate vehicle navigation icon."] }), _jsxs("li", { children: ["Drag the ", _jsx("strong", { children: "Speed slider" }), " (0-120 km/h) to adjust telemetry update speed."] }), _jsxs("li", { children: ["Toggle ", _jsx("strong", { children: "\"Follow Camera Auto-Center\"" }), " to lock/unlock camera auto-pan."] }), _jsxs("li", { children: ["Toggle ", _jsx("strong", { children: "\"Live Map Label Badge\"" }), " overlay above the vehicle marker."] }), _jsxs("li", { children: ["Inspect the ", _jsx("strong", { children: "Sensors HUD" }), " (Ignition, Battery %, Fuel %, Odometer)."] }), _jsxs("li", { children: ["Inspect ", _jsx("strong", { children: "GPS Precision" }), " (Satellites & HDOP 0.8 rating)."] }), _jsxs("li", { children: ["Click ", _jsx("strong", { children: "\"Speeding Alert\"" }), ", ", _jsx("strong", { children: "\"Harsh Brake\"" }), ", or ", _jsx("strong", { children: "\"Panic SOS Alarm\"" }), "."] }), _jsx("li", { children: "Inspect live streaming JSON telemetry payloads in the fix log." }), _jsxs("li", { children: ["Click ", _jsx("strong", { children: "\"\uD83D\uDCCB Copy Fix Payload\"" }), " for 1-click clipboard export."] }), _jsxs("li", { children: ["Observe green ", _jsx("strong", { children: "motion breadcrumbs" }), " (`ol/geom/LineString`) on map."] })] })] })), _jsxs("div", { style: { backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }, children: [_jsx("div", { style: { fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "8px" }, children: "1. Live GPS Motion & Bearing Engine:" }), _jsx("button", { onClick: () => setIsSimulatingGps(!isSimulatingGps), style: { width: "100%", backgroundColor: isSimulatingGps ? "#ef4444" : "#10b981", color: "#fff", border: "none", padding: "10px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", marginBottom: "8px", fontSize: "0.85rem" }, children: isSimulatingGps ? "⏸️ Pause GPS Motion" : "▶️ Start Live GPS Motion" }), _jsxs("div", { style: { fontSize: "0.75rem", color: "#94a3b8" }, children: ["Heading Angle: ", _jsxs("strong", { style: { color: "#34d399" }, children: [headingDeg, "\u00B0 (360\u00B0 Dynamic Icon Rotation)"] })] })] }), _jsxs("div", { style: { backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "6px" }, children: [_jsx("span", { children: "2. Dynamic Speed Control:" }), _jsxs("span", { style: { color: "#34d399" }, children: [speedKmh, " km/h"] })] }), _jsx("input", { type: "range", min: "0", max: "120", value: speedKmh, onChange: (e) => setSpeedKmh(+e.target.value), style: { width: "100%", cursor: "pointer", accentColor: "#0284c7" } })] }), _jsxs("div", { style: { backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }, children: [_jsx("div", { style: { fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "6px" }, children: "3. Follow Camera Auto-Center Mode:" }), _jsx("button", { onClick: () => setFollowCamera(!followCamera), style: { width: "100%", padding: "8px", backgroundColor: followCamera ? "#065f46" : "#475569", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "0.75rem" }, children: followCamera ? "🎥 Follow Camera Auto-Center ENABLED" : "Camera Auto-Center DISABLED" })] }), _jsxs("div", { style: { backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }, children: [_jsx("div", { style: { fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "6px" }, children: "4. Live Vehicle Map Label Badge Overlay:" }), _jsx("button", { onClick: () => setShowMapBadge(!showMapBadge), style: { width: "100%", padding: "8px", backgroundColor: showMapBadge ? "#0284c7" : "#475569", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "0.75rem" }, children: showMapBadge ? "🏷️ Map Label Badge Overlay ENABLED" : "Map Badge Overlay DISABLED" })] }), _jsxs("div", { style: { backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }, children: [_jsx("div", { style: { fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "8px" }, children: "5. Vehicle Telemetry Sensors HUD:" }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "0.75rem" }, children: [_jsxs("div", { style: { backgroundColor: "#020617", padding: "6px 8px", borderRadius: "4px" }, children: [_jsx("span", { style: { color: "#94a3b8" }, children: "Ignition:" }), " ", _jsx("strong", { style: { color: ignitionState ? "#10b981" : "#ef4444" }, children: ignitionState ? "🟢 ON" : "🔴 OFF" })] }), _jsxs("div", { style: { backgroundColor: "#020617", padding: "6px 8px", borderRadius: "4px" }, children: [_jsx("span", { style: { color: "#94a3b8" }, children: "Battery:" }), " ", _jsxs("strong", { style: { color: "#38bdf8" }, children: [batteryPct, "%"] })] }), _jsxs("div", { style: { backgroundColor: "#020617", padding: "6px 8px", borderRadius: "4px" }, children: [_jsx("span", { style: { color: "#94a3b8" }, children: "Fuel Level:" }), " ", _jsxs("strong", { style: { color: "#f59e0b" }, children: [fuelPct, "%"] })] }), _jsxs("div", { style: { backgroundColor: "#020617", padding: "6px 8px", borderRadius: "4px" }, children: [_jsx("span", { style: { color: "#94a3b8" }, children: "Odometer:" }), " ", _jsxs("strong", { style: { color: "#34d399" }, children: [odometerKm, " km"] })] })] })] }), _jsxs("div", { style: { backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }, children: [_jsx("div", { style: { fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "6px" }, children: "6. GPS Precision & DOP Engine:" }), _jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }, children: [_jsxs("span", { style: { color: "#94a3b8" }, children: ["Satellites: ", _jsxs("strong", { style: { color: "#34d399" }, children: [satellitesCount, " Connected"] })] }), _jsxs("span", { style: { color: "#94a3b8" }, children: ["HDOP Precision: ", _jsxs("strong", { style: { color: "#38bdf8" }, children: [hdopValue, " (EXCELLENT)"] })] })] })] }), _jsxs("div", { style: { backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }, children: [_jsx("div", { style: { fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "8px" }, children: "7. Driving Anomaly Event Simulator:" }), _jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "6px" }, children: [_jsxs("div", { style: { display: "flex", gap: "6px" }, children: [_jsx("button", { onClick: () => handleTriggerAnomaly("SPEEDING"), style: { flex: 1, backgroundColor: "#f59e0b", color: "#fff", border: "none", borderRadius: "4px", padding: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "0.72rem" }, children: "\u26A1 Speeding Alert" }), _jsx("button", { onClick: () => handleTriggerAnomaly("HARSH_BRAKE"), style: { flex: 1, backgroundColor: "#e11d48", color: "#fff", border: "none", borderRadius: "4px", padding: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "0.72rem" }, children: "\uD83D\uDED1 Harsh Brake" })] }), _jsx("button", { onClick: () => handleTriggerAnomaly("SOS"), style: { width: "100%", backgroundColor: "#dc2626", color: "#fff", border: "none", borderRadius: "4px", padding: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "0.72rem" }, children: "\uD83D\uDEA8 Panic / SOS Alarm" })] }), activeAnomaly && _jsxs("div", { style: { marginTop: "8px", backgroundColor: "#ef4444", color: "#fff", padding: "6px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "bold", textAlign: "center" }, children: ["\u26A0\uFE0F ALERT TRIGGERED: ", activeAnomaly, " EVENT!"] })] }), _jsxs("div", { style: { backgroundColor: "#020617", padding: "12px", borderRadius: "8px", border: "1px solid #1e293b" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }, children: [_jsx("div", { style: { fontSize: "0.75rem", fontWeight: "bold", color: "#94a3b8" }, children: "8. Live Telemetry Fix Stream Log:" }), _jsx("button", { onClick: handleCopyFixPayload, style: { backgroundColor: copyPayloadFeedback ? "#10b981" : "#334155", color: "#fff", border: "none", borderRadius: "4px", padding: "3px 8px", fontSize: "0.7rem", cursor: "pointer", fontWeight: "bold" }, children: copyPayloadFeedback ? "✓ Copied!" : "📋 Copy Fix Payload" })] }), _jsx("div", { style: { backgroundColor: "#0f172a", padding: "8px", borderRadius: "6px", maxHeight: "140px", overflowY: "auto" }, children: telemetryLogs.length === 0 ? _jsx("span", { style: { fontSize: "0.75rem", color: "#64748b" }, children: "Click Start Live GPS Motion to stream payloads..." }) : telemetryLogs.map((l, i) => _jsx("div", { style: { fontSize: "0.72rem", fontFamily: "monospace", color: "#34d399", marginBottom: "2px" }, children: l }, i)) })] }), _jsxs("div", { style: { backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }, children: [_jsx("div", { style: { fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "4px" }, children: "10. OpenLayers Motion Breadcrumbs:" }), _jsxs("div", { style: { fontSize: "0.75rem", color: "#94a3b8" }, children: ["Trail Status: ", _jsxs("strong", { style: { color: "#10b981" }, children: ["ol/geom/LineString (", breadcrumbCoordsRef.current.length, " Waypoints) ACTIVE"] })] })] })] })), activeEngine === "GEOFENCE" && (_jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "14px" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [_jsx("h3", { style: { margin: 0, fontSize: "1.05rem", color: "#38bdf8" }, children: "\uD83D\uDEE1\uFE0F Engine 3: Master 10-Feature Geofence Suite" }), _jsx("button", { onClick: () => setShowEngine3Guide(!showEngine3Guide), style: { backgroundColor: "#0284c7", color: "#fff", border: "none", borderRadius: "4px", padding: "4px 8px", fontSize: "0.75rem", cursor: "pointer", fontWeight: "bold" }, children: showEngine3Guide ? "Hide Guide" : "📖 User Guide" })] }), showEngine3Guide && (_jsxs("div", { style: { backgroundColor: "#0284c7", color: "#ffffff", padding: "12px", borderRadius: "8px", border: "1px solid #38bdf8", fontSize: "0.78rem", lineHeight: "1.4" }, children: [_jsx("div", { style: { fontWeight: "bold", fontSize: "0.82rem", marginBottom: "6px" }, children: "\uD83D\uDCD6 10-FEATURE GEOFENCE QA TESTING PROTOCOL:" }), _jsxs("ol", { style: { margin: 0, paddingLeft: "16px" }, children: [_jsxs("li", { children: [_jsx("strong", { children: "Multi-Country Dropdown" }), ": Switch between \uD83C\uDDEE\uD83C\uDDF3 India, \uD83C\uDDFA\uD83C\uDDF8 US, \uD83C\uDDEC\uD83C\uDDE7 UK, \uD83C\uDDE6\uD83C\uDDFA Australia, \uD83C\uDDE8\uD83C\uDDE6 Canada!"] }), _jsxs("li", { children: [_jsx("strong", { children: "Alternative View Modes" }), ": Click `\uD83D\uDD0D Auto-Fit BBOX`, `\uD83D\uDEF0\uFE0F Satellite Focus`, `\uD83D\uDCFA Fullscreen View`."] }), _jsxs("li", { children: [_jsx("strong", { children: "Crisp Thin-Line Vector Styling" }), ": Thin 1.5px/2.5px crisp outlines matching GIS top-view maps!"] }), _jsxs("li", { children: [_jsx("strong", { children: "ST_Contains Evaluator" }), ": Click \"Toggle Zone Breach\" (Green \u2194 Red)."] }), _jsxs("li", { children: [_jsx("strong", { children: "Breach Event Logs" }), ": Inspect total breach count & scrolling event log."] }), _jsxs("li", { children: [_jsx("strong", { children: "PostGIS SQL Inspector" }), ": Click \"\uD83D\uDCCB Copy SQL Query\" for ST_Contains query."] }), _jsxs("li", { children: [_jsx("strong", { children: "Action Triggers" }), ": Click Webhook, SMS Alert, or Immobilizer buttons."] }), _jsxs("li", { children: [_jsx("strong", { children: "Perimeter & Area" }), ": View enclosure area & perimeter for selected state/district."] }), _jsxs("li", { children: [_jsx("strong", { children: "Zone Dwell Time & Speed Limit" }), ": Inspect dwell counter & 30 km/h limit."] }), _jsxs("li", { children: [_jsx("strong", { children: "GeoJSON Exporter" }), ": Click \"\uD83D\uDCCB Copy GeoJSON\" to export state/district polygon payload."] })] })] })), _jsxs("div", { style: { backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #0284c7" }, children: [_jsx("div", { style: { fontSize: "0.82rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "8px" }, children: "\uD83D\uDC41\uFE0F Alternative Geofence Inspection Perspectives:" }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }, children: [_jsx("button", { onClick: () => setGeofenceViewMode("STANDARD"), style: { backgroundColor: geofenceViewMode === "STANDARD" ? "#0284c7" : "#020617", color: "#fff", border: "1px solid #334155", borderRadius: "6px", padding: "6px", fontSize: "0.72rem", cursor: "pointer", fontWeight: "bold" }, children: "\uD83D\uDDFA\uFE0F Standard View" }), _jsx("button", { onClick: () => setGeofenceViewMode("AUTO_FIT"), style: { backgroundColor: geofenceViewMode === "AUTO_FIT" ? "#0284c7" : "#020617", color: "#fff", border: "1px solid #334155", borderRadius: "6px", padding: "6px", fontSize: "0.72rem", cursor: "pointer", fontWeight: "bold" }, children: "\uD83D\uDD0D Auto-Fit BBOX" }), _jsx("button", { onClick: () => setGeofenceViewMode("SATELLITE_FOCUS"), style: { backgroundColor: geofenceViewMode === "SATELLITE_FOCUS" ? "#0284c7" : "#020617", color: "#fff", border: "1px solid #334155", borderRadius: "6px", padding: "6px", fontSize: "0.72rem", cursor: "pointer", fontWeight: "bold" }, children: "\uD83D\uDEF0\uFE0F Satellite Focus" }), _jsx("button", { onClick: () => setGeofenceViewMode("FULLSCREEN"), style: { backgroundColor: geofenceViewMode === "FULLSCREEN" ? "#0284c7" : "#020617", color: "#fff", border: "1px solid #334155", borderRadius: "6px", padding: "6px", fontSize: "0.72rem", cursor: "pointer", fontWeight: "bold" }, children: "\uD83D\uDCFA Fullscreen View" })] })] }), _jsxs("div", { style: { backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }, children: [_jsx("div", { style: { fontSize: "0.82rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "8px" }, children: "\uD83D\uDD0D Search & Layer Display Controls:" }), _jsx("input", { type: "text", placeholder: "\uD83D\uDD0D Search state or district...", value: searchFilter, onChange: (e) => setSearchFilter(e.target.value), style: { width: "100%", padding: "6px 10px", backgroundColor: "#020617", color: "#fff", border: "1px solid #334155", borderRadius: "6px", fontSize: "0.8rem", marginBottom: "10px" } }), _jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "0.75rem", color: "#f8fafc" }, children: [_jsxs("label", { style: { display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }, children: [_jsx("input", { type: "checkbox", checked: showStatesLayer, onChange: (e) => setShowStatesLayer(e.target.checked), style: { accentColor: "#38bdf8" } }), "\uD83D\uDDFA\uFE0F States Layer"] }), _jsxs("label", { style: { display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }, children: [_jsx("input", { type: "checkbox", checked: showDistrictsLayer, onChange: (e) => setShowDistrictsLayer(e.target.checked), style: { accentColor: "#34d399" } }), "\uD83D\uDCCD Districts Layer"] }), _jsxs("label", { style: { display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }, children: [_jsx("input", { type: "checkbox", checked: showCapitalsLayer, onChange: (e) => setShowCapitalsLayer(e.target.checked), style: { accentColor: "#f59e0b" } }), "\u2B50 Capitals Markers"] }), _jsxs("label", { style: { display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }, children: [_jsx("input", { type: "checkbox", checked: showLabelsLayer, onChange: (e) => setShowLabelsLayer(e.target.checked), style: { accentColor: "#e11d48" } }), "\uD83C\uDFF7\uFE0F Map Labels"] })] })] }), _jsxs("div", { style: { backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }, children: [_jsx("div", { style: { fontSize: "0.82rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "8px" }, children: "\uD83C\uDF0D Country & Administrative Boundary Dropdowns:" }), _jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "8px" }, children: [_jsxs("div", { children: [_jsx("label", { style: { fontSize: "0.72rem", color: "#94a3b8", display: "block", marginBottom: "3px" }, children: "1. Select Country (Global Boundary Space):" }), _jsx("select", { value: selectedCountryCode, onChange: (e) => handleSelectCountry(e.target.value), style: { width: "100%", padding: "6px 8px", backgroundColor: "#020617", color: "#34d399", border: "1px solid #334155", borderRadius: "6px", fontSize: "0.82rem", fontWeight: "bold", cursor: "pointer" }, children: GLOBAL_COUNTRIES_DATASET.map((c) => (_jsxs("option", { value: c.countryCode, children: [c.flagEmoji, " ", c.countryName, " (", c.capitalName, ")"] }, c.countryCode))) })] }), _jsxs("div", { children: [_jsx("label", { style: { fontSize: "0.72rem", color: "#94a3b8", display: "block", marginBottom: "3px" }, children: "2. Select State / Province / Region:" }), _jsx("select", { value: selectedStateName, onChange: (e) => handleSelectState(e.target.value), style: { width: "100%", padding: "6px 8px", backgroundColor: "#020617", color: "#38bdf8", border: "1px solid #334155", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "bold", cursor: "pointer" }, children: filteredCountryStates.map((st) => (_jsxs("option", { value: st.stateName, children: ["\uD83C\uDFDB\uFE0F ", st.stateName, " (", st.stateCode, ")"] }, st.stateCode))) })] }), _jsxs("div", { children: [_jsx("label", { style: { fontSize: "0.72rem", color: "#94a3b8", display: "block", marginBottom: "3px" }, children: "3. Select Boundary Target (Entire Region OR District):" }), _jsx("select", { value: selectedDistrictId, onChange: (e) => handleSelectDistrict(e.target.value), style: { width: "100%", padding: "6px 8px", backgroundColor: "#020617", color: currentDistrictObj.isEntireState ? "#38bdf8" : "#34d399", border: "1px solid #334155", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "bold", cursor: "pointer" }, children: availableBoundaryOptions.map((opt) => (_jsx("option", { value: opt.id, children: opt.isEntireState ? `🌐 ${opt.name}` : `📍 ${opt.name}` }, opt.id))) })] })] })] }), _jsxs("div", { style: { backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }, children: [_jsx("div", { style: { fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "8px" }, children: "1. Multi-Geometry Zone Type (3 Modes):" }), _jsx("div", { style: { display: "flex", flexDirection: "column", gap: "6px" }, children: [
                                                    { id: "POLYGON", label: "⬡ Realistic Polygon Boundary (State/District)" },
                                                    { id: "CIRCULAR", label: "⭕ Circular Radial Zone (500m Radius)" },
                                                    { id: "CORRIDOR", label: "══ Polyline Corridor Buffer Zone" },
                                                ].map((z) => (_jsxs("label", { style: { display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", color: "#f1f5f9", cursor: "pointer" }, children: [_jsx("input", { type: "radio", name: "geofenceType", value: z.id, checked: geofenceType === z.id, onChange: () => setGeofenceType(z.id), style: { accentColor: "#0284c7", cursor: "pointer" } }), z.label] }, z.id))) })] }), _jsxs("div", { style: { backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }, children: [_jsx("div", { style: { fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "8px" }, children: "2. Spatial Containment Evaluator (ST_Contains):" }), _jsx("button", { onClick: handleSimulateGeofence, style: { width: "100%", backgroundColor: zoneStatus === "INSIDE" ? "#ef4444" : "#10b981", color: "#fff", border: "none", padding: "10px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", marginBottom: "8px", fontSize: "0.85rem" }, children: zoneStatus === "INSIDE" ? "🔴 TRIGGER EXITED ZONE (CLEAR)" : "⚡ TRIGGER ZONE BREACH (ENTERED)" }), _jsxs("div", { style: { fontSize: "0.78rem" }, children: ["Status: ", _jsx("strong", { style: { color: zoneStatus === "INSIDE" ? "#ef4444" : "#10b981" }, children: zoneStatus === "INSIDE" ? "🔴 INSIDE / BREACH ALARM" : "🟢 OUTSIDE / CLEAR" })] })] }), _jsxs("div", { style: { backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "8px" }, children: [_jsx("span", { children: "3. Breach Counter & Event Log:" }), _jsxs("span", { style: { color: "#ef4444" }, children: [breachCount, " Breaches"] })] }), _jsx("div", { style: { backgroundColor: "#020617", padding: "8px", borderRadius: "6px", maxHeight: "120px", overflowY: "auto" }, children: breachLogs.length === 0 ? _jsx("span", { style: { fontSize: "0.75rem", color: "#64748b" }, children: "Click Trigger Zone Breach to generate event logs..." }) : breachLogs.map((l, i) => _jsx("div", { style: { fontSize: "0.72rem", fontFamily: "monospace", color: l.includes("BREACH") ? "#ef4444" : "#34d399", marginBottom: "2px" }, children: l }, i)) })] }), _jsxs("div", { style: { backgroundColor: "#020617", padding: "12px", borderRadius: "8px", border: "1px solid #1e293b" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }, children: [_jsx("div", { style: { fontSize: "0.75rem", fontWeight: "bold", color: "#94a3b8" }, children: "4. PostGIS Spatial SQL Query:" }), _jsx("button", { onClick: handleCopySqlQuery, style: { backgroundColor: copySqlQueryFeedback ? "#10b981" : "#334155", color: "#fff", border: "none", borderRadius: "4px", padding: "3px 8px", fontSize: "0.7rem", cursor: "pointer", fontWeight: "bold" }, children: copySqlQueryFeedback ? "✓ Copied!" : "📋 Copy SQL Query" })] }), _jsx("code", { style: { fontSize: "0.72rem", color: "#38bdf8", wordBreak: "break-all" }, children: postGisQuery })] }), _jsxs("div", { style: { backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }, children: [_jsx("div", { style: { fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "8px" }, children: "5. Automated Action Triggers:" }), _jsx("div", { style: { display: "flex", gap: "6px", flexWrap: "wrap" }, children: ["SMS Alert", "Webhook POST", "Immobilizer"].map((action) => (_jsxs("button", { onClick: () => handleTriggerGeofenceAction(action), style: { flex: 1, backgroundColor: "#0284c7", color: "#fff", border: "none", borderRadius: "4px", padding: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "0.72rem" }, children: ["\u26A1 ", action] }, action))) }), activeActionTrigger && (_jsxs("div", { style: { marginTop: "6px", backgroundColor: "#10b981", color: "#fff", padding: "4px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "bold", textAlign: "center" }, children: ["\u2713 EXECUTED: ", activeActionTrigger, " Action Sent!"] }))] }), _jsxs("div", { style: { backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }, children: [_jsx("div", { style: { fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "6px" }, children: "6. Zone Area & Perimeter Engine:" }), _jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "4px" }, children: [_jsx("span", { style: { color: "#94a3b8" }, children: "Enclosure Area:" }), " ", _jsxs("strong", { style: { color: "#34d399" }, children: [currentDistrictObj.areaSqKm.toLocaleString(), " sq km"] })] }), _jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }, children: [_jsx("span", { style: { color: "#94a3b8" }, children: "Outer Perimeter:" }), " ", _jsxs("strong", { style: { color: "#38bdf8" }, children: [currentDistrictObj.perimeterKm.toLocaleString(), " km"] })] })] }), _jsxs("div", { style: { backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }, children: [_jsx("div", { style: { fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "6px" }, children: "7. Zone Dwell Time & Speed Limit Engine:" }), _jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "4px" }, children: [_jsx("span", { style: { color: "#94a3b8" }, children: "Zone Dwell Timer:" }), " ", _jsxs("strong", { style: { color: "#f59e0b" }, children: [dwellTimeMins, " mins active"] })] }), _jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }, children: [_jsx("span", { style: { color: "#94a3b8" }, children: "Zone Speed Limit:" }), " ", _jsxs("strong", { style: { color: "#ef4444" }, children: ["Max Allowed: ", zoneSpeedLimitKmh, " km/h"] })] })] }), _jsxs("div", { style: { backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }, children: [_jsx("div", { style: { fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "6px" }, children: "8. Zone Label & Boundary Style Engine:" }), _jsx("div", { style: { display: "flex", gap: "6px", marginBottom: "6px" }, children: ["DASHED", "SOLID", "GLOWING"].map((st) => (_jsx("button", { onClick: () => setBoundaryStyle(st), style: { flex: 1, backgroundColor: boundaryStyle === st ? "#0284c7" : "#020617", color: "#fff", border: "1px solid #334155", borderRadius: "4px", padding: "4px", fontSize: "0.7rem", cursor: "pointer", fontWeight: "bold" }, children: st }, st))) }), _jsx("button", { onClick: () => setShowZoneLabel(!showZoneLabel), style: { width: "100%", padding: "6px", backgroundColor: showZoneLabel ? "#065f46" : "#475569", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", fontSize: "0.72rem" }, children: showZoneLabel ? "🏷️ Zone Map Label Callout ENABLED" : "Zone Label Callout DISABLED" })] }), _jsxs("div", { style: { backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }, children: [_jsx("div", { style: { fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "6px" }, children: "9. Operating Hours Schedule Policy:" }), _jsx("button", { onClick: () => setScheduleActive(!scheduleActive), style: { width: "100%", padding: "6px", backgroundColor: scheduleActive ? "#065f46" : "#475569", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", fontSize: "0.72rem", marginBottom: "4px" }, children: scheduleActive ? "🕒 Schedule Policy (Mon-Fri 08:00-18:00) ACTIVE" : "Schedule Policy OFF" }), _jsxs("div", { style: { fontSize: "0.72rem", color: "#94a3b8" }, children: ["Off-Hours Access: ", _jsx("strong", { style: { color: "#ef4444" }, children: "STRICT BREACH ALERT" })] })] }), _jsxs("div", { style: { backgroundColor: "#020617", padding: "12px", borderRadius: "8px", border: "1px solid #1e293b" }, children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }, children: [_jsx("div", { style: { fontSize: "0.75rem", fontWeight: "bold", color: "#94a3b8" }, children: "10. GeoJSON Polygon Exporter:" }), _jsx("button", { onClick: handleCopyGeoJson, style: { backgroundColor: copyGeoJsonFeedback ? "#10b981" : "#334155", color: "#fff", border: "none", borderRadius: "4px", padding: "3px 8px", fontSize: "0.7rem", cursor: "pointer", fontWeight: "bold" }, children: copyGeoJsonFeedback ? "✓ Copied!" : "📋 Copy GeoJSON" })] }), _jsx("code", { style: { fontSize: "0.7rem", color: "#34d399", wordBreak: "break-all" }, children: geoJsonPayload })] })] })), activeEngine === "ROUTING" && (_jsxs("div", { children: [_jsx("h3", { style: { margin: "0 0 12px 0", fontSize: "1.05rem", color: "#38bdf8" }, children: "\uD83D\uDEE3\uFE0F Engine 4: Routing Controls" }), _jsxs("div", { style: { marginBottom: "8px" }, children: [_jsx("label", { style: { fontSize: "0.75rem", color: "#94a3b8" }, children: "Origin:" }), _jsx("input", { type: "text", value: origin, onChange: (e) => setOrigin(e.target.value), style: { width: "100%", padding: "6px", backgroundColor: "#020617", color: "#fff", border: "1px solid #334155", borderRadius: "6px" } })] }), _jsxs("div", { style: { marginBottom: "12px" }, children: [_jsx("label", { style: { fontSize: "0.75rem", color: "#94a3b8" }, children: "Destination:" }), _jsx("input", { type: "text", value: destination, onChange: (e) => setDestination(e.target.value), style: { width: "100%", padding: "6px", backgroundColor: "#020617", color: "#fff", border: "1px solid #334155", borderRadius: "6px" } })] }), _jsxs("div", { style: { fontSize: "0.85rem" }, children: ["Distance: ", _jsxs("strong", { style: { color: "#38bdf8" }, children: [calculatedDistanceKm, " km"] })] }), _jsxs("div", { style: { fontSize: "0.85rem" }, children: ["ETA: ", _jsxs("strong", { style: { color: "#10b981" }, children: [calculatedEtaMins, " mins"] })] })] })), activeEngine === "OFFLINE_SYNC" && (_jsxs("div", { children: [_jsx("h3", { style: { margin: "0 0 12px 0", fontSize: "1.05rem", color: "#38bdf8" }, children: "\u26A1 Engine 5: Offline Sync Controls" }), _jsxs("button", { onClick: () => setNetworkStatus(networkStatus === "ONLINE" ? "OFFLINE" : "ONLINE"), style: { width: "100%", backgroundColor: networkStatus === "ONLINE" ? "#065f46" : "#7f1d1d", color: "#fff", border: "none", padding: "8px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", marginBottom: "8px" }, children: ["Network Mode: ", networkStatus] }), _jsx("button", { onClick: handleForceSync, style: { width: "100%", backgroundColor: "#0284c7", color: "#fff", border: "none", padding: "8px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", marginBottom: "12px" }, children: "Force Sync Queued Fixes" }), _jsxs("div", { style: { fontSize: "0.85rem", marginBottom: "4px" }, children: ["Queued: ", _jsxs("strong", { style: { color: offlineRecordCount > 0 ? "#f59e0b" : "#10b981" }, children: [offlineRecordCount, " records"] })] }), _jsxs("div", { style: { fontSize: "0.75rem", color: "#94a3b8" }, children: ["Header: ", _jsx("strong", { style: { color: "#38bdf8" }, children: lastSyncOpId })] })] }))] })), _jsxs("div", { style: { flex: 1, position: "relative", backgroundColor: "#020617", display: "flex", flexDirection: "column" }, children: [_jsx("div", { ref: mapElementRef, style: { width: "100%", height: "100%", flex: 1, position: "relative", backgroundColor: "#020617" } }), geofenceViewMode === "FULLSCREEN" && (_jsx("button", { onClick: () => setGeofenceViewMode("STANDARD"), style: { position: "absolute", top: "20px", right: "20px", zIndex: 20, backgroundColor: "#0284c7", color: "#fff", border: "none", borderRadius: "6px", padding: "8px 14px", fontWeight: "bold", fontSize: "0.8rem", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.5)" }, children: "\u2716 Exit Fullscreen View" })), showMapBadge && activeEngine === "TELEMETRY" && (_jsxs("div", { style: { position: "absolute", top: "20px", left: "20px", zIndex: 12, backgroundColor: "rgba(15, 23, 42, 0.92)", backdropFilter: "blur(8px)", padding: "10px 14px", borderRadius: "8px", border: "1px solid #38bdf8", fontSize: "0.78rem", color: "#f8fafc", boxShadow: "0 4px 12px rgba(0,0,0,0.5)" }, children: [_jsx("div", { style: { fontWeight: "bold", color: "#38bdf8", marginBottom: "4px" }, children: "\uD83D\uDE97 VEHICLE CALLOUT BADGE (MH-31-FA-1001)" }), _jsxs("div", { style: { fontSize: "0.75rem", color: "#94a3b8" }, children: ["Speed: ", _jsxs("strong", { style: { color: "#34d399" }, children: [speedKmh, " km/h"] }), " | Heading: ", _jsxs("strong", { style: { color: "#f1f5f9" }, children: [headingDeg, "\u00B0"] }), " | Status: ", _jsx("strong", { style: { color: "#10b981" }, children: "\uD83D\uDFE2 IGNITION ON" })] })] })), showZoneLabel && showLabelsLayer && activeEngine === "GEOFENCE" && (_jsxs("div", { style: { position: "absolute", top: "20px", left: "20px", zIndex: 12, backgroundColor: "rgba(15, 23, 42, 0.92)", backdropFilter: "blur(8px)", padding: "10px 14px", borderRadius: "8px", border: zoneStatus === "INSIDE" ? "1px solid #ef4444" : "1px solid #10b981", fontSize: "0.78rem", color: "#f8fafc", boxShadow: "0 4px 12px rgba(0,0,0,0.5)" }, children: [_jsxs("div", { style: { fontWeight: "bold", color: zoneStatus === "INSIDE" ? "#ef4444" : "#10b981", marginBottom: "4px" }, children: [currentCountryObj.flagEmoji, " ", currentCountryObj.countryName.toUpperCase(), " \u2014 ", selectedStateName.toUpperCase(), " \u2014 ", currentDistrictObj.name.toUpperCase()] }), _jsxs("div", { style: { fontSize: "0.75rem", color: "#94a3b8" }, children: ["Perspective Mode: ", _jsx("strong", { style: { color: "#38bdf8" }, children: geofenceViewMode }), " | Containment: ", _jsx("strong", { style: { color: zoneStatus === "INSIDE" ? "#ef4444" : "#10b981" }, children: zoneStatus }), " | Area: ", _jsxs("strong", { style: { color: "#34d399" }, children: [currentDistrictObj.areaSqKm.toLocaleString(), " sq km"] })] })] })), _jsxs("div", { style: { position: "absolute", bottom: "10px", left: "10px", right: "10px", zIndex: 10, display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgba(15, 23, 42, 0.9)", backdropFilter: "blur(8px)", padding: "8px 14px", borderRadius: "8px", border: "1px solid #334155", fontSize: "0.75rem", color: "#94a3b8" }, children: [_jsxs("div", { children: ["Country: ", _jsxs("strong", { style: { color: "#34d399" }, children: [currentCountryObj.flagEmoji, " ", currentCountryObj.countryName] })] }), _jsxs("div", { children: ["Target: ", _jsxs("strong", { style: { color: zoneStatus === "INSIDE" ? "#ef4444" : "#10b981" }, children: [currentDistrictObj.name, " (", zoneStatus, ")"] })] }), _jsxs("div", { children: ["View Mode: ", _jsxs("strong", { style: { color: "#38bdf8" }, children: [geofenceViewMode, " (MULTI-VIEW GEOFENCE ENGINE ACTIVE)"] })] })] })] })] })] }));
};
//# sourceMappingURL=EngineTesterScreen.js.map