/**
 * Seed script for Phase 20 Business Module Registry & Application Templates
 */

export const INITIAL_BUSINESS_MODULES = [
  {
    code: "MAP",
    name: "Core GIS Mapping Engine",
    description:
      "Interactive vector/raster/tile mapping with zoom controls, bounding box filters, and spatial layer overlays",
    version: "1.0.0",
    dependencies: [],
    features: ["VIEW_MAP", "PAN_ZOOM", "LAYER_TOGGLE", "MEASURE"],
    permissions: ["APPLICATION_VIEW"],
    status: "REQUIRED",
  },
  {
    code: "GIS_LAYERS",
    name: "GIS Layer Manager",
    description:
      "Configurable spatial layers supporting GeoJSON, PostGIS tables, vector tiles, styling, and CRUD permissions",
    version: "1.0.0",
    dependencies: ["MAP"],
    features: [
      "LAYER_VIEW",
      "LAYER_CREATE",
      "LAYER_UPDATE",
      "LAYER_DELETE",
      "LAYER_EXPORT",
    ],
    permissions: ["LAYER_MANAGE"],
    status: "AVAILABLE",
  },
  {
    code: "LOCATION",
    name: "Location Engine & Live Tracking",
    description:
      "Real-time and background GPS location tracking with configurable intervals, distance filters, and power profiles",
    version: "1.0.0",
    dependencies: ["MAP"],
    features: ["GPS_TRACKING", "BACKGROUND_LOCATION", "TELEMETRY_LOGGING"],
    permissions: ["APPLICATION_VIEW"],
    status: "AVAILABLE",
  },
  {
    code: "GEOFENCE",
    name: "Geofencing & Boundary Alerts",
    description:
      "Polygonal/circular spatial boundary monitoring with enter, exit, and dwell duration trigger alerts",
    version: "1.0.0",
    dependencies: ["MAP", "LOCATION"],
    features: ["GEOFENCE_CREATE", "GEOFENCE_MONITOR", "ENTRY_EXIT_ALERTS"],
    permissions: ["APPLICATION_VIEW"],
    status: "AVAILABLE",
  },
  {
    code: "OFFLINE",
    name: "Offline Storage & Tile Packages",
    description:
      "Offline-first package downloader, spatial SQLite caching, and automatic network reconnect sync",
    version: "1.0.0",
    dependencies: ["MAP"],
    features: ["PACKAGE_DOWNLOAD", "OFFLINE_CACHE", "LOCAL_STORAGE"],
    permissions: ["APPLICATION_VIEW"],
    status: "AVAILABLE",
  },
  {
    code: "SYNC",
    name: "Bidirectional Synchronization Engine",
    description:
      "Idempotent delta sync engine with conflict resolution (server-wins / client-wins) and retry queues",
    version: "1.0.0",
    dependencies: ["OFFLINE"],
    features: ["DELTA_SYNC", "CONFLICT_RESOLUTION", "SYNC_LOGGING"],
    permissions: ["APPLICATION_VIEW"],
    status: "AVAILABLE",
  },
  {
    code: "FORMS",
    name: "Dynamic Field Data Collection Forms",
    description:
      "Configurable field collection forms with custom inputs, validation, conditional visibility, and GPS capture",
    version: "1.0.0",
    dependencies: ["MAP"],
    features: ["FORM_RENDER", "FORM_SUBMIT", "GPS_CAPTURE"],
    permissions: ["FORM_MANAGE"],
    status: "AVAILABLE",
  },
  {
    code: "TASKS",
    name: "Field Task & Dispatch Management",
    description:
      "Task assignment, lifecycle state machine tracking, location routing, and agent status reporting",
    version: "1.0.0",
    dependencies: ["MAP", "FORMS"],
    features: ["TASK_ASSIGN", "STATUS_UPDATE", "WORKFLOW_TRANSITION"],
    permissions: ["APPLICATION_VIEW"],
    status: "AVAILABLE",
  },
  {
    code: "MEDIA",
    name: "Media Management & Uploads",
    description:
      "Chunked and resumable upload engine for photos, signatures, and document attachments",
    version: "1.0.0",
    dependencies: ["FORMS"],
    features: ["PHOTO_CAPTURE", "SIGNATURE_DRAW", "RESUMABLE_UPLOAD"],
    permissions: ["APPLICATION_VIEW"],
    status: "AVAILABLE",
  },
  {
    code: "NOTIFICATIONS",
    name: "Alerts & Notifications Engine",
    description:
      "In-app and push notification dispatch triggered by task updates, geofence breaches, or sync failures",
    version: "1.0.0",
    dependencies: [],
    features: ["PUSH_NOTIFICATIONS", "IN_APP_ALERTS", "NOTIFICATION_RULES"],
    permissions: ["APPLICATION_VIEW"],
    status: "AVAILABLE",
  },
  {
    code: "REPORTS",
    name: "Activity & Summary Reports",
    description:
      "Configurable daily activity summaries, task statistics, spatial coverage reports, and PDF/CSV exports",
    version: "1.0.0",
    dependencies: [],
    features: ["DAILY_SUMMARY", "TASK_REPORT", "EXPORT_CSV"],
    permissions: ["APPLICATION_VIEW"],
    status: "AVAILABLE",
  },
  {
    code: "DASHBOARD",
    name: "Configurable Dashboard Widgets",
    description:
      "Modular dashboard widget grid featuring active asset counts, task status charts, and live map feeds",
    version: "1.0.0",
    dependencies: ["MAP"],
    features: ["WIDGET_GRID", "LIVE_COUNTERS", "CHART_VISUALIZATION"],
    permissions: ["APPLICATION_VIEW"],
    status: "AVAILABLE",
  },
  {
    code: "ASSET_MANAGEMENT",
    name: "Asset & Vehicle Tracking",
    description:
      "Equipment, vehicle, and infrastructure asset inventory management linked to spatial telemetry",
    version: "1.0.0",
    dependencies: ["MAP", "LOCATION"],
    features: ["ASSET_INVENTORY", "TELEMETRY_VIEW", "MAINTENANCE_LOG"],
    permissions: ["APPLICATION_VIEW"],
    status: "AVAILABLE",
  },
  {
    code: "WORKFLOW",
    name: "Stateful Workflow Engine",
    description:
      "Custom role-based state machine transition rules and supervisor approval workflows",
    version: "1.0.0",
    dependencies: ["TASKS", "FORMS"],
    features: ["STATE_TRANSITION", "ROLE_APPROVAL", "CONDITIONAL_RULES"],
    permissions: ["WORKFLOW_MANAGE"],
    status: "AVAILABLE",
  },
  {
    code: "ANALYTICS",
    name: "Advanced Spatial Analytics",
    description:
      "Density heatmaps, spatial cluster analysis, travel distance calculations, and historical trajectory playback",
    version: "1.0.0",
    dependencies: ["MAP", "LOCATION"],
    features: ["HEATMAP", "TRAJECTORY_PLAYBACK", "DENSITY_ANALYSIS"],
    permissions: ["APPLICATION_VIEW"],
    status: "PREMIUM",
  },
];

