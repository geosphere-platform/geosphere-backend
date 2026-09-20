/**
 * Database Seed Script — Testing Credentials for All Platform & Tenant Roles
 *
 * Populates the database with testing credentials for every role in the platform RBAC matrix.
 *
 * Run with:
 *   node --env-file=.env --import tsx src/database/seed.ts
 */

import { db } from "./index";
import {
  usersTable,
  vehiclesTable,
  alertsTable,
  tripsTable,
  organizationsTable,
  workspacesTable,
  organizationMembershipsTable,
} from "./schema";
import { hashPassword } from "../core/auth/password";
import { USER_ROLES } from "../core/constants";

async function seed() {
  console.log(
    "🌱 Starting database seed with testing credentials for all roles...\n",
  );

  const passwordHash = await hashPassword("12345678");
  const orgAId = "00000000-0000-0000-0000-000000000001";
  const orgBId = "00000000-0000-0000-0000-000000000002";

  // ──────────────────────────────────────────────
  // 0. Seed Multi-Tenant SaaS Organizations & Workspaces
  // ──────────────────────────────────────────────
  console.log("🏢 Seeding Multi-Tenant Organizations & Workspaces...");

  await db
    .insert(organizationsTable)
    .values([
      {
        id: orgAId,
        name: "Acme Logistics",
        slug: "acme-logistics",
        status: "ACTIVE",
        timezone: "UTC",
        locale: "en-US",
      },
      {
        id: orgBId,
        name: "Beta Solutions",
        slug: "beta-solutions",
        status: "ACTIVE",
        timezone: "UTC",
        locale: "en-US",
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(workspacesTable)
    .values([
      {
        id: "00000000-0000-0000-0000-000000000011",
        organizationId: orgAId,
        name: "Operations A",
        slug: "operations-a",
        description: "Primary operations workspace for Acme Logistics",
        status: "ACTIVE",
      },
      {
        id: "00000000-0000-0000-0000-000000000012",
        organizationId: orgAId,
        name: "Analytics A",
        slug: "analytics-a",
        description: "Spatial analytics workspace for Acme Logistics",
        status: "ACTIVE",
      },
      {
        id: "00000000-0000-0000-0000-000000000021",
        organizationId: orgBId,
        name: "Operations B",
        slug: "operations-b",
        description: "Primary operations workspace for Beta Solutions",
        status: "ACTIVE",
      },
    ])
    .onConflictDoNothing();

  // ──────────────────────────────────────────────
  // 1. All Platform & Tenant Role Test Users
  // ──────────────────────────────────────────────
  console.log("👤 Seeding test user credentials for all roles...");

  const userSeeds = [
    {
      email: "platformadmin@gisplatform.com",
      role: USER_ROLES.PLATFORM_ADMIN,
      firstName: "Platform",
      lastName: "Admin",
      orgId: null,
    },
    {
      email: "admin@fleet.com",
      role: USER_ROLES.SUPER_ADMIN,
      firstName: "System",
      lastName: "Administrator",
      orgId: null,
    },
    {
      email: "owner@acmefleet.com",
      role: USER_ROLES.TENANT_OWNER,
      firstName: "Tenant",
      lastName: "Owner",
      orgId: orgAId,
    },
    {
      email: "tenantadmin@acmefleet.com",
      role: USER_ROLES.TENANT_ADMIN,
      firstName: "Tenant",
      lastName: "Admin",
      orgId: orgAId,
    },
    {
      email: "manager@acmefleet.com",
      role: USER_ROLES.ORG_ADMIN,
      firstName: "Org",
      lastName: "Admin",
      orgId: orgAId,
    },
    {
      email: "manager.gis@acmefleet.com",
      role: USER_ROLES.MANAGER,
      firstName: "GIS",
      lastName: "Manager",
      orgId: orgAId,
    },
    {
      email: "operator@acmefleet.com",
      role: USER_ROLES.OPERATOR,
      firstName: "GIS",
      lastName: "Operator",
      orgId: orgAId,
    },
    {
      email: "dispatcher@acmefleet.com",
      role: USER_ROLES.DISPATCHER,
      firstName: "Fleet",
      lastName: "Dispatcher",
      orgId: orgAId,
    },
    {
      email: "fieldagent@acmefleet.com",
      role: USER_ROLES.FIELD_AGENT,
      firstName: "Field",
      lastName: "Agent",
      orgId: orgAId,
    },
    {
      email: "driver@acmefleet.com",
      role: USER_ROLES.DRIVER,
      firstName: "Fleet",
      lastName: "Driver",
      orgId: orgAId,
    },
    {
      email: "viewer@acmefleet.com",
      role: USER_ROLES.VIEWER,
      firstName: "Readonly",
      lastName: "Viewer",
      orgId: orgAId,
    },

    // Beta Solutions Users
    {
      email: "owner@beta.com",
      role: USER_ROLES.TENANT_OWNER,
      firstName: "Beta",
      lastName: "Owner",
      orgId: orgBId,
    },
    {
      email: "admin@beta.com",
      role: USER_ROLES.TENANT_ADMIN,
      firstName: "Beta",
      lastName: "Admin",
      orgId: orgBId,
    },
  ];

  for (const u of userSeeds) {
    const [user] = await db
      .insert(usersTable)
      .values({
        email: u.email,
        passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        organizationId: u.orgId,
        emailVerifiedAt: new Date(),
        isActive: true,
        failedLoginAttempts: 0,
      })
      .onConflictDoNothing()
      .returning();

    if (user && u.orgId) {
      await db
        .insert(organizationMembershipsTable)
        .values({
          organizationId: u.orgId,
          userId: user.id,
          role: u.role === USER_ROLES.TENANT_OWNER ? "OWNER" : "MEMBER",
          status: "ACTIVE",
        })
        .onConflictDoNothing();
    }

    console.log(
      `   ✅ Role '${u.role}': ${u.email} (Password: 12345678) ${user ? "[Created]" : "[Exists]"}`,
    );
  }

  // ──────────────────────────────────────────────
  // 2. Vehicles
  // ──────────────────────────────────────────────
  console.log("\n🚛 Seeding vehicles...");

  const vehicleSeeds = [
    {
      name: "Truck Alpha-01",
      licensePlate: "GIS-001",
      make: "Volvo",
      model: "FH16",
      year: 2022,
      status: "moving",
      lat: 28.6139,
      lng: 77.209,
    },
    {
      name: "Van Beta-02",
      licensePlate: "GIS-002",
      make: "Mercedes",
      model: "Sprinter",
      year: 2021,
      status: "idle",
      lat: 28.7041,
      lng: 77.1025,
    },
    {
      name: "Lorry Gamma-03",
      licensePlate: "GIS-003",
      make: "Tata",
      model: "Prima",
      year: 2023,
      status: "moving",
      lat: 28.5355,
      lng: 77.391,
    },
    {
      name: "Van Delta-04",
      licensePlate: "GIS-004",
      make: "Ford",
      model: "Transit",
      year: 2020,
      status: "stopped",
      lat: 28.4595,
      lng: 77.0266,
    },
    {
      name: "Truck Epsilon-05",
      licensePlate: "GIS-005",
      make: "Ashok",
      model: "Dost",
      year: 2022,
      status: "offline",
      lat: 28.6353,
      lng: 77.225,
    },
    {
      name: "Van Zeta-06",
      licensePlate: "GIS-006",
      make: "Maruti",
      model: "Eeco",
      year: 2021,
      status: "moving",
      lat: 28.6692,
      lng: 77.4538,
    },
    {
      name: "Truck Eta-07",
      licensePlate: "GIS-007",
      make: "Volvo",
      model: "FMX",
      year: 2023,
      status: "idle",
      lat: 28.5244,
      lng: 77.1855,
    },
    {
      name: "Van Theta-08",
      licensePlate: "GIS-008",
      make: "Hyundai",
      model: "H1",
      year: 2022,
      status: "offline",
      lat: 28.5921,
      lng: 77.2292,
    },
    {
      name: "Bus Iota-09",
      licensePlate: "GIS-009",
      make: "Tata",
      model: "Starbus",
      year: 2021,
      status: "moving",
      lat: 28.6129,
      lng: 77.2295,
    },
    {
      name: "Truck Kappa-10",
      licensePlate: "GIS-010",
      make: "Eicher",
      model: "Pro 6049",
      year: 2023,
      status: "stopped",
      lat: 28.4082,
      lng: 77.3178,
    },
  ];

  const insertedVehicles = await db
    .insert(vehiclesTable)
    .values(
      vehicleSeeds.map((v) => ({
        name: v.name,
        licensePlate: v.licensePlate,
        status: v.status as "moving" | "idle" | "stopped" | "offline",
        organizationId: orgAId,
        driverName: `Driver ${v.name.split(" ").pop()}`,
      })),
    )
    .onConflictDoNothing()
    .returning();

  console.log(`   ✅ ${insertedVehicles.length} vehicles seeded`);

  if (insertedVehicles.length > 0) {
    const vehicleIds = insertedVehicles.map((v) => v.id);

    // ──────────────────────────────────────────────
    // 3. Alerts
    // ──────────────────────────────────────────────
    console.log("\n🚨 Seeding alerts...");

    const alertSeeds = [
      {
        vehicleId: vehicleIds[0],
        type: "speeding",
        severity: "warning",
        message: "Vehicle exceeded speed limit by 20 km/h",
        status: "active",
      },
      {
        vehicleId: vehicleIds[1],
        type: "low_fuel",
        severity: "warning",
        message: "Fuel level below 15%",
        status: "active",
      },
      {
        vehicleId: vehicleIds[2],
        type: "geofence",
        severity: "critical",
        message: "Vehicle exited designated zone",
        status: "active",
      },
      {
        vehicleId: vehicleIds[4],
        type: "offline",
        severity: "critical",
        message: "Vehicle lost GPS signal for >30 min",
        status: "active",
      },
      {
        vehicleId: vehicleIds[3],
        type: "harsh_braking",
        severity: "info",
        message: "Harsh braking event detected",
        status: "resolved",
      },
      {
        vehicleId: vehicleIds[7],
        type: "offline",
        severity: "critical",
        message: "Device heartbeat timeout",
        status: "active",
      },
    ];

    await db
      .insert(alertsTable)
      .values(
        alertSeeds.map((a) => ({
          vehicleId: a.vehicleId,
          organizationId: orgAId,
          type: a.type,
          severity: a.severity as "critical" | "warning" | "info",
          message: a.message,
          status: a.status as "active" | "resolved",
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 7200000)),
        })),
      )
      .onConflictDoNothing();

    // ──────────────────────────────────────────────
    // 4. Trips
    // ──────────────────────────────────────────────
    console.log("🗺️  Seeding trips...");

    const now = Date.now();
    const tripSeeds = [
      {
        vehicleId: vehicleIds[0],
        driver: "Ravi Kumar",
        distance: "42.5",
        status: "in_progress",
        startOffset: -3600000,
      },
      {
        vehicleId: vehicleIds[2],
        driver: "Suresh Patel",
        distance: "18.3",
        status: "in_progress",
        startOffset: -1800000,
      },
      {
        vehicleId: vehicleIds[5],
        driver: "Anwar Sheikh",
        distance: "61.0",
        status: "in_progress",
        startOffset: -5400000,
      },
      {
        vehicleId: vehicleIds[3],
        driver: "Deepak Singh",
        distance: "28.7",
        status: "completed",
        startOffset: -7200000,
        endOffset: -3600000,
      },
      {
        vehicleId: vehicleIds[6],
        driver: "Priya Sharma",
        distance: "34.2",
        status: "completed",
        startOffset: -10800000,
        endOffset: -7200000,
      },
    ];

    await db
      .insert(tripsTable)
      .values(
        tripSeeds.map((t) => ({
          vehicleId: t.vehicleId,
          organizationId: orgAId,
          driverName: t.driver,
          distance: parseFloat(t.distance),
          status: t.status as "in_progress" | "completed",
          startTime: new Date(now + t.startOffset),
          endTime: t.endOffset ? new Date(now + t.endOffset) : undefined,
        })),
      )
      .onConflictDoNothing();
  }

  // ──────────────────────────────────────────────
  // 5. Subscription Domain (Plans, Features, Limits, Subscriptions)
  // ──────────────────────────────────────────────
  const { seedSubscriptions } = await import("./seed-subscriptions");
  await seedSubscriptions(orgAId, orgBId);

  // ──────────────────────────────────────────────
  // 6. Developer Portal (Scopes, Apps, Keys, Licenses)
  // ──────────────────────────────────────────────
  const { seedDeveloperPortal } = await import("./seed-developer-portal");
  await seedDeveloperPortal(orgAId);

  console.log("\n==========================================");
  console.log(
    "ALL ROLE TESTING CREDENTIALS, SUBSCRIPTIONS & DEVELOPER PORTAL SEEDED IN DB (100%)",
  );
  console.log("Default Password for all roles: 12345678");
  console.log("==========================================");

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
