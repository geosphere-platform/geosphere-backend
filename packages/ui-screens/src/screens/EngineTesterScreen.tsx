"use client";

import React, { useState, useEffect, useRef } from "react";

export interface EngineTesterScreenProps {
  initialEngine?: "MAPPING" | "TELEMETRY" | "GEOFENCE" | "ROUTING" | "OFFLINE_SYNC";
}

// SLEEK INDUSTRY-STANDARD TOP-DOWN VEHICLE NAVIGATION ICON (Circular Pod + Glowing Directional Arrow)
const VEHICLE_ICON_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48"><circle cx="24" cy="24" r="20" fill="%230f172a" stroke="%2338bdf8" stroke-width="3"/><path fill="%2338bdf8" stroke="%23ffffff" stroke-width="2" stroke-linejoin="round" d="M24 8L34 34L24 28L14 34Z"/></svg>`;

// ADAPTIVE CHAIKIN CORNER-SMOOTHING CURVE INTERPOLATOR FOR ORGANIC GIS BOUNDARY LINES
export const smoothPolygonCoords = (coords: Array<[number, number]>, iterations = 1): Array<[number, number]> => {
  if (!coords || coords.length < 3) return coords;
  let current = [...coords];

  // Ensure closed ring
  if (current[0][0] !== current[current.length - 1][0] || current[0][1] !== current[current.length - 1][1]) {
    current.push([...current[0]]);
  }

  for (let it = 0; it < iterations; it++) {
    const smoothed: Array<[number, number]> = [];
    const len = current.length - 1;

    for (let i = 0; i < len; i++) {
      const p0 = current[i];
      const p1 = current[i + 1];

      const q: [number, number] = [0.75 * p0[0] + 0.25 * p1[0], 0.75 * p0[1] + 0.25 * p1[1]];
      const r: [number, number] = [0.25 * p0[0] + 0.75 * p1[0], 0.25 * p0[1] + 0.75 * p1[1]];

      smoothed.push(q);
      smoothed.push(r);
    }
    smoothed.push([...smoothed[0]]);
    current = smoothed;
  }

  return current;
};

// HIGH-PRECISION REALISTIC ALL-INDIA & GLOBAL ADMINISTRATIVE BOUNDARIES DATASET TABLE
export interface DistrictGeofenceData {
  id: string;
  name: string;
  isEntireState?: boolean;
  center: [number, number]; // [lon, lat]
  zoom: number;
  areaSqKm: number;
  perimeterKm: number;
  polygonCoords: Array<[number, number]>;
}

export interface StateGeofenceData {
  stateName: string;
  stateCode: string;
  capitalName: string;
  colorHex: string;
  entireStateBoundary: DistrictGeofenceData;
  districts: DistrictGeofenceData[];
}

export interface CountryGeofenceData {
  countryName: string;
  countryCode: string; // IN, US, GB, AU, CA
  flagEmoji: string;
  capitalName: string;
  center: [number, number];
  zoom: number;
  states: StateGeofenceData[];
}