export const INITIAL_APPLICATION_TEMPLATES = [
  {
    code: "FIELD_SERVICE_TEMPLATE",
    name: "Utility & Utility Field Service Operations",
    description:
      "Complete solution for field technicians: inspection forms, task assignment, asset location, and offline photo uploads.",
    category: "UTILITY",
    defaultConfiguration: {
      branding: {
        appTitle: "Field Service Suite",
        primaryColor: "#1E293B",
        accentColor: "#10B981",
        darkMode: true,
      },
      modules: [
        "MAP",
        "GIS_LAYERS",
        "LOCATION",
        "OFFLINE",
        "SYNC",
        "FORMS",
        "TASKS",
        "MEDIA",
        "WORKFLOW",
      ],
      layers: [
        {
          id: "assets_layer",
          name: "Field Assets",
          geometryType: "Point",
          enabled: true,
        },
        {
          id: "work_orders_layer",
          name: "Work Orders",
          geometryType: "Point",
          enabled: true,
        },
      ],
      mapConfig: {
        initialCenter: [-74.006, 40.7128],
        zoom: 13,
        minZoom: 2,
        maxZoom: 18,
        vectorTileUrl: "/api/v1/tiles/{layerId}/{z}/{x}/{y}",
        defaultStyle: "DARK_VECTOR",
      },
      forms: [
        {
          formKey: "inspection_form",
          title: "Asset Inspection Form",
          fields: [
            {
              id: "asset_id",
              label: "Asset Tag Number",
              type: "TEXT",
              required: true,
            },
            {
              id: "condition",
              label: "Condition",
              type: "SELECT",
              options: ["EXCELLENT", "FAIR", "POOR", "CRITICAL"],
              required: true,
            },
            {
              id: "remarks",
              label: "Remarks",
              type: "TEXTAREA",
              required: false,
            },
          ],
        },
      ],
      workflows: [
        {
          code: "field_inspection_wf",
          name: "Field Inspection Workflow",
          definition: {
            states: [
              "CREATED",
              "ASSIGNED",
              "IN_PROGRESS",
              "REVIEW",
              "COMPLETED",
            ],
            initialState: "CREATED",
            transitions: [
              {
                from: "CREATED",
                to: "ASSIGNED",
                role: "DISPATCHER",
                action: "ASSIGN",
              },
              {
                from: "ASSIGNED",
                to: "IN_PROGRESS",
                role: "TECHNICIAN",
                action: "START",
              },
              {
                from: "IN_PROGRESS",
                to: "REVIEW",
                role: "TECHNICIAN",
                action: "SUBMIT",
              },
              {
                from: "REVIEW",
                to: "COMPLETED",
                role: "SUPERVISOR",
                action: "APPROVE",
              },
            ],
          },
        },
      ],
      featureFlags: {
        offlineMapsEnabled: true,
        backgroundTracking: true,
        resumableUploads: true,
      },
    },
  },
  {
    code: "FLEET_TEMPLATE",
    name: "Fleet & Logistics Vehicle Operations",
    description:
      "Vehicle fleet tracking, geofencing alert triggers, telemetry monitoring, and route analysis.",
    category: "LOGISTICS",
    defaultConfiguration: {
      branding: {
        appTitle: "Fleet Operations Pro",
        primaryColor: "#0F172A",
        accentColor: "#3B82F6",
        darkMode: true,
      },
      modules: [
        "MAP",
        "GIS_LAYERS",
        "LOCATION",
        "GEOFENCE",
        "ASSET_MANAGEMENT",
        "NOTIFICATIONS",
        "ANALYTICS",
      ],
      layers: [
        {
          id: "vehicles_layer",
          name: "Live Vehicles",
          geometryType: "Point",
          enabled: true,
        },
        {
          id: "routes_layer",
          name: "Delivery Routes",
          geometryType: "LineString",
          enabled: true,
        },
        {
          id: "depot_geofences",
          name: "Depot Boundaries",
          geometryType: "Polygon",
          enabled: true,
        },
      ],
      mapConfig: {
        initialCenter: [77.209, 28.6139],
        zoom: 11,
        minZoom: 2,
        maxZoom: 18,
        vectorTileUrl: "/api/v1/tiles/{layerId}/{z}/{x}/{y}",
        defaultStyle: "DARK_VECTOR",
      },
      featureFlags: {
        liveSpeedTelemetry: true,
        geofenceAlerts: true,
        historicalPlayback: true,
      },
    },
  },
  {
    code: "AGRICULTURE_TEMPLATE",
    name: "AgriGIS Farm & Crop Operations",
    description:
      "Crop parcel mapping, offline field survey forms, soil sampling data collection, and media records.",
    category: "AGRICULTURE",
    defaultConfiguration: {
      branding: {
        appTitle: "AgriGIS Operations",
        primaryColor: "#15803D",
        accentColor: "#EAB308",
        darkMode: false,
      },
      modules: [
        "MAP",
        "GIS_LAYERS",
        "OFFLINE",
        "SYNC",
        "FORMS",
        "MEDIA",
        "REPORTS",
      ],
      layers: [
        {
          id: "farm_parcels",
          name: "Crop Parcels",
          geometryType: "Polygon",
          enabled: true,
        },
        {
          id: "soil_samples",
          name: "Soil Sampling Points",
          geometryType: "Point",
          enabled: true,
        },
      ],
      mapConfig: {
        initialCenter: [-93.6208, 41.5868],
        zoom: 12,
        minZoom: 2,
        maxZoom: 18,
        vectorTileUrl: "/api/v1/tiles/{layerId}/{z}/{x}/{y}",
        defaultStyle: "SATELLITE",
      },
      forms: [
        {
          formKey: "crop_scouting",
          title: "Crop Scouting Form",
          fields: [
            {
              id: "parcel_id",
              label: "Parcel ID",
              type: "TEXT",
              required: true,
            },
            {
              id: "pest_level",
              label: "Pest Infestation",
              type: "SELECT",
              options: ["NONE", "LOW", "MODERATE", "HIGH"],
              required: true,
            },
            {
              id: "notes",
              label: "Observations",
              type: "TEXTAREA",
              required: false,
            },
          ],
        },
      ],
      featureFlags: {
        offlineTileCache: true,
        parcelBoundaries: true,
      },
    },
  },
  {
    code: "ASSET_INSPECTION_TEMPLATE",
    name: "Infrastructure & Asset Inspection",
    description:
      "High-frequency asset audit workflow with strict supervisor approvals and attachment validation.",
    category: "INFRASTRUCTURE",
    defaultConfiguration: {
      branding: {
        appTitle: "Asset Inspection Suite",
        primaryColor: "#4338CA",
        accentColor: "#EC4899",
        darkMode: true,
      },
      modules: [
        "MAP",
        "GIS_LAYERS",
        "FORMS",
        "TASKS",
        "MEDIA",
        "WORKFLOW",
        "REPORTS",
      ],
      layers: [
        {
          id: "infrastructure_layer",
          name: "Infrastructure Assets",
          geometryType: "Point",
          enabled: true,
        },
      ],
      mapConfig: {
        initialCenter: [-0.1278, 51.5074],
        zoom: 12,
        minZoom: 2,
        maxZoom: 18,
        vectorTileUrl: "/api/v1/tiles/{layerId}/{z}/{x}/{y}",
        defaultStyle: "DARK_VECTOR",
      },
      featureFlags: {
        photoVerificationRequired: true,
        strictWorkflowTransitions: true,
      },
    },
  },
];
