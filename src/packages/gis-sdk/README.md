# Reusable Commercial GIS SaaS SDK / Library Platform

A professional, modular, versioned, reusable GIS SDK package architecture.

## Installation

```bash
npm install @gis-sdk/core @gis-sdk/map @gis-sdk/tracking @gis-sdk/geofence @gis-sdk/react
```

## Quick Start (React / Next.js)

```tsx
import React from "react";
import { GISProvider, useMap, useLayers } from "@gis-sdk/react";

const config = {
  apiBaseUrl: "http://localhost:3500",
  organizationId: "org_demo",
  workspaceId: "ws_demo",
  accessToken: "token_sample"
};

function MapComponent() {
  const map = useMap("map-view", { center: [73.8567, 18.5204], zoom: 12 });
  const layers = useLayers(map);

  React.useEffect(() => {
    if (layers) {
      layers.createLayer({
        id: "sample-layer",
        name: "Sample Layer",
        type: "vector",
        visible: true
      });
    }
  }, [layers]);

  return <div id="map-view" style={{ width: "100%", height: "500px" }} />;
}

export default function App() {
  return (
    <GISProvider config={config}>
      <MapComponent />
    </GISProvider>
  );
}
```

## Architecture Boundary Rule
```
Customer Application (Logistics / Agriculture / Fleet)
       │
       ▼
     GIS SDK (@gis-sdk/*)
       │
       ▼
     GIS API (/api/v1/*)
       │
       ▼
 GIS Platform Services
       │
       ▼
 PostgreSQL + PostGIS
```
Customer applications MUST NOT directly access PostgreSQL/PostGIS.

## Modular Packages
- `@gis-sdk/core`: SDK configuration, API transport, Auth context, Tenant context, Logger, Errors, GeoJSON parser.
- `@gis-sdk/entitlements`: Feature entitlements and usage limits (`hasFeature`, `getLimit`, `getUsage`).
- `@gis-sdk/map`: Map facade, Provider abstraction (`IMapProvider`), OpenLayers adapter, layers, drawing, selection, popups, and measurement.
- `@gis-sdk/spatial`: Spatial queries (`nearby`, `within`, `intersects`, `bbox`), geocoding, and routing.
- `@gis-sdk/geofence`: Circle, Polygon, MultiPolygon, and Corridor geofencing with normalized events (`ENTER`, `EXIT`, `DWELL`).
- `@gis-sdk/tracking`: Entity-agnostic tracking SDK (`LocationUpdate`) for vehicles, workers, devices, assets, animals, or equipment.
- `@gis-sdk/realtime`: Realtime connection state machine (`CONNECTED`, `RECONNECTING`, `FAILED`) and reconnect backoff policy.
- `@gis-sdk/rules`: Automation rules and alerts SDK.
- `@gis-sdk/analytics`: Heatmap, spatial density, and spatial aggregation SDK.
- `@gis-sdk/offline`: Online/offline state, cache abstraction, and sync queue.
- `@gis-sdk/plugins`: Extension contract (`GISPlugin`) and plugin registry.
- `@gis-sdk/react`: React provider `<GISProvider>` and hooks.
