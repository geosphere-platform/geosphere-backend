import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webDir = path.resolve(__dirname, "..");
const apiDir = path.join(webDir, "src", "app", "api");
const publicDir = path.join(webDir, "public");

// Discover all route handlers
function getRoutes(dir, base = "") {
  let routes = [];
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const f of files) {
    const fullPath = path.join(dir, f.name);
    if (f.isDirectory()) {
      routes = routes.concat(getRoutes(fullPath, path.join(base, f.name)));
    } else if (f.name === "route.ts" || f.name === "route.js") {
      const content = fs.readFileSync(fullPath, "utf8");
      const methods = [];
      ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].forEach((m) => {
        const regex = new RegExp(
          "(export\\s+(async\\s+)?function\\s+" +
            m +
            "\\b|export\\s+const\\s+" +
            m +
            "\\b|\\b" +
            m +
            "\\s*[,}]|withAuth\\(.*" +
            m +
            ")",
          "m"
        );
        if (regex.test(content)) {
          methods.push(m);
        }
      });
      const routePath = ("/api/" + base).split(path.sep).join("/");
      routes.push({ path: routePath, methods, file: fullPath, content });
    }
  }
  return routes;
}

// Categorization helper
function categorize(p) {
  if (p === "/api/health" || p === "/api/v1/health" || p === "/api/metrics")
    return {
      tag: "System Health & Metrics",
      description: "Liveness probes, Prometheus metrics, and system diagnostic telemetry.",
    };
  if (p.startsWith("/api/v1/auth"))
    return {
      tag: "Authentication & Identity",
      description: "JWT session lifecycle, credential verification, dual-token rotation, and self-service password recovery.",
    };
  if (p.startsWith("/api/v1/admin"))
    return {
      tag: "Platform Administration",
      description: "Super-admin governance: enterprise licenses, cross-tenant overrides, SDK releases, and master subscription controls.",
    };
  if (p.startsWith("/api/v1/developer"))
    return {
      tag: "Developer Portal & SDK Management",
      description: "Developer API keys, SDK access catalogs, version registries, package credentials, and real-time usage metrics.",
    };
  if (p.startsWith("/api/v1/vehicles"))
    return {
      tag: "Vehicles & Fleet Management",
      description: "Fleet asset CRUD, vehicle metadata, live GPS snapshots, and speed/heading telemetry.",
    };
  if (p.startsWith("/api/v1/telemetry"))
    return {
      tag: "Telemetry & GPS Ingestion",
      description: "High-throughput GPS telemetry ingestion (JSON, GT06 hex, MQTT), time-series storage, and SSE dispatch.",
    };
  if (p.startsWith("/api/v1/spatial/boundaries"))
    return {
      tag: "Administrative Boundaries (GIS)",
      description: "Precision administrative boundaries hierarchy (Countries, States, Districts, Tehsils) backed by OSM Nominatim & local datasets.",
    };
  if (p.startsWith("/api/v1/spatial/geofences"))
    return {
      tag: "Geofencing & Spatial Boundaries",
      description: "Geofence lifecycle, circle/polygon boundaries, real-time spatial evaluation, and entry/exit transition triggers.",
    };
  if (p.startsWith("/api/v1/spatial/operations"))
    return {
      tag: "Spatial Analysis & Geometry Operations",
      description: "Server-side PostGIS & Turf spatial math: area, perimeter, buffer, centroid, bbox, intersects, within, distance, and nearest.",
    };
  if (p.startsWith("/api/v1/spatial/query") || p.startsWith("/api/v1/spatial/search"))
    return {
      tag: "Spatial Search & Querying",
      description: "Geospatial queries: viewport bounding box, radius queries, nearest-neighbor, point-in-polygon containment, and intersection index.",
    };
  if (p.startsWith("/api/v1/spatial/analytics"))
    return {
      tag: "Spatial Analytics & Telemetry Aggregation",
      description: "Spatial analytics, trip track reconstruction, dwell time calculations, and geospatial time-series rollups.",
    };
  if (
    p.startsWith("/api/v1/spatial/locations") ||
    p.startsWith("/api/v1/spatial/history") ||
    p.startsWith("/api/v1/spatial/realtime")
  )
    return {
      tag: "Spatial Tracking & Locations",
      description: "Real-time location SSE streaming, current location snapshots, historical location trails, and batch location ingestion.",
    };
  if (
    p.startsWith("/api/v1/spatial/features") ||
    p.startsWith("/api/v1/spatial/entities") ||
    p.startsWith("/api/v1/spatial/subjects") ||
    p.startsWith("/api/v1/spatial/clusters") ||
    p.startsWith("/api/v1/spatial/events") ||
    p.startsWith("/api/v1/spatial/export") ||
    p.startsWith("/api/v1/spatial/import")
  )
    return {
      tag: "Spatial Features & Data Management",
      description: "GeoJSON feature collections, spatial entity indexes, dynamic point clustering, GeoJSON/KML/CSV import/export pipelines.",
    };
  if (p.startsWith("/api/v1/gis"))
    return {
      tag: "GIS Layers & Maps Configuration",
      description: "GIS map layer management, vector tile styling, basemap configuration, and map workspace presets.",
    };
  if (p.startsWith("/api/v1/tiles"))
    return {
      tag: "Map Tile Services",
      description: "Dynamic Vector (MVT) and Raster Map Tile server: /api/v1/tiles/{layer}/{z}/{x}/{y}.",
    };
  if (p.startsWith("/api/v1/alerts"))
    return {
      tag: "Alerts & Incidents",
      description: "Security and telematics incident alerts (speed violations, geofence breaches, SOS, battery drops).",
    };
  if (p.startsWith("/api/v1/rules"))
    return {
      tag: "Automated Rules & Triggers",
      description: "Rule-based event triggers, conditional logic engines, automated email/webhook actions, and execution audit history.",
    };
  if (p.startsWith("/api/v1/applications") || p.startsWith("/api/v1/modules"))
    return {
      tag: "Application Studio & Dynamic Modules",
      description: "No-code/low-code Application Studio, versioned business modules, JSON layout configuration, cloning, and publishing pipelines.",
    };
  if (p.startsWith("/api/v1/subscriptions") || p.startsWith("/api/v1/entitlements"))
    return {
      tag: "Billing, Subscriptions & Entitlements",
      description: "Multi-tier SaaS billing plans, feature entitlements, tenant quotas, upgrade/downgrade lifecycles, and invoices.",
    };
  if (
    p.startsWith("/api/v1/organizations") ||
    p.startsWith("/api/v1/workspaces") ||
    p.startsWith("/api/v1/invitations") ||
    p.startsWith("/api/v1/tenants")
  )
    return {
      tag: "Multi-Tenant Organizations & Workspaces",
      description: "Enterprise multi-tenancy: organization profiles, team invitations, RBAC member management, and isolated branch workspaces.",
    };
  if (p.startsWith("/api/v1/mobile"))
    return {
      tag: "Mobile SDK & Offline Sync Engine",
      description: "Kotlin Multiplatform (KMP) mobile sync: device registration, offline data packs, delta sync, media uploads, and remote tasks.",
    };
  if (p.startsWith("/api/v1/audit"))
    return {
      tag: "Compliance & Audit Trail",
      description: "Immutable SOC 2 / ISO 27001 audit ledger tracking administrative, security, and GIS actions across the platform.",
    };
  if (p.startsWith("/api/v1/reports"))
    return {
      tag: "Reports & Analytics Export",
      description: "Fleet performance reports, driver safety scorecards, fuel efficiency metrics, and CSV/PDF data exports.",
    };
  if (p.startsWith("/api/v1/dashboard"))
    return {
      tag: "Dashboard Metrics & Statistics",
      description: "Executive dashboards: vehicle status breakdown, active alerts, operational distance, and live fleet utilization.",
    };
  if (p.startsWith("/api/v1/tasks"))
    return {
      tag: "Background Tasks & Jobs",
      description: "Asynchronous task execution, batch job polling, geoprocessing jobs, and scheduled telemetry rollups.",
    };
  if (p.startsWith("/api/v1/usage"))
    return {
      tag: "Tenant Usage & Quotas",
      description: "Metered API consumption, spatial storage tracking, device counts, and rate limit telemetry.",
    };
  return {
    tag: "General",
    description: "Platform core utilities.",
  };
}