export const GLOBAL_COUNTRIES_DATASET: CountryGeofenceData[] = [
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

export const EngineTesterScreen: React.FC<EngineTesterScreenProps> = ({
  initialEngine = "MAPPING", // Default: Engine 1 (OpenLayers Core Mapping Engine)
}) => {
  const [activeEngine, setActiveEngine] = useState<"MAPPING" | "TELEMETRY" | "GEOFENCE" | "ROUTING" | "OFFLINE_SYNC">(initialEngine);

  // Engine 1: Master 10-Feature GIS Engine State
  const [mapStyleView, setMapStyleView] = useState<"STANDARD" | "SATELLITE" | "HYBRID" | "DARK_MIDNIGHT" | "GRAYSCALE" | "TERRAIN">("STANDARD");
  const [projection] = useState<string>("EPSG:3857 (Web Mercator)");
  const [vectorTilesActive, setVectorTilesActive] = useState<boolean>(true);
  const [layerOpacity, setLayerOpacity] = useState<number>(100);
  const [zoomLevel, setZoomLevel] = useState<number>(14);
  const [bboxExtent, setBboxExtent] = useState<string>("[79.0710, 21.1320, 79.1050, 21.1590]");
  const [showGuide, setShowGuide] = useState<boolean>(true);
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);

  // Engine 1 Features 7-10 State
  const [measuredDistanceKm] = useState<number>(4.82);
  const [measuredAreaSqKm] = useState<number>(1.25);
  const [searchCity, setSearchCity] = useState<string>("Nagpur");
  const [layerZIndex, setLayerZIndex] = useState<{ basemap: number; vector: number }>({ basemap: 0, vector: 1 });

  // Engine 2: Master 10-Feature Telematics Engine State
  const [showEngine2Guide, setShowEngine2Guide] = useState<boolean>(true);
  const [isSimulatingGps, setIsSimulatingGps] = useState<boolean>(false);
  const [speedKmh, setSpeedKmh] = useState<number>(55);
  const [latitude, setLatitude] = useState<number>(21.1458);
  const [longitude, setLongitude] = useState<number>(79.0882);
  const [headingDeg, setHeadingDeg] = useState<number>(45);
  const [batteryPct, setBatteryPct] = useState<number>(88);
  const [fuelPct] = useState<number>(76);
  const [odometerKm, setOdometerKm] = useState<number>(14820);
  const [ignitionState] = useState<boolean>(true);
  const [satellitesCount] = useState<number>(9);
  const [hdopValue] = useState<number>(0.8);
  const [activeAnomaly, setActiveAnomaly] = useState<string | null>(null);
  const [telemetryLogs, setTelemetryLogs] = useState<string[]>([]);
  const [copyPayloadFeedback, setCopyPayloadFeedback] = useState<boolean>(false);
  const [followCamera, setFollowCamera] = useState<boolean>(true);
  const [showMapBadge, setShowMapBadge] = useState<boolean>(true);
  const breadcrumbCoordsRef = useRef<any[]>([]);

  // Engine 3: Master 10-Feature Geofence Engine State & Alternative View Perspectives
  const [showEngine3Guide, setShowEngine3Guide] = useState<boolean>(true);
  const [geofenceType, setGeofenceType] = useState<"POLYGON" | "CIRCULAR" | "CORRIDOR">("POLYGON");
  const [zoneStatus, setZoneStatus] = useState<"OUTSIDE" | "INSIDE">("OUTSIDE");
  const [breachCount, setBreachCount] = useState<number>(0);
  const [breachLogs, setBreachLogs] = useState<string[]>([]);
  const [activeActionTrigger, setActiveActionTrigger] = useState<string | null>(null);
  const [copySqlQueryFeedback, setCopySqlQueryFeedback] = useState<boolean>(false);
  const [copyGeoJsonFeedback, setCopyGeoJsonFeedback] = useState<boolean>(false);
  const [dwellTimeMins, setDwellTimeMins] = useState<number>(14);
  const [zoneSpeedLimitKmh] = useState<number>(30);
  const [showZoneLabel, setShowZoneLabel] = useState<boolean>(true);
  const [boundaryStyle, setBoundaryStyle] = useState<"DASHED" | "SOLID" | "GLOWING">("DASHED");
  const [scheduleActive, setScheduleActive] = useState<boolean>(true);

  // ALTERNATIVE GEOFENCE INSPECTION VIEW PERSPECTIVES
  const [geofenceViewMode, setGeofenceViewMode] = useState<"STANDARD" | "AUTO_FIT" | "SATELLITE_FOCUS" | "FULLSCREEN">("STANDARD");

  // Map Layer Display Checkboxes
  const [showStatesLayer, setShowStatesLayer] = useState<boolean>(true);
  const [showDistrictsLayer, setShowDistrictsLayer] = useState<boolean>(true);
  const [showCapitalsLayer, setShowCapitalsLayer] = useState<boolean>(true);
  const [showLabelsLayer, setShowLabelsLayer] = useState<boolean>(true);
  const [searchFilter, setSearchFilter] = useState<string>("");

  // MULTI-COUNTRY & STATE DROPDOWN SELECTION STATE
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>("IN");
  const [selectedStateName, setSelectedStateName] = useState<string>("Maharashtra");
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>("mh_entire_state");

  const currentCountryObj = GLOBAL_COUNTRIES_DATASET.find((c) => c.countryCode === selectedCountryCode) || GLOBAL_COUNTRIES_DATASET[0];
  const currentStateObj = currentCountryObj.states.find((s) => s.stateName === selectedStateName) || currentCountryObj.states[0];
  
  // Selectable boundary options for active state (Entire State Boundary FIRST, followed by districts)
  const availableBoundaryOptions: DistrictGeofenceData[] = [
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
  const [origin, setOrigin] = useState<string>("Civil Lines Depot (79.080, 21.140)");
  const [destination, setDestination] = useState<string>("Substation B4 (79.095, 21.155)");
  const [calculatedDistanceKm] = useState<number>(4.82);
  const [calculatedEtaMins] = useState<number>(12);

  // Engine 5: Offline & Sync Engine State
  const [networkStatus, setNetworkStatus] = useState<"ONLINE" | "OFFLINE">("ONLINE");
  const [offlineRecordCount, setOfflineRecordCount] = useState<number>(0);
  const [lastSyncOpId, setLastSyncOpId] = useState<string>("op_sync_10019283");

  // OpenLayers Map Element Ref & Instances
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const vectorLayerRef = useRef<any>(null);
  const vehicleFeatureRef = useRef<any>(null);
  const allStateFeaturesMapRef = useRef<Map<string, { feature: any; colorHex: string; isDistrict: boolean }>>(new Map());
  const breadcrumbFeatureRef = useRef<any>(null);
  const olModulesRef = useRef<any>(null);

  // Initialize Real OpenLayers Map Engine dynamically on Client-Side DOM mount
  useEffect(() => {
    if (!mapElementRef.current || mapInstanceRef.current || typeof window === "undefined") return;
    let isMounted = true;

    Promise.all([
      import("ol/Map.js"), import("ol/View.js"), import("ol/layer/Tile.js"), import("ol/layer/Vector.js"),
      import("ol/source/OSM.js"), import("ol/source/XYZ.js"), import("ol/source/Vector.js"), import("ol/Feature.js"),
      import("ol/geom/Point.js"), import("ol/geom/LineString.js"), import("ol/geom/Polygon.js"), import("ol/geom/Circle.js"), import("ol/proj.js"),
      import("ol/style.js"), import("ol/control/ScaleLine.js")
    ]).then(([
      { default: Map }, { default: View }, { default: TileLayer }, { default: VectorLayer },
      { default: OSM }, { default: XYZ }, { default: VectorSource }, { default: Feature },
      { default: Point }, { default: LineString }, { default: Polygon }, { default: CircleGeom }, { fromLonLat, toLonLat },
      { Style, Stroke, Fill, Icon }, { default: ScaleLine }
    ]) => {
      if (!isMounted || !mapElementRef.current) return;
      olModulesRef.current = { OSM, XYZ, Style, Stroke, Fill, Icon, LineString, Polygon, CircleGeom, fromLonLat, toLonLat, View };

      // 1. Initial Tile Source (OpenStreetMap Standard)
      const initialTileLayer = new TileLayer({ source: new OSM(), opacity: layerOpacity / 100, zIndex: layerZIndex.basemap });
      tileLayerRef.current = initialTileLayer;

      // 2. OpenLayers Vector Layer for Global Boundary Features
      const vectorSource = new VectorSource();
      const routeFeature = new Feature({ geometry: new LineString([fromLonLat([79.080, 21.140]), fromLonLat([79.085, 21.145]), fromLonLat([79.090, 21.150]), fromLonLat([79.095, 21.155])]) });
      routeFeature.setStyle(new Style({ stroke: new Stroke({ color: "#0284c7", width: 3 }) }));

      // Instantiate Features for ALL Countries, States, and Districts WITH CRISP THIN LINE STYLING
      const featureList: any[] = [routeFeature];
      allStateFeaturesMapRef.current.clear();

      GLOBAL_COUNTRIES_DATASET.forEach((cntry) => {
        cntry.states.forEach((st) => {
          // 1. Transform WGS84 lon/lat degrees into Web Mercator projected meters FIRST
          const mercatorStateCoords = st.entireStateBoundary.polygonCoords.map((c) => fromLonLat(c) as [number, number]);
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
            const mercatorDistrictCoords = dst.polygonCoords.map((c) => fromLonLat(c) as [number, number]);
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
          if (center) { setLongitude(+center[0].toFixed(4)); setLatitude(+center[1].toFixed(4)); }
        }
        const currentZoom = view.getZoom();
        if (currentZoom) setZoomLevel(Math.round(currentZoom));
      });

      mapInstanceRef.current = olMap;
    });

    return () => { isMounted = false; if (mapInstanceRef.current) { mapInstanceRef.current.setTarget(undefined); mapInstanceRef.current = null; } };
  }, []);

  // Handle 6 Map Style Views & Satellite Inspection Focus Mode
  useEffect(() => {
    if (!tileLayerRef.current || !olModulesRef.current) return;
    const { OSM, XYZ } = olModulesRef.current;
    const styleUrls: Record<string, string> = {
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
    if (!vehicleFeatureRef.current || !olModulesRef.current) return;
    const { fromLonLat, Style, Icon } = olModulesRef.current;
    const pointCoords = fromLonLat([longitude, latitude]);
    
    vehicleFeatureRef.current.getGeometry()?.setCoordinates(pointCoords);
    vehicleFeatureRef.current.setStyle(new Style({ image: new Icon({ src: VEHICLE_ICON_SVG, scale: 0.8, rotation: (headingDeg * Math.PI) / 180, rotateWithView: true }) }));

    if (followCamera && mapInstanceRef.current && isSimulatingGps) {
      mapInstanceRef.current.getView().animate({ center: pointCoords, duration: 400 });
    }
    if (isSimulatingGps && breadcrumbFeatureRef.current) {
      breadcrumbCoordsRef.current.push(pointCoords);
      if (breadcrumbCoordsRef.current.length > 50) breadcrumbCoordsRef.current.shift();
      breadcrumbFeatureRef.current.getGeometry().setCoordinates(breadcrumbCoordsRef.current);
    }
  }, [latitude, longitude, headingDeg, isSimulatingGps, followCamera]);

  // Engine 3: SINGLE DROPDOWN SELECTION HIGHLIGHT ENGINE & AUTO-FIT BBOX CAMERA FOCUS
  useEffect(() => {
    if (!olModulesRef.current || !mapInstanceRef.current || allStateFeaturesMapRef.current.size === 0) return;
    const { Style, Stroke, Fill, fromLonLat } = olModulesRef.current;
    const isInside = zoneStatus === "INSIDE";

    const strokeDash = boundaryStyle === "DASHED" ? [6, 4] : boundaryStyle === "GLOWING" ? [2, 2] : undefined;

    const hexToRgba = (hex: string, alpha: number) => {
      const r = parseInt(hex.slice(1, 3), 16) || 14;
      const g = parseInt(hex.slice(3, 5), 16) || 165;
      const b = parseInt(hex.slice(5, 7), 16) || 233;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    let targetSelectedFeature: any = null;

    allStateFeaturesMapRef.current.forEach((obj, id) => {
      const { feature, colorHex } = obj;

      if (id === selectedDistrictId) {
        targetSelectedFeature = feature;
        // ACTIVE SELECTED TARGET: Crisp 2.5px solid boundary stroke with high-contrast highlight
        feature.setStyle(new Style({
          fill: new Fill({ color: isInside ? "rgba(239, 68, 68, 0.40)" : hexToRgba(colorHex, 0.25) }),
          stroke: new Stroke({ color: isInside ? "#ef4444" : "#ffffff", width: 2.5, lineDash: strokeDash })
        }));
      } else {
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
    } else {
      mapInstanceRef.current.getView().animate({
        center: fromLonLat(currentDistrictObj.center),
        zoom: currentDistrictObj.zoom,
        duration: 800
      });
    }
  }, [selectedCountryCode, selectedStateName, selectedDistrictId, zoneStatus, geofenceType, boundaryStyle, geofenceViewMode, showStatesLayer, showDistrictsLayer]);

  // Engine 2 & Engine 3 Dwell Time Timer Loop
  useEffect(() => {
    let dwellInterval: any = null;
    if (zoneStatus === "INSIDE") {
      dwellInterval = setInterval(() => { setDwellTimeMins((m) => m + 1); }, 3000);
    }
    return () => clearInterval(dwellInterval);
  }, [zoneStatus]);

  // Engine 2 Telemetry Simulation Timer Loop
  useEffect(() => {
    if (!isSimulatingGps) return;
    const interval = setInterval(() => {
      setLatitude((prev) => +(prev + 0.0003 * Math.cos((headingDeg * Math.PI) / 180)).toFixed(6));
      setLongitude((prev) => +(prev + 0.0003 * Math.sin((headingDeg * Math.PI) / 180)).toFixed(6));
      setHeadingDeg((prev) => (prev + 4) % 360);
      setBatteryPct((prev) => Math.max(10, prev - 1));
      setOdometerKm((prev) => +(prev + 0.02).toFixed(2));

      if (networkStatus === "OFFLINE") setOfflineRecordCount((prev) => prev + 1);
      if (latitude > 21.1455 && longitude > 79.0880 && latitude < 21.1485 && longitude < 79.0915 && zoneStatus === "OUTSIDE") {
        setZoneStatus("INSIDE"); setBreachCount((c) => c + 1);
        setBreachLogs((prev) => [`[${new Date().toLocaleTimeString()}] 🔴 BREACH: Asset entered ${currentDistrictObj.name} geofence!`, ...prev.slice(0, 5)]);
      }

      setTelemetryLogs((prev) => [JSON.stringify({ time: new Date().toLocaleTimeString(), lat: latitude, lon: longitude, speed: speedKmh, heading: headingDeg, battery: batteryPct, ignition: ignitionState, satellites: satellitesCount, hdop: hdopValue }), ...prev.slice(0, 5)]);
    }, 1200);
    return () => clearInterval(interval);
  }, [isSimulatingGps, latitude, longitude, headingDeg, speedKmh, batteryPct, ignitionState, satellitesCount, hdopValue, networkStatus, zoneStatus, geofenceType, currentDistrictObj]);

  // Camera Helper Functions
  const animateCamera = (centerLonLat: [number, number], zoom: number) => mapInstanceRef.current && olModulesRef.current && mapInstanceRef.current.getView().animate({ center: olModulesRef.current.fromLonLat(centerLonLat), zoom, duration: 800 });
  const handleZoomToSubstation = () => animateCamera([79.0882, 21.1458], 15);
  const handleJumpCityCenter = () => animateCamera([79.0800, 21.1500], 13);
  const handleResetNorth = () => mapInstanceRef.current?.getView().animate({ rotation: 0, duration: 500 });

  // Copy Handlers
  const handleCopyCoords = () => { navigator.clipboard.writeText(`Lat: ${latitude}, Lon: ${longitude}`); setCopyFeedback(true); setTimeout(() => setCopyFeedback(false), 2000); };
  const handleCopyFixPayload = () => { if (telemetryLogs.length > 0) { navigator.clipboard.writeText(telemetryLogs[0]); setCopyPayloadFeedback(true); setTimeout(() => setCopyPayloadFeedback(false), 2000); } };
  const handleCopySqlQuery = () => { navigator.clipboard.writeText(postGisQuery); setCopySqlQueryFeedback(true); setTimeout(() => setCopySqlQueryFeedback(false), 2000); };
  const handleCopyGeoJson = () => { navigator.clipboard.writeText(geoJsonPayload); setCopyGeoJsonFeedback(true); setTimeout(() => setCopyGeoJsonFeedback(false), 2000); };

  // Geocoding Jump Handler
  const handleJumpToCity = (cityName: string) => {
    setSearchCity(cityName);
    const cityCoordsMap: Record<string, [number, number]> = { Nagpur: [79.0882, 21.1458], Mumbai: [72.8777, 19.0760], Delhi: [77.1025, 28.7041], London: [-0.1276, 51.5074], NewYork: [-74.0060, 40.7128] };
    animateCamera(cityCoordsMap[cityName] || [79.0882, 21.1458], 12);
  };

  // MULTI-COUNTRY & STATE DROPDOWN SELECTION HANDLERS
  const handleSelectCountry = (countryCode: string) => {
    setSelectedCountryCode(countryCode);
    const foundCountry = GLOBAL_COUNTRIES_DATASET.find((c) => c.countryCode === countryCode);
    if (foundCountry && foundCountry.states.length > 0) {
      const firstState = foundCountry.states[0];
      setSelectedStateName(firstState.stateName);
      setSelectedDistrictId(firstState.entireStateBoundary.id);
    }
  };

  const handleSelectState = (stateName: string) => {
    setSelectedStateName(stateName);
    const foundState = currentCountryObj.states.find((s) => s.stateName === stateName);
    if (foundState) {
      setSelectedDistrictId(foundState.entireStateBoundary.id);
    }
  };

  const handleSelectDistrict = (districtId: string) => {
    setSelectedDistrictId(districtId);
  };

  // Map Snapshot PNG Export Handler
  const handleExportMapSnapshot = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.once("rendercomplete", () => {
      const mapCanvas = document.createElement("canvas");
      const size = mapInstanceRef.current.getSize();
      mapCanvas.width = size[0]; mapCanvas.height = size[1];
      const mapContext = mapCanvas.getContext("2d");
      Array.prototype.forEach.call(mapElementRef.current?.querySelectorAll(".ol-layer canvas") || [], (canvas: HTMLCanvasElement) => {
        if (canvas.width > 0 && mapContext) {
          const opacity = (canvas.parentNode as HTMLElement).style.opacity;
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

  const handleTriggerAnomaly = (type: string) => { setActiveAnomaly(type); if (type === "SPEEDING") setSpeedKmh(105); else if (type === "HARSH_BRAKE") setSpeedKmh(5); setTimeout(() => setActiveAnomaly(null), 3000); };
  
  // Engine 3: Toggle Zone Breach Handler
  const handleSimulateGeofence = () => {
    const nextStatus = zoneStatus === "OUTSIDE" ? "INSIDE" : "OUTSIDE";
    setZoneStatus(nextStatus);
    if (nextStatus === "INSIDE") {
      setBreachCount((c) => c + 1);
      setBreachLogs((prev) => [`[${new Date().toLocaleTimeString()}] 🔴 BREACH: Asset entered ${currentDistrictObj.name} geofence!`, ...prev.slice(0, 5)]);
    } else {
      setBreachLogs((prev) => [`[${new Date().toLocaleTimeString()}] 🟢 CLEAR: Asset exited ${currentDistrictObj.name} geofence.`, ...prev.slice(0, 5)]);
    }
  };

  // Engine 3: Trigger Action Handler
  const handleTriggerGeofenceAction = (actionType: string) => {
    setActiveActionTrigger(actionType);
    setTimeout(() => setActiveActionTrigger(null), 2500);
  };

  const handleForceSync = () => { setOfflineRecordCount(0); setLastSyncOpId(`op_sync_${Date.now()}`); };

  // Filtered dataset for left search
  const filteredCountryStates = currentCountryObj.states.filter((s) => s.stateName.toLowerCase().includes(searchFilter.toLowerCase()) || s.districts.some((d) => d.name.toLowerCase().includes(searchFilter.toLowerCase())));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", backgroundColor: "#020617", color: "#f8fafc", fontFamily: "sans-serif" }}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/ol@10.4.0/ol.css" />

      {/* TOP TITLE HEADER BAR */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#0f172a", padding: "10px 20px", borderBottom: "1px solid #1e293b" }}>
        <div style={{ fontSize: "1.05rem", fontWeight: "bold", color: "#38bdf8", letterSpacing: "0.5px" }}>
          🌍 GEOSPHERE: GLOBAL BOUNDARIES & MULTI-VIEW GEOFENCE ENGINE
        </div>
        
        {/* TOP ENGINE SELECTION TABS */}
        <div style={{ display: "flex", gap: "6px" }}>
          {(["MAPPING", "TELEMETRY", "GEOFENCE", "ROUTING", "OFFLINE_SYNC"] as const).map((eng, idx) => (
            <button key={eng} onClick={() => setActiveEngine(eng)} style={{ backgroundColor: activeEngine === eng ? "#0284c7" : "#1e293b", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 12px", cursor: "pointer", fontWeight: "bold", fontSize: "0.78rem" }}>
              {idx === 0 ? "🗺️ 1. Mapping" : idx === 1 ? "🚗 2. Telemetry" : idx === 2 ? "🛡️ 3. Geofence" : idx === 3 ? "🛣️ 4. Routing" : "⚡ 5. Sync"}
            </button>
          ))}
        </div>
      </div>

      {/* CLEAN SIDE-BY-SIDE SPLIT CONTAINER */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        
        {/* FIXED LEFT ENGINE CONTROL SIDEBAR PANEL (Hides when in Fullscreen View Mode) */}
        {geofenceViewMode !== "FULLSCREEN" && (
          <div style={{ width: "380px", backgroundColor: "#0f172a", borderRight: "1px solid #1e293b", padding: "16px", overflowY: "auto" }}>
            
            {/* ENGINE 1: MASTER 10-FEATURE OPENLAYERS GIS SUITE */}
            {activeEngine === "MAPPING" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: 0, fontSize: "1.05rem", color: "#38bdf8" }}>🗺️ Engine 1: Master 10-Feature GIS Suite</h3>
                  <button onClick={() => setShowGuide(!showGuide)} style={{ backgroundColor: "#0284c7", color: "#fff", border: "none", borderRadius: "4px", padding: "4px 8px", fontSize: "0.75rem", cursor: "pointer", fontWeight: "bold" }}>
                    {showGuide ? "Hide Guide" : "📖 User Guide"}
                  </button>
                </div>

                {showGuide && (
                  <div style={{ backgroundColor: "#0284c7", color: "#ffffff", padding: "12px", borderRadius: "8px", border: "1px solid #38bdf8", fontSize: "0.78rem", lineHeight: "1.4" }}>
                    <div style={{ fontWeight: "bold", fontSize: "0.82rem", marginBottom: "6px" }}>📖 10-FEATURE MASTER GIS QA TESTING PROTOCOL:</div>
                    <ol style={{ margin: 0, paddingLeft: "16px" }}>
                      <li><strong>Map Styles</strong>: Switch between 6 Map Style radios.</li>
                      <li><strong>Spatial CRS</strong>: Verify `EPSG:3857` & `EPSG:4326` badges.</li>
                      <li><strong>Tile Opacity</strong>: Drag Opacity slider (0%-100%).</li>
                      <li><strong>Vector Feed</strong>: Toggle Vector Layer Feed (`ENABLED`/`DISABLED`).</li>
                      <li><strong>Camera Presets</strong>: Click "Zoom Substation", "Jump City Center", or "Reset North".</li>
                      <li><strong>BBOX & Coords Inspector</strong>: Click "Copy Coords" to export active Lat/Lon.</li>
                      <li><strong>Distance & Area Tool</strong>: Inspect live geodesic calculations (`4.82 km`, `1.25 sq km`).</li>
                      <li><strong>Location Search</strong>: Click city presets (Nagpur, Mumbai, Delhi, London, NY).</li>
                      <li><strong>PNG Export</strong>: Click "Export PNG Snapshot" to download map screenshot.</li>
                      <li><strong>Z-Index Manager</strong>: Toggle Z-Index stacking rendering order.</li>
                    </ol>
                  </div>
                )}

                {/* FEATURE 1: MAP STYLE VIEWS SELECTOR */}
                <div style={{ backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "8px" }}>1. Type of Map Style View (6 Industry Modes):</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {[
                      { id: "STANDARD", label: "🗺️ Standard Vector Road View" }, { id: "SATELLITE", label: "🛰️ Satellite Imagery Mode" },
                      { id: "HYBRID", label: "🏷️ Satellite Hybrid View" }, { id: "DARK_MIDNIGHT", label: "🌙 Dark Midnight Canvas" },
                      { id: "GRAYSCALE", label: "⚪ Monochromatic Grayscale" }, { id: "TERRAIN", label: "⛰️ Topographic Terrain View" },
                    ].map((s) => (
                      <label key={s.id} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", color: "#f1f5f9", cursor: "pointer" }}>
                        <input type="radio" name="mapStyleView" value={s.id} checked={mapStyleView === s.id} onChange={() => setMapStyleView(s.id as any)} style={{ accentColor: "#0284c7", cursor: "pointer" }} />
                        {s.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* FEATURE 2: SPATIAL PROJECTION & CRS */}
                <div style={{ backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "6px" }}>2. Spatial Projection & CRS Engine:</div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "2px" }}>Active Projection: <strong style={{ color: "#34d399" }}>{projection}</strong></div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "2px" }}>Primary Data Space: <strong style={{ color: "#f1f5f9" }}>EPSG:4326 (WGS84 Geodetic)</strong></div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Camera Zoom Level: <strong style={{ color: "#f8fafc" }}>{zoomLevel}</strong> (Range 1-20)</div>
                </div>

                {/* FEATURE 3: TILE LAYER OPACITY */}
                <div style={{ backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "6px" }}>
                    <span>3. Tile Layer Opacity Engine:</span><span style={{ color: "#34d399" }}>{layerOpacity}%</span>
                  </div>
                  <input type="range" min="0" max="100" value={layerOpacity} onChange={(e) => setLayerOpacity(+e.target.value)} style={{ width: "100%", cursor: "pointer", accentColor: "#0284c7" }} />
                </div>

                {/* FEATURE 4: VECTOR TILES FEED CONTROL */}
                <div style={{ backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "6px" }}>4. OpenLayers Vector Layer Feed Control:</div>
                  <button onClick={() => setVectorTilesActive(!vectorTilesActive)} style={{ width: "100%", padding: "8px", backgroundColor: vectorTilesActive ? "#065f46" : "#475569", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "0.75rem" }}>
                    {vectorTilesActive ? "OpenLayers Vector Layer Feed ENABLED" : "Vector Layer Feed DISABLED"}
                  </button>
                </div>

                {/* FEATURE 5: CAMERA NAVIGATION PRESETS */}
                <div style={{ backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "6px" }}>5. OpenLayers Camera View Presets:</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button onClick={handleZoomToSubstation} style={{ flex: 1, backgroundColor: "#0284c7", color: "#fff", border: "none", borderRadius: "6px", padding: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "0.75rem" }}>🔍 Zoom Substation</button>
                      <button onClick={handleJumpCityCenter} style={{ flex: 1, backgroundColor: "#0284c7", color: "#fff", border: "none", borderRadius: "6px", padding: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "0.75rem" }}>📍 Jump City Center</button>
                    </div>
                    <button onClick={handleResetNorth} style={{ width: "100%", backgroundColor: "#334155", color: "#fff", border: "none", borderRadius: "6px", padding: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "0.75rem" }}>🧭 Reset North Heading (0°)</button>
                  </div>
                </div>

                {/* FEATURE 6: BBOX & CENTER INSPECTOR */}
                <div style={{ backgroundColor: "#020617", padding: "12px", borderRadius: "8px", border: "1px solid #1e293b" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: "bold", color: "#94a3b8" }}>6. Viewport BBOX & Center Inspector:</div>
                    <button onClick={handleCopyCoords} style={{ backgroundColor: copyFeedback ? "#10b981" : "#334155", color: "#fff", border: "none", borderRadius: "4px", padding: "3px 8px", fontSize: "0.7rem", cursor: "pointer", fontWeight: "bold" }}>
                      {copyFeedback ? "✓ Copied!" : "📋 Copy Coords"}
                    </button>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#38bdf8", marginBottom: "4px" }}>Center: Lat {latitude.toFixed(4)}, Lon {longitude.toFixed(4)}</div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "2px" }}>BBOX Bounds:</div>
                  <code style={{ fontSize: "0.72rem", color: "#34d399", wordBreak: "break-all" }}>{bboxExtent}</code>
                </div>

                {/* FEATURE 7: GEODESIC MEASUREMENT */}
                <div style={{ backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "6px" }}>7. Geodesic Measurement Engine:</div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "4px" }}>
                    <span style={{ color: "#94a3b8" }}>Line Distance:</span><strong style={{ color: "#34d399" }}>{measuredDistanceKm} km ({Math.round(measuredDistanceKm * 1000)} m)</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                    <span style={{ color: "#94a3b8" }}>Polygon Area:</span><strong style={{ color: "#38bdf8" }}>{measuredAreaSqKm} sq km</strong>
                  </div>
                </div>

                {/* FEATURE 8: GEOCODING LOCATION SEARCH */}
                <div style={{ backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "6px" }}>8. Geocoding Location Search:</div>
                  <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    {["Nagpur", "Mumbai", "Delhi", "London", "NewYork"].map((city) => (
                      <button key={city} onClick={() => handleJumpToCity(city)} style={{ backgroundColor: searchCity === city ? "#0284c7" : "#020617", color: "#fff", border: "1px solid #334155", borderRadius: "4px", padding: "4px 8px", fontSize: "0.72rem", cursor: "pointer", fontWeight: "bold" }}>
                        📍 {city}
                      </button>
                    ))}
                  </div>
                </div>

                {/* FEATURE 9: MAP SNAPSHOT PNG EXPORT */}
                <div style={{ backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "6px" }}>9. Map Snapshot & PNG Export:</div>
                  <button onClick={handleExportMapSnapshot} style={{ width: "100%", padding: "8px", backgroundColor: "#0284c7", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "0.75rem" }}>
                    🖼️ Download Map Canvas Screenshot (.png)
                  </button>
                </div>

                {/* FEATURE 10: LAYER Z-INDEX MANAGER */}
                <div style={{ backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "6px" }}>10. Layer Z-Index Stacking Manager:</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", marginBottom: "4px" }}>
                    <span style={{ color: "#94a3b8" }}>Basemap Layer:</span>
                    <button onClick={() => setLayerZIndex((z) => ({ ...z, basemap: z.basemap === 0 ? 3 : 0 }))} style={{ backgroundColor: "#020617", color: "#38bdf8", border: "1px solid #334155", borderRadius: "4px", padding: "2px 6px", fontSize: "0.7rem", cursor: "pointer" }}>Z-Index: {layerZIndex.basemap}</button>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem" }}>
                    <span style={{ color: "#94a3b8" }}>Vector Features:</span>
                    <button onClick={() => setLayerZIndex((z) => ({ ...z, vector: z.vector === 1 ? 4 : 1 }))} style={{ backgroundColor: "#020617", color: "#34d399", border: "1px solid #334155", borderRadius: "4px", padding: "2px 6px", fontSize: "0.7rem", cursor: "pointer" }}>Z-Index: {layerZIndex.vector}</button>
                  </div>
                </div>
              </div>
            )}

            {/* ENGINE 2: MASTER 10-FEATURE TELEMATICS ENGINE PANEL */}
            {activeEngine === "TELEMETRY" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: 0, fontSize: "1.05rem", color: "#38bdf8" }}>🚗 Engine 2: Master 10-Feature Telematics Suite</h3>
                  <button onClick={() => setShowEngine2Guide(!showEngine2Guide)} style={{ backgroundColor: "#0284c7", color: "#fff", border: "none", borderRadius: "4px", padding: "4px 8px", fontSize: "0.75rem", cursor: "pointer", fontWeight: "bold" }}>
                    {showEngine2Guide ? "Hide Guide" : "📖 User Guide"}
                  </button>
                </div>

                {showEngine2Guide && (
                  <div style={{ backgroundColor: "#0284c7", color: "#ffffff", padding: "12px", borderRadius: "8px", border: "1px solid #38bdf8", fontSize: "0.78rem", lineHeight: "1.4" }}>
                    <div style={{ fontWeight: "bold", fontSize: "0.82rem", marginBottom: "6px" }}>📖 10-FEATURE TELEMETRY QA TESTING PROTOCOL:</div>
                    <ol style={{ margin: 0, paddingLeft: "16px" }}>
                      <li>Click <strong>"Start Live GPS Motion"</strong> to animate vehicle navigation icon.</li>
                      <li>Drag the <strong>Speed slider</strong> (0-120 km/h) to adjust telemetry update speed.</li>
                      <li>Toggle <strong>"Follow Camera Auto-Center"</strong> to lock/unlock camera auto-pan.</li>
                      <li>Toggle <strong>"Live Map Label Badge"</strong> overlay above the vehicle marker.</li>
                      <li>Inspect the <strong>Sensors HUD</strong> (Ignition, Battery %, Fuel %, Odometer).</li>
                      <li>Inspect <strong>GPS Precision</strong> (Satellites & HDOP 0.8 rating).</li>
                      <li>Click <strong>"Speeding Alert"</strong>, <strong>"Harsh Brake"</strong>, or <strong>"Panic SOS Alarm"</strong>.</li>
                      <li>Inspect live streaming JSON telemetry payloads in the fix log.</li>
                      <li>Click <strong>"📋 Copy Fix Payload"</strong> for 1-click clipboard export.</li>
                      <li>Observe green <strong>motion breadcrumbs</strong> (`ol/geom/LineString`) on map.</li>
                    </ol>
                  </div>
                )}

                {/* FEATURE 1: LIVE GPS MOTION */}
                <div style={{ backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "8px" }}>1. Live GPS Motion & Bearing Engine:</div>
                  <button onClick={() => setIsSimulatingGps(!isSimulatingGps)} style={{ width: "100%", backgroundColor: isSimulatingGps ? "#ef4444" : "#10b981", color: "#fff", border: "none", padding: "10px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", marginBottom: "8px", fontSize: "0.85rem" }}>
                    {isSimulatingGps ? "⏸️ Pause GPS Motion" : "▶️ Start Live GPS Motion"}
                  </button>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Heading Angle: <strong style={{ color: "#34d399" }}>{headingDeg}° (360° Dynamic Icon Rotation)</strong></div>
                </div>

                {/* FEATURE 2: DYNAMIC SPEED CONTROL */}
                <div style={{ backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "6px" }}>
                    <span>2. Dynamic Speed Control:</span><span style={{ color: "#34d399" }}>{speedKmh} km/h</span>
                  </div>
                  <input type="range" min="0" max="120" value={speedKmh} onChange={(e) => setSpeedKmh(+e.target.value)} style={{ width: "100%", cursor: "pointer", accentColor: "#0284c7" }} />
                </div>

                {/* FEATURE 3: FOLLOW CAMERA TOGGLE */}
                <div style={{ backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "6px" }}>3. Follow Camera Auto-Center Mode:</div>
                  <button onClick={() => setFollowCamera(!followCamera)} style={{ width: "100%", padding: "8px", backgroundColor: followCamera ? "#065f46" : "#475569", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "0.75rem" }}>
                    {followCamera ? "🎥 Follow Camera Auto-Center ENABLED" : "Camera Auto-Center DISABLED"}
                  </button>
                </div>

                {/* FEATURE 4: MAP LABEL OVERLAY TOGGLE */}
                <div style={{ backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "6px" }}>4. Live Vehicle Map Label Badge Overlay:</div>
                  <button onClick={() => setShowMapBadge(!showMapBadge)} style={{ width: "100%", padding: "8px", backgroundColor: showMapBadge ? "#0284c7" : "#475569", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "0.75rem" }}>
                    {showMapBadge ? "🏷️ Map Label Badge Overlay ENABLED" : "Map Badge Overlay DISABLED"}
                  </button>
                </div>

                {/* FEATURE 5: SENSORS HUD */}
                <div style={{ backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "8px" }}>5. Vehicle Telemetry Sensors HUD:</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "0.75rem" }}>
                    <div style={{ backgroundColor: "#020617", padding: "6px 8px", borderRadius: "4px" }}><span style={{ color: "#94a3b8" }}>Ignition:</span> <strong style={{ color: ignitionState ? "#10b981" : "#ef4444" }}>{ignitionState ? "🟢 ON" : "🔴 OFF"}</strong></div>
                    <div style={{ backgroundColor: "#020617", padding: "6px 8px", borderRadius: "4px" }}><span style={{ color: "#94a3b8" }}>Battery:</span> <strong style={{ color: "#38bdf8" }}>{batteryPct}%</strong></div>
                    <div style={{ backgroundColor: "#020617", padding: "6px 8px", borderRadius: "4px" }}><span style={{ color: "#94a3b8" }}>Fuel Level:</span> <strong style={{ color: "#f59e0b" }}>{fuelPct}%</strong></div>
                    <div style={{ backgroundColor: "#020617", padding: "6px 8px", borderRadius: "4px" }}><span style={{ color: "#94a3b8" }}>Odometer:</span> <strong style={{ color: "#34d399" }}>{odometerKm} km</strong></div>
                  </div>
                </div>

                {/* FEATURE 6: GPS PRECISION & HDOP */}
                <div style={{ backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "6px" }}>6. GPS Precision & DOP Engine:</div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                    <span style={{ color: "#94a3b8" }}>Satellites: <strong style={{ color: "#34d399" }}>{satellitesCount} Connected</strong></span>
                    <span style={{ color: "#94a3b8" }}>HDOP Precision: <strong style={{ color: "#38bdf8" }}>{hdopValue} (EXCELLENT)</strong></span>
                  </div>
                </div>

                {/* FEATURE 7: ANOMALY EVENT SIMULATOR */}
                <div style={{ backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "8px" }}>7. Driving Anomaly Event Simulator:</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button onClick={() => handleTriggerAnomaly("SPEEDING")} style={{ flex: 1, backgroundColor: "#f59e0b", color: "#fff", border: "none", borderRadius: "4px", padding: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "0.72rem" }}>⚡ Speeding Alert</button>
                      <button onClick={() => handleTriggerAnomaly("HARSH_BRAKE")} style={{ flex: 1, backgroundColor: "#e11d48", color: "#fff", border: "none", borderRadius: "4px", padding: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "0.72rem" }}>🛑 Harsh Brake</button>
                    </div>
                    <button onClick={() => handleTriggerAnomaly("SOS")} style={{ width: "100%", backgroundColor: "#dc2626", color: "#fff", border: "none", borderRadius: "4px", padding: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "0.72rem" }}>🚨 Panic / SOS Alarm</button>
                  </div>
                  {activeAnomaly && <div style={{ marginTop: "8px", backgroundColor: "#ef4444", color: "#fff", padding: "6px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "bold", textAlign: "center" }}>⚠️ ALERT TRIGGERED: {activeAnomaly} EVENT!</div>}
                </div>

                {/* FEATURE 8 & 9: STREAM LOG & COPY PAYLOAD */}
                <div style={{ backgroundColor: "#020617", padding: "12px", borderRadius: "8px", border: "1px solid #1e293b" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: "bold", color: "#94a3b8" }}>8. Live Telemetry Fix Stream Log:</div>
                    <button onClick={handleCopyFixPayload} style={{ backgroundColor: copyPayloadFeedback ? "#10b981" : "#334155", color: "#fff", border: "none", borderRadius: "4px", padding: "3px 8px", fontSize: "0.7rem", cursor: "pointer", fontWeight: "bold" }}>
                      {copyPayloadFeedback ? "✓ Copied!" : "📋 Copy Fix Payload"}
                    </button>
                  </div>
                  <div style={{ backgroundColor: "#0f172a", padding: "8px", borderRadius: "6px", maxHeight: "140px", overflowY: "auto" }}>
                    {telemetryLogs.length === 0 ? <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Click Start Live GPS Motion to stream payloads...</span> : telemetryLogs.map((l, i) => <div key={i} style={{ fontSize: "0.72rem", fontFamily: "monospace", color: "#34d399", marginBottom: "2px" }}>{l}</div>)}
                  </div>
                </div>

                {/* FEATURE 10: MOTION BREADCRUMBS */}
                <div style={{ backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "4px" }}>10. OpenLayers Motion Breadcrumbs:</div>
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Trail Status: <strong style={{ color: "#10b981" }}>ol/geom/LineString ({breadcrumbCoordsRef.current.length} Waypoints) ACTIVE</strong></div>
                </div>
              </div>
            )}

            {/* ENGINE 3: MASTER 10-FEATURE GEOFENCE ENGINE PANEL */}
            {activeEngine === "GEOFENCE" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: 0, fontSize: "1.05rem", color: "#38bdf8" }}>🛡️ Engine 3: Master 10-Feature Geofence Suite</h3>
                  <button onClick={() => setShowEngine3Guide(!showEngine3Guide)} style={{ backgroundColor: "#0284c7", color: "#fff", border: "none", borderRadius: "4px", padding: "4px 8px", fontSize: "0.75rem", cursor: "pointer", fontWeight: "bold" }}>
                    {showEngine3Guide ? "Hide Guide" : "📖 User Guide"}
                  </button>
                </div>

                {/* EMBEDDED ON-SCREEN USER INSTRUCTION & QUICK-START GUIDE CARD FOR ENGINE 3 */}
                {showEngine3Guide && (
                  <div style={{ backgroundColor: "#0284c7", color: "#ffffff", padding: "12px", borderRadius: "8px", border: "1px solid #38bdf8", fontSize: "0.78rem", lineHeight: "1.4" }}>
                    <div style={{ fontWeight: "bold", fontSize: "0.82rem", marginBottom: "6px" }}>📖 10-FEATURE GEOFENCE QA TESTING PROTOCOL:</div>
                    <ol style={{ margin: 0, paddingLeft: "16px" }}>
                      <li><strong>Multi-Country Dropdown</strong>: Switch between 🇮🇳 India, 🇺🇸 US, 🇬🇧 UK, 🇦🇺 Australia, 🇨🇦 Canada!</li>
                      <li><strong>Alternative View Modes</strong>: Click `🔍 Auto-Fit BBOX`, `🛰️ Satellite Focus`, `📺 Fullscreen View`.</li>
                      <li><strong>Crisp Thin-Line Vector Styling</strong>: Thin 1.5px/2.5px crisp outlines matching GIS top-view maps!</li>
                      <li><strong>ST_Contains Evaluator</strong>: Click "Toggle Zone Breach" (Green ↔ Red).</li>
                      <li><strong>Breach Event Logs</strong>: Inspect total breach count & scrolling event log.</li>
                      <li><strong>PostGIS SQL Inspector</strong>: Click "📋 Copy SQL Query" for ST_Contains query.</li>
                      <li><strong>Action Triggers</strong>: Click Webhook, SMS Alert, or Immobilizer buttons.</li>
                      <li><strong>Perimeter & Area</strong>: View enclosure area & perimeter for selected state/district.</li>
                      <li><strong>Zone Dwell Time & Speed Limit</strong>: Inspect dwell counter & 30 km/h limit.</li>
                      <li><strong>GeoJSON Exporter</strong>: Click "📋 Copy GeoJSON" to export state/district polygon payload.</li>
                    </ol>
                  </div>
                )}

                {/* ALTERNATIVE GEOFENCE INSPECTION VIEW PERSPECTIVE SELECTOR BUTTONS */}
                <div style={{ backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #0284c7" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "8px" }}>👁️ Alternative Geofence Inspection Perspectives:</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                    <button onClick={() => setGeofenceViewMode("STANDARD")} style={{ backgroundColor: geofenceViewMode === "STANDARD" ? "#0284c7" : "#020617", color: "#fff", border: "1px solid #334155", borderRadius: "6px", padding: "6px", fontSize: "0.72rem", cursor: "pointer", fontWeight: "bold" }}>
                      🗺️ Standard View
                    </button>
                    <button onClick={() => setGeofenceViewMode("AUTO_FIT")} style={{ backgroundColor: geofenceViewMode === "AUTO_FIT" ? "#0284c7" : "#020617", color: "#fff", border: "1px solid #334155", borderRadius: "6px", padding: "6px", fontSize: "0.72rem", cursor: "pointer", fontWeight: "bold" }}>
                      🔍 Auto-Fit BBOX
                    </button>
                    <button onClick={() => setGeofenceViewMode("SATELLITE_FOCUS")} style={{ backgroundColor: geofenceViewMode === "SATELLITE_FOCUS" ? "#0284c7" : "#020617", color: "#fff", border: "1px solid #334155", borderRadius: "6px", padding: "6px", fontSize: "0.72rem", cursor: "pointer", fontWeight: "bold" }}>
                      🛰️ Satellite Focus
                    </button>
                    <button onClick={() => setGeofenceViewMode("FULLSCREEN")} style={{ backgroundColor: (geofenceViewMode as string) === "FULLSCREEN" ? "#0284c7" : "#020617", color: "#fff", border: "1px solid #334155", borderRadius: "6px", padding: "6px", fontSize: "0.72rem", cursor: "pointer", fontWeight: "bold" }}>
                      📺 Fullscreen View
                    </button>
                  </div>
                </div>

                {/* SEARCH BOX & MAP LAYER CHECKBOXES */}
                <div style={{ backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "8px" }}>🔍 Search & Layer Display Controls:</div>
                  <input type="text" placeholder="🔍 Search state or district..." value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} style={{ width: "100%", padding: "6px 10px", backgroundColor: "#020617", color: "#fff", border: "1px solid #334155", borderRadius: "6px", fontSize: "0.8rem", marginBottom: "10px" }} />
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "0.75rem", color: "#f8fafc" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                      <input type="checkbox" checked={showStatesLayer} onChange={(e) => setShowStatesLayer(e.target.checked)} style={{ accentColor: "#38bdf8" }} />
                      🗺️ States Layer
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                      <input type="checkbox" checked={showDistrictsLayer} onChange={(e) => setShowDistrictsLayer(e.target.checked)} style={{ accentColor: "#34d399" }} />
                      📍 Districts Layer
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                      <input type="checkbox" checked={showCapitalsLayer} onChange={(e) => setShowCapitalsLayer(e.target.checked)} style={{ accentColor: "#f59e0b" }} />
                      ⭐ Capitals Markers
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                      <input type="checkbox" checked={showLabelsLayer} onChange={(e) => setShowLabelsLayer(e.target.checked)} style={{ accentColor: "#e11d48" }} />
                      🏷️ Map Labels
                    </label>
                  </div>
                </div>

                {/* MULTI-COUNTRY, STATE & DISTRICT DROPDOWN SELECTOR PANEL */}
                <div style={{ backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "8px" }}>🌍 Country & Administrative Boundary Dropdowns:</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    
                    {/* DROPDOWN 1: SELECT COUNTRY */}
                    <div>
                      <label style={{ fontSize: "0.72rem", color: "#94a3b8", display: "block", marginBottom: "3px" }}>1. Select Country (Global Boundary Space):</label>
                      <select value={selectedCountryCode} onChange={(e) => handleSelectCountry(e.target.value)} style={{ width: "100%", padding: "6px 8px", backgroundColor: "#020617", color: "#34d399", border: "1px solid #334155", borderRadius: "6px", fontSize: "0.82rem", fontWeight: "bold", cursor: "pointer" }}>
                        {GLOBAL_COUNTRIES_DATASET.map((c) => (
                          <option key={c.countryCode} value={c.countryCode}>{c.flagEmoji} {c.countryName} ({c.capitalName})</option>
                        ))}
                      </select>
                    </div>

                    {/* DROPDOWN 2: SELECT STATE */}
                    <div>
                      <label style={{ fontSize: "0.72rem", color: "#94a3b8", display: "block", marginBottom: "3px" }}>2. Select State / Province / Region:</label>
                      <select value={selectedStateName} onChange={(e) => handleSelectState(e.target.value)} style={{ width: "100%", padding: "6px 8px", backgroundColor: "#020617", color: "#38bdf8", border: "1px solid #334155", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "bold", cursor: "pointer" }}>
                        {filteredCountryStates.map((st) => (
                          <option key={st.stateCode} value={st.stateName}>🏛️ {st.stateName} ({st.stateCode})</option>
                        ))}
                      </select>
                    </div>

                    {/* DROPDOWN 3: SELECT DISTRICT / BOUNDARY */}
                    <div>
                      <label style={{ fontSize: "0.72rem", color: "#94a3b8", display: "block", marginBottom: "3px" }}>3. Select Boundary Target (Entire Region OR District):</label>
                      <select value={selectedDistrictId} onChange={(e) => handleSelectDistrict(e.target.value)} style={{ width: "100%", padding: "6px 8px", backgroundColor: "#020617", color: currentDistrictObj.isEntireState ? "#38bdf8" : "#34d399", border: "1px solid #334155", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "bold", cursor: "pointer" }}>
                        {availableBoundaryOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.isEntireState ? `🌐 ${opt.name}` : `📍 ${opt.name}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* FEATURE 1: MULTI-GEOMETRY GEOFENCE ZONE SELECTOR */}
                <div style={{ backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "8px" }}>1. Multi-Geometry Zone Type (3 Modes):</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {[
                      { id: "POLYGON", label: "⬡ Realistic Polygon Boundary (State/District)" },
                      { id: "CIRCULAR", label: "⭕ Circular Radial Zone (500m Radius)" },
                      { id: "CORRIDOR", label: "══ Polyline Corridor Buffer Zone" },
                    ].map((z) => (
                      <label key={z.id} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", color: "#f1f5f9", cursor: "pointer" }}>
                        <input type="radio" name="geofenceType" value={z.id} checked={geofenceType === z.id} onChange={() => setGeofenceType(z.id as any)} style={{ accentColor: "#0284c7", cursor: "pointer" }} />
                        {z.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* FEATURE 2: REAL-TIME SPATIAL CONTAINMENT EVALUATOR */}
                <div style={{ backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "8px" }}>2. Spatial Containment Evaluator (ST_Contains):</div>
                  <button onClick={handleSimulateGeofence} style={{ width: "100%", backgroundColor: zoneStatus === "INSIDE" ? "#ef4444" : "#10b981", color: "#fff", border: "none", padding: "10px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", marginBottom: "8px", fontSize: "0.85rem" }}>
                    {zoneStatus === "INSIDE" ? "🔴 TRIGGER EXITED ZONE (CLEAR)" : "⚡ TRIGGER ZONE BREACH (ENTERED)"}
                  </button>
                  <div style={{ fontSize: "0.78rem" }}>
                    Status: <strong style={{ color: zoneStatus === "INSIDE" ? "#ef4444" : "#10b981" }}>{zoneStatus === "INSIDE" ? "🔴 INSIDE / BREACH ALARM" : "🟢 OUTSIDE / CLEAR"}</strong>
                  </div>
                </div>

                {/* FEATURE 3: BREACH COUNTER & EVENT LOG */}
                <div style={{ backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "8px" }}>
                    <span>3. Breach Counter & Event Log:</span>
                    <span style={{ color: "#ef4444" }}>{breachCount} Breaches</span>
                  </div>
                  <div style={{ backgroundColor: "#020617", padding: "8px", borderRadius: "6px", maxHeight: "120px", overflowY: "auto" }}>
                    {breachLogs.length === 0 ? <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Click Trigger Zone Breach to generate event logs...</span> : breachLogs.map((l, i) => <div key={i} style={{ fontSize: "0.72rem", fontFamily: "monospace", color: l.includes("BREACH") ? "#ef4444" : "#34d399", marginBottom: "2px" }}>{l}</div>)}
                  </div>
                </div>

                {/* FEATURE 4: POSTGIS SPATIAL SQL QUERY INSPECTOR & COPY BUTTON */}
                <div style={{ backgroundColor: "#020617", padding: "12px", borderRadius: "8px", border: "1px solid #1e293b" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: "bold", color: "#94a3b8" }}>4. PostGIS Spatial SQL Query:</div>
                    <button onClick={handleCopySqlQuery} style={{ backgroundColor: copySqlQueryFeedback ? "#10b981" : "#334155", color: "#fff", border: "none", borderRadius: "4px", padding: "3px 8px", fontSize: "0.7rem", cursor: "pointer", fontWeight: "bold" }}>
                      {copySqlQueryFeedback ? "✓ Copied!" : "📋 Copy SQL Query"}
                    </button>
                  </div>
                  <code style={{ fontSize: "0.72rem", color: "#38bdf8", wordBreak: "break-all" }}>{postGisQuery}</code>
                </div>

                {/* FEATURE 5: AUTOMATED BREACH ACTION TRIGGER SIMULATOR */}
                <div style={{ backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "8px" }}>5. Automated Action Triggers:</div>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {["SMS Alert", "Webhook POST", "Immobilizer"].map((action) => (
                      <button key={action} onClick={() => handleTriggerGeofenceAction(action)} style={{ flex: 1, backgroundColor: "#0284c7", color: "#fff", border: "none", borderRadius: "4px", padding: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "0.72rem" }}>
                        ⚡ {action}
                      </button>
                    ))}
                  </div>
                  {activeActionTrigger && (
                    <div style={{ marginTop: "6px", backgroundColor: "#10b981", color: "#fff", padding: "4px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "bold", textAlign: "center" }}>
                      ✓ EXECUTED: {activeActionTrigger} Action Sent!
                    </div>
                  )}
                </div>

                {/* FEATURE 6: PERIMETER & AREA CALCULATOR */}
                <div style={{ backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "6px" }}>6. Zone Area & Perimeter Engine:</div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "4px" }}><span style={{ color: "#94a3b8" }}>Enclosure Area:</span> <strong style={{ color: "#34d399" }}>{currentDistrictObj.areaSqKm.toLocaleString()} sq km</strong></div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}><span style={{ color: "#94a3b8" }}>Outer Perimeter:</span> <strong style={{ color: "#38bdf8" }}>{currentDistrictObj.perimeterKm.toLocaleString()} km</strong></div>
                </div>

                {/* FEATURE 7: ZONE DWELL TIME & SPEED LIMIT ENFORCEMENT */}
                <div style={{ backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "6px" }}>7. Zone Dwell Time & Speed Limit Engine:</div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "4px" }}>
                    <span style={{ color: "#94a3b8" }}>Zone Dwell Timer:</span> <strong style={{ color: "#f59e0b" }}>{dwellTimeMins} mins active</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                    <span style={{ color: "#94a3b8" }}>Zone Speed Limit:</span> <strong style={{ color: "#ef4444" }}>Max Allowed: {zoneSpeedLimitKmh} km/h</strong>
                  </div>
                </div>

                {/* FEATURE 8: INTERACTIVE ZONE LABEL & BOUNDARY STYLE */}
                <div style={{ backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "6px" }}>8. Zone Label & Boundary Style Engine:</div>
                  <div style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
                    {(["DASHED", "SOLID", "GLOWING"] as const).map((st) => (
                      <button key={st} onClick={() => setBoundaryStyle(st)} style={{ flex: 1, backgroundColor: boundaryStyle === st ? "#0284c7" : "#020617", color: "#fff", border: "1px solid #334155", borderRadius: "4px", padding: "4px", fontSize: "0.7rem", cursor: "pointer", fontWeight: "bold" }}>
                        {st}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setShowZoneLabel(!showZoneLabel)} style={{ width: "100%", padding: "6px", backgroundColor: showZoneLabel ? "#065f46" : "#475569", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", fontSize: "0.72rem" }}>
                    {showZoneLabel ? "🏷️ Zone Map Label Callout ENABLED" : "Zone Label Callout DISABLED"}
                  </button>
                </div>

                {/* FEATURE 9: TIME-WINDOWED SCHEDULE POLICY ENGINE */}
                <div style={{ backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#38bdf8", marginBottom: "6px" }}>9. Operating Hours Schedule Policy:</div>
                  <button onClick={() => setScheduleActive(!scheduleActive)} style={{ width: "100%", padding: "6px", backgroundColor: scheduleActive ? "#065f46" : "#475569", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", fontSize: "0.72rem", marginBottom: "4px" }}>
                    {scheduleActive ? "🕒 Schedule Policy (Mon-Fri 08:00-18:00) ACTIVE" : "Schedule Policy OFF"}
                  </button>
                  <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>Off-Hours Access: <strong style={{ color: "#ef4444" }}>STRICT BREACH ALERT</strong></div>
                </div>

                {/* FEATURE 10: GEOJSON POLYGON EXPORTER & COPY BUTTON */}
                <div style={{ backgroundColor: "#020617", padding: "12px", borderRadius: "8px", border: "1px solid #1e293b" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: "bold", color: "#94a3b8" }}>10. GeoJSON Polygon Exporter:</div>
                    <button onClick={handleCopyGeoJson} style={{ backgroundColor: copyGeoJsonFeedback ? "#10b981" : "#334155", color: "#fff", border: "none", borderRadius: "4px", padding: "3px 8px", fontSize: "0.7rem", cursor: "pointer", fontWeight: "bold" }}>
                      {copyGeoJsonFeedback ? "✓ Copied!" : "📋 Copy GeoJSON"}
                    </button>
                  </div>
                  <code style={{ fontSize: "0.7rem", color: "#34d399", wordBreak: "break-all" }}>{geoJsonPayload}</code>
                </div>
              </div>
            )}

            {/* ENGINE 4: ROUTING PANEL */}
            {activeEngine === "ROUTING" && (
              <div>
                <h3 style={{ margin: "0 0 12px 0", fontSize: "1.05rem", color: "#38bdf8" }}>🛣️ Engine 4: Routing Controls</h3>
                <div style={{ marginBottom: "8px" }}><label style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Origin:</label><input type="text" value={origin} onChange={(e) => setOrigin(e.target.value)} style={{ width: "100%", padding: "6px", backgroundColor: "#020617", color: "#fff", border: "1px solid #334155", borderRadius: "6px" }} /></div>
                <div style={{ marginBottom: "12px" }}><label style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Destination:</label><input type="text" value={destination} onChange={(e) => setDestination(e.target.value)} style={{ width: "100%", padding: "6px", backgroundColor: "#020617", color: "#fff", border: "1px solid #334155", borderRadius: "6px" }} /></div>
                <div style={{ fontSize: "0.85rem" }}>Distance: <strong style={{ color: "#38bdf8" }}>{calculatedDistanceKm} km</strong></div>
                <div style={{ fontSize: "0.85rem" }}>ETA: <strong style={{ color: "#10b981" }}>{calculatedEtaMins} mins</strong></div>
              </div>
            )}

            {/* ENGINE 5: OFFLINE SYNC PANEL */}
            {activeEngine === "OFFLINE_SYNC" && (
              <div>
                <h3 style={{ margin: "0 0 12px 0", fontSize: "1.05rem", color: "#38bdf8" }}>⚡ Engine 5: Offline Sync Controls</h3>
                <button onClick={() => setNetworkStatus(networkStatus === "ONLINE" ? "OFFLINE" : "ONLINE")} style={{ width: "100%", backgroundColor: networkStatus === "ONLINE" ? "#065f46" : "#7f1d1d", color: "#fff", border: "none", padding: "8px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", marginBottom: "8px" }}>Network Mode: {networkStatus}</button>
                <button onClick={handleForceSync} style={{ width: "100%", backgroundColor: "#0284c7", color: "#fff", border: "none", padding: "8px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", marginBottom: "12px" }}>Force Sync Queued Fixes</button>
                <div style={{ fontSize: "0.85rem", marginBottom: "4px" }}>Queued: <strong style={{ color: offlineRecordCount > 0 ? "#f59e0b" : "#10b981" }}>{offlineRecordCount} records</strong></div>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Header: <strong style={{ color: "#38bdf8" }}>{lastSyncOpId}</strong></div>
              </div>
            )}
          </div>
        )}

        {/* DEDICATED RIGHT OPENLAYERS MAP VIEWPORT */}
        <div style={{ flex: 1, position: "relative", backgroundColor: "#020617", display: "flex", flexDirection: "column" }}>
          <div ref={mapElementRef} style={{ width: "100%", height: "100%", flex: 1, position: "relative", backgroundColor: "#020617" }} />

          {/* EXIT FULLSCREEN BUTTON IF IN FULLSCREEN MODE */}
          {geofenceViewMode === "FULLSCREEN" && (
            <button onClick={() => setGeofenceViewMode("STANDARD")} style={{ position: "absolute", top: "20px", right: "20px", zIndex: 20, backgroundColor: "#0284c7", color: "#fff", border: "none", borderRadius: "6px", padding: "8px 14px", fontWeight: "bold", fontSize: "0.8rem", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.5)" }}>
              ✖ Exit Fullscreen View
            </button>
          )}

          {/* LIVE VEHICLE MAP LABEL BADGE OVERLAY */}
          {showMapBadge && activeEngine === "TELEMETRY" && (
            <div style={{ position: "absolute", top: "20px", left: "20px", zIndex: 12, backgroundColor: "rgba(15, 23, 42, 0.92)", backdropFilter: "blur(8px)", padding: "10px 14px", borderRadius: "8px", border: "1px solid #38bdf8", fontSize: "0.78rem", color: "#f8fafc", boxShadow: "0 4px 12px rgba(0,0,0,0.5)" }}>
              <div style={{ fontWeight: "bold", color: "#38bdf8", marginBottom: "4px" }}>🚗 VEHICLE CALLOUT BADGE (MH-31-FA-1001)</div>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Speed: <strong style={{ color: "#34d399" }}>{speedKmh} km/h</strong> | Heading: <strong style={{ color: "#f1f5f9" }}>{headingDeg}°</strong> | Status: <strong style={{ color: "#10b981" }}>🟢 IGNITION ON</strong></div>
            </div>
          )}

          {/* ENGINE 3: INTERACTIVE ZONE LABEL MAP HUD OVERLAY */}
          {showZoneLabel && showLabelsLayer && activeEngine === "GEOFENCE" && (
            <div style={{ position: "absolute", top: "20px", left: "20px", zIndex: 12, backgroundColor: "rgba(15, 23, 42, 0.92)", backdropFilter: "blur(8px)", padding: "10px 14px", borderRadius: "8px", border: zoneStatus === "INSIDE" ? "1px solid #ef4444" : "1px solid #10b981", fontSize: "0.78rem", color: "#f8fafc", boxShadow: "0 4px 12px rgba(0,0,0,0.5)" }}>
              <div style={{ fontWeight: "bold", color: zoneStatus === "INSIDE" ? "#ef4444" : "#10b981", marginBottom: "4px" }}>{currentCountryObj.flagEmoji} {currentCountryObj.countryName.toUpperCase()} — {selectedStateName.toUpperCase()} — {currentDistrictObj.name.toUpperCase()}</div>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Perspective Mode: <strong style={{ color: "#38bdf8" }}>{geofenceViewMode}</strong> | Containment: <strong style={{ color: zoneStatus === "INSIDE" ? "#ef4444" : "#10b981" }}>{zoneStatus}</strong> | Area: <strong style={{ color: "#34d399" }}>{currentDistrictObj.areaSqKm.toLocaleString()} sq km</strong></div>
            </div>
          )}

          {/* MAP HUD FOOTER BAR */}
          <div style={{ position: "absolute", bottom: "10px", left: "10px", right: "10px", zIndex: 10, display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgba(15, 23, 42, 0.9)", backdropFilter: "blur(8px)", padding: "8px 14px", borderRadius: "8px", border: "1px solid #334155", fontSize: "0.75rem", color: "#94a3b8" }}>
            <div>Country: <strong style={{ color: "#34d399" }}>{currentCountryObj.flagEmoji} {currentCountryObj.countryName}</strong></div>
            <div>Target: <strong style={{ color: zoneStatus === "INSIDE" ? "#ef4444" : "#10b981" }}>{currentDistrictObj.name} ({zoneStatus})</strong></div>
            <div>View Mode: <strong style={{ color: "#38bdf8" }}>{geofenceViewMode} (MULTI-VIEW GEOFENCE ENGINE ACTIVE)</strong></div>
          </div>
        </div>

      </div>
    </div>
  );
};
