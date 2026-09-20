# @geosphere/web-sdk

Official TypeScript-first Web SDK for the GeoSphere Multi-Tenant GIS & Telemetry SaaS Platform.

## Installation

```bash
npm install @geosphere/web-sdk
```

## Quick Start

```typescript
import { GeoSphereClient } from "@geosphere/web-sdk";

const client = new GeoSphereClient({
  baseUrl: "https://api.geosphere.io",
  accessToken: "your-jwt-token",
  tenantId: "tenant_123",
  applicationId: "app_456"
});

// Authenticate
await client.auth.login({ email: "user@example.com", password: "password" });

// Query Spatial Features
const features = await client.gis.spatialQuery({
  minLongitude: -122.5,
  minLatitude: 37.7,
  maxLongitude: -122.3,
  maxLatitude: 37.9
});

// Ingest Telemetry
await client.location.sendTelemetry({
  id: "loc_001",
  tenantId: "tenant_123",
  entityId: "worker_789",
  entityType: "field_technician",
  coordinates: { latitude: 37.7749, longitude: -122.4194 },
  timestamp: new Date().toISOString()
});
```

## Security & Architecture

- **Zero Secrets**: Never include database credentials or JWT private signing keys in client bundles.
- **Authoritative Server**: Server enforces `User -> Tenant -> Application -> Role -> Permission -> Entitlement -> Resource`.
- **HTTPS API Only**: All communication routes exclusively through the HTTPS GeoAPI endpoints.