// Convert route path to OpenAPI format with {param}
function formatOpenApiPath(routePath) {
  return routePath.replace(/\[([^\]]+)\]/g, "{$1}");
}

// Extract path parameter names
function extractPathParams(routePath) {
  const matches = routePath.match(/\[([^\]]+)\]/g);
  if (!matches) return [];
  return matches.map((m) => m.slice(1, -1));
}

// Generate sensible operation summary
function generateSummary(method, routePath) {
  const parts = routePath.replace(/^\/api\/v1\//, "").replace(/^\/api\//, "").split("/");
  const lastPart = parts[parts.length - 1];
  const isParam = lastPart.startsWith("[") && lastPart.endsWith("]");
  const cleanLast = isParam ? parts[parts.length - 2] || "Item" : lastPart;

  const titleCase = (s) =>
    s
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  switch (method) {
    case "GET":
      if (isParam) return `Get ${titleCase(cleanLast)} by ID`;
      if (cleanLast.endsWith("s") || ["analytics", "activity", "usage", "history", "stats", "summary"].includes(cleanLast)) {
        return `List or Query ${titleCase(cleanLast)}`;
      }
      return `Retrieve ${titleCase(cleanLast)}`;
    case "POST":
      if (cleanLast === "login") return "Authenticate User (Dual-Token JWT)";
      if (cleanLast === "register") return "Register New User Account";
      if (cleanLast === "refresh") return "Refresh JWT Access Token";
      if (cleanLast === "logout") return "Revoke Active Session & Clear Cookies";
      if (cleanLast === "gps") return "Ingest High-Throughput GPS Telemetry";
      if (cleanLast === "search") return "Execute Geospatial Search";
      if (cleanLast === "evaluate") return "Evaluate Geofence Breach Conditions";
      if (cleanLast === "transition") return "Record Geofence Transition Event";
      if (cleanLast.startsWith("clone")) return "Clone Target Resource";
      if (cleanLast.startsWith("publish")) return "Publish Target Configuration";
      if (cleanLast.startsWith("rollback")) return "Rollback to Previous Version";
      if (cleanLast.startsWith("validate")) return "Validate Resource Schema";
      if (isParam) return `Action on ${titleCase(cleanLast)}`;
      return `Create ${titleCase(cleanLast)}`;
    case "PUT":
      return `Replace ${titleCase(cleanLast)}`;
    case "PATCH":
      return `Update ${titleCase(cleanLast)}`;
    case "DELETE":
      return `Delete ${titleCase(cleanLast)}`;
    default:
      return `${method} ${routePath}`;
  }
}

// Generate Operation Description
function generateDescription(method, routePath, tag) {
  return `Performs ${method} on \`${formatOpenApiPath(routePath)}\`. Category: **${tag}**. Enforces enterprise role-based access control, tenant boundary checks, and input schema validation.`;
}

// Common schemas
const commonSchemas = {
  ApiResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: true },
      data: { type: "object" },
      error: {
        type: "object",
        nullable: true,
        properties: {
          code: { type: "string", example: "VALIDATION_ERROR" },
          message: { type: "string", example: "Invalid input payload" },
        },
      },
      meta: {
        type: "object",
        properties: {
          timestamp: { type: "string", format: "date-time" },
          correlationId: { type: "string", example: "req-c1a9f041" },
        },
      },
    },
  },
  ErrorResponse: {
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      error: {
        type: "object",
        properties: {
          code: { type: "string", example: "UNAUTHORIZED" },
          message: { type: "string", example: "Bearer token missing or invalid" },
        },
      },
    },
  },
  LoginRequest: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: { type: "string", format: "email", example: "admin@fleet.com" },
      password: { type: "string", format: "password", example: "SecurePassword123!" },
    },
  },
  RegisterRequest: {
    type: "object",
    required: ["name", "email", "password"],
    properties: {
      name: { type: "string", example: "Enterprise Admin" },
      email: { type: "string", format: "email", example: "admin@enterprise.com" },
      password: { type: "string", format: "password", example: "SecurePassword123!" },
      organizationName: { type: "string", example: "Acme Logistics Corp" },
    },
  },
  GpsTelemetryPayload: {
    type: "object",
    required: ["deviceId", "lat", "lng", "timestamp"],
    properties: {
      deviceId: { type: "string", example: "vh-truck-101" },
      lat: { type: "number", format: "double", example: 21.1458 },
      lng: { type: "number", format: "double", example: 79.0882 },
      speed: { type: "number", example: 64.5 },
      heading: { type: "number", example: 182.0 },
      altitude: { type: "number", example: 310.5 },
      timestamp: { type: "string", format: "date-time", example: "2026-09-15T04:30:00Z" },
      battery: { type: "number", example: 98 },
      ignition: { type: "boolean", example: true },
      satellites: { type: "integer", example: 12 },
    },
  },
  Vehicle: {
    type: "object",
    required: ["name", "licensePlate", "make", "model"],
    properties: {
      id: { type: "string", example: "veh-001" },
      name: { type: "string", example: "Freightliner Cascadia #101" },
      licensePlate: { type: "string", example: "MH-31-TR-8899" },
      vin: { type: "string", example: "1FUJGHD1234567890" },
      make: { type: "string", example: "Freightliner" },
      model: { type: "string", example: "Cascadia 126" },
      year: { type: "integer", example: 2024 },
      type: { type: "string", enum: ["TRUCK", "VAN", "CAR", "BUS", "BIKE", "EQUIPMENT"], example: "TRUCK" },
      status: { type: "string", enum: ["ACTIVE", "MAINTENANCE", "IDLE", "INACTIVE"], example: "ACTIVE" },
      organizationId: { type: "string", example: "org-fleet-001" },
      workspaceId: { type: "string", example: "ws-primary" },
    },
  },
  Geofence: {
    type: "object",
    required: ["name", "geometryType"],
    properties: {
      id: { type: "string", example: "geo-nagpur-dc" },
      name: { type: "string", example: "Nagpur Central Logistics Hub" },
      description: { type: "string", example: "Primary fulfillment and cross-dock facility" },
      geometryType: { type: "string", enum: ["CIRCLE", "POLYGON", "ADMIN_BOUNDARY"], example: "POLYGON" },
      center: {
        type: "array",
        items: { type: "number" },
        example: [79.0882, 21.1458],
      },
      radius: { type: "number", description: "Radius in meters for circular geofences", example: 1200 },
      coordinates: {
        type: "array",
        items: { type: "array", items: { type: "number" } },
        description: "Array of [lon, lat] coordinates defining boundary vertices",
      },
      tags: { type: "array", items: { type: "string" }, example: ["warehouse", "depot", "logistics"] },
      color: { type: "string", example: "#3b82f6" },
      isActive: { type: "boolean", example: true },
    },
  },
  SpatialOperationRequest: {
    type: "object",
    required: ["geometry"],
    properties: {
      geometry: {
        type: "object",
        description: "GeoJSON Geometry object (Point, Polygon, LineString, etc.)",
        example: {
          type: "Polygon",
          coordinates: [
            [
              [79.07, 21.13],
              [79.11, 21.13],
              [79.11, 21.17],
              [79.07, 21.17],
              [79.07, 21.13],
            ],
          ],
        },
      },
      unit: { type: "string", enum: ["meters", "kilometers", "sq_meters", "sq_kilometers", "miles"], default: "sq_meters" },
      distance: { type: "number", description: "Distance parameter for buffer or proximity queries" },
    },
  },
};

// Main generator
function generateOpenApi() {
  const routes = getRoutes(apiDir);
  const tagMap = new Map();
  const paths = {};

  // Sort routes cleanly
  routes.sort((a, b) => a.path.localeCompare(b.path));

  routes.forEach((r) => {
    const { tag, description } = categorize(r.path);
    if (!tagMap.has(tag)) {
      tagMap.set(tag, description);
    }

    const openApiPath = formatOpenApiPath(r.path);
    if (!paths[openApiPath]) {
      paths[openApiPath] = {};
    }

    const pathParams = extractPathParams(r.path);

    r.methods.forEach((method) => {
      const summary = generateSummary(method, r.path);
      const isAuthRoute = r.path.startsWith("/api/v1/auth");
      const isPublicEndpoint = ["/api/health", "/api/v1/health", "/api/metrics", "/api/v1/auth/login", "/api/v1/auth/register", "/api/v1/auth/refresh", "/api/v1/auth/forgot-password", "/api/v1/auth/reset-password", "/api/v1/auth/verify-email"].includes(r.path);

      const op = {
        tags: [tag],
        summary,
        description: generateDescription(method, r.path, tag),
        operationId: `${method.toLowerCase()}_${r.path.replace(/[^a-zA-Z0-9]/g, "_")}`,
        parameters: [],
        responses: {
          200: {
            description: "Successful operation",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiResponse" },
              },
            },
          },
          400: {
            description: "Bad Request / Validation Error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          401: {
            description: "Unauthorized / Missing or Expired JWT",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          403: {
            description: "Forbidden / Insufficient Role Permissions",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          500: {
            description: "Internal Server Error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      };

      // Add Path Parameters
      pathParams.forEach((param) => {
        op.parameters.push({
          name: param,
          in: "path",
          required: true,
          description: `Unique identifier for ${param}`,
          schema: {
            type: ["z", "x", "y"].includes(param) ? "integer" : "string",
          },
        });
      });

      // Add Standard Multi-Tenant Headers
      if (!isPublicEndpoint) {
        op.parameters.push({
          name: "x-organization-id",
          in: "header",
          required: false,
          description: "Tenant Organization UUID context override",
          schema: { type: "string" },
        });
        op.parameters.push({
          name: "x-workspace-id",
          in: "header",
          required: false,
          description: "Isolated workspace branch identifier",
          schema: { type: "string" },
        });

        // Security requirement
        op.security = [{ bearerAuth: [] }, { apiKeyAuth: [] }];
      }

      // Add Query Parameters based on path patterns
      if (r.path.includes("search") || r.path.includes("query")) {
        op.parameters.push({
          name: "query",
          in: "query",
          required: r.path.includes("boundaries"),
          description: "Search keyword or spatial query text",
          schema: { type: "string" },
        });
        if (r.path.includes("boundaries")) {
          op.parameters.push({
            name: "level",
            in: "query",
            description: "Administrative level filter",
            schema: {
              type: "string",
              enum: ["all", "country", "state", "district", "tehsil"],
              default: "all",
            },
          });
          op.parameters.push({
            name: "source",
            in: "query",
            description: "Data source priority",
            schema: {
              type: "string",
              enum: ["local", "osm", "hybrid"],
              default: "hybrid",
            },
          });
        }
      }

      if (r.path.includes("audit") || r.path.includes("reports") || r.path.includes("history") || r.path.includes("events")) {
        op.parameters.push({
          name: "limit",
          in: "query",
          description: "Maximum number of records to return",
          schema: { type: "integer", default: 50, minimum: 1, maximum: 500 },
        });
        op.parameters.push({
          name: "page",
          in: "query",
          description: "Pagination page index (1-based)",
          schema: { type: "integer", default: 1 },
        });
      }

      if (r.path.includes("audit")) {
        op.parameters.push({
          name: "severity",
          in: "query",
          description: "Audit event severity filter",
          schema: {
            type: "string",
            enum: ["ALL", "INFO", "WARNING", "CRITICAL"],
            default: "ALL",
          },
        });
      }

      if (r.path.includes("viewport") || r.path.includes("bbox")) {
        op.parameters.push({
          name: "bbox",
          in: "query",
          description: "Bounding box coordinates (minLon,minLat,maxLon,maxLat)",
          schema: { type: "string", example: "79.05,21.10,79.15,21.20" },
        });
      }

      // Add Request Body if POST/PUT/PATCH
      if (["POST", "PUT", "PATCH"].includes(method)) {
        if (r.path === "/api/v1/auth/login") {
          op.requestBody = {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginRequest" },
              },
            },
          };
        } else if (r.path === "/api/v1/auth/register") {
          op.requestBody = {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RegisterRequest" },
              },
            },
          };
        } else if (r.path === "/api/v1/telemetry/gps" || r.path === "/api/v1/telemetry") {
          op.requestBody = {
            required: true,
            description: "GPS Telemetry payload or raw hex stream",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/GpsTelemetryPayload" },
              },
            },
          };
        } else if (r.path.startsWith("/api/v1/vehicles") && method === "POST") {
          op.requestBody = {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Vehicle" },
              },
            },
          };
        } else if (r.path.startsWith("/api/v1/spatial/geofences") && method === "POST") {
          op.requestBody = {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Geofence" },
              },
            },
          };
        } else if (r.path.startsWith("/api/v1/spatial/operations")) {
          op.requestBody = {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SpatialOperationRequest" },
              },
            },
          };
        } else {
          op.requestBody = {
            required: false,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  description: "Request parameters and configuration payload",
                },
              },
            },
          };
        }
      }

      paths[openApiPath][method.toLowerCase()] = op;
    });
  });

  // Prepare Tags Array
  const tags = Array.from(tagMap.entries()).map(([name, description]) => ({
    name,
    description,
  }));

  const openApiDoc = {
    openapi: "3.0.3",
    info: {
      title: "GeoSphere Platform — Enterprise GIS & Telemetry REST API",
      version: "1.0.0",
      description: `
# GeoSphere Enterprise API Gateway

The **GeoSphere Platform** provides high-performance, enterprise-grade geospatial analysis, real-time telemetry processing, vehicle fleet management, multi-tier SaaS billing, and low-code Application Studio capabilities.

## Key Architectural Capabilities
- **Multi-Tenant Isolation**: Complete isolation across Organization, Workspace, and Role boundaries.
- **High-Throughput Telemetry**: Ingestion pipelines supporting JSON, GT06 GPS trackers, and MQTT bridges with automatic PostGIS indexing.
- **Server-Side Spatial GIS**: PostGIS and Turf.js spatial operations (area, buffer, centroid, bbox, distance, nearest, within, intersects).
- **Administrative Boundaries**: High-precision boundary search supporting Countries, States, Districts, and Tehsils with OpenStreetMap hybrid sync.
- **Application Studio**: No-code dynamic module composition and publication engine.
- **Immutable Audit Ledger**: SOC 2 / ISO 27001 compliant activity logging.

## Authentication & Authorization
- **Bearer JWT**: Pass \`Authorization: Bearer <access_token>\` header obtained from \`/api/v1/auth/login\`.
- **API Key**: For backend microservices and IoT devices, provide \`x-api-key\` header.
- **Tenant Scope**: Specify \`x-organization-id\` and \`x-workspace-id\` headers to target specific organizational branches.
      `.trim(),
      contact: {
        name: "GeoSphere Enterprise Engineering Team",
        email: "api-support@geosphere.io",
        url: "https://geosphere.io/developers",
      },
      license: {
        name: "GeoSphere Enterprise Commercial License",
        url: "https://geosphere.io/license",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local Development Server",
      },
      {
        url: "https://api.geosphere.io",
        description: "Production Gateway (Global Edge CDN)",
      },
    ],
    tags,
    paths,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Standard JWT Access Token obtained from /api/v1/auth/login",
        },
        apiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "x-api-key",
          description: "Developer or IoT Gateway API Key",
        },
        orgIdHeader: {
          type: "apiKey",
          in: "header",
          name: "x-organization-id",
          description: "Organization Context UUID",
        },
        workspaceIdHeader: {
          type: "apiKey",
          in: "header",
          name: "x-workspace-id",
          description: "Isolated Workspace Branch UUID",
        },
      },
      schemas: commonSchemas,
    },
  };

  return openApiDoc;
}

// Write file
const doc = generateOpenApi();
const outputPath = path.join(publicDir, "openapi.json");
fs.writeFileSync(outputPath, JSON.stringify(doc, null, 2), "utf8");

console.log(`Generated OpenAPI spec with ${Object.keys(doc.paths).length} paths across ${doc.tags.length} categories.`);
console.log(`Saved to: ${outputPath}`);
