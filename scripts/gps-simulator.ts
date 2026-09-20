/**
 * GeoSphere Platform — Nagpur Multi-Vehicle Live GPS Telemetry Simulator
 *
 * Runs 2–3 commercial vehicles along realistic Nagpur road corridors, computing great-circle
 * bearings, dynamic speeds, and telemetry payloads, and transmitting updates periodically
 * to the GeoSphere Ingestion API (`POST /api/v1/telemetry/gps`).
 *
 * Flow: `Simulator → Backend API → PostGIS → SSE Stream → GIS Map`
 *
 * Usage:
 *   npx tsx web/scripts/gps-simulator.ts [--interval 2000] [--vehicles 3] [--protocol webhook|gt06|mqtt] [--once] [--dry-run]
 */

import {
  NAGPUR_SIMULATION_FLEET,
  calculateBearing,
  interpolateCoordinate,
  getDirectionArrow,
} from "../src/features/tracking/mock/nagpurRoutes";

interface SimulatorOptions {
  apiUrl: string;
  intervalMs: number;
  vehicleCount: number;
  protocol: "webhook" | "gt06" | "mqtt";
  once: boolean;
  dryRun: boolean;
  tenantId: string;
}

interface VehicleSimState {
  vehicleId: string;
  licensePlate: string;
  driverName: string;
  currentWaypointIndex: number;
  progressSegmentT: number; // 0.0 to 1.0 along current segment
  currentLat: number;
  currentLng: number;
  speedKmh: number;
  heading: number;
  batteryPct: number;
  fuelPct: number;
  odometerKm: number;
  altitudeMeters: number;
}

// Parse Command Line Arguments
function parseArgs(): SimulatorOptions {
  const args = process.argv.slice(2);
  const options: SimulatorOptions = {
    apiUrl: process.env.GPS_API_URL || "http://localhost:3000/api/v1/telemetry/gps",
    intervalMs: 2000,
    vehicleCount: 3,
    protocol: "webhook",
    once: false,
    dryRun: false,
    tenantId: "default-tenant-0000",
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--interval" && args[i + 1]) options.intervalMs = Number(args[++i]);
    else if (arg === "--vehicles" && args[i + 1]) options.vehicleCount = Math.min(3, Math.max(1, Number(args[++i])));
    else if (arg === "--url" && args[i + 1]) options.apiUrl = args[++i];
    else if (arg === "--protocol" && args[i + 1]) options.protocol = args[++i] as SimulatorOptions["protocol"];
    else if (arg === "--tenant" && args[i + 1]) options.tenantId = args[++i];
    else if (arg === "--once") options.once = true;
    else if (arg === "--dry-run") options.dryRun = true;
  }

  return options;
}

export class NagpurGpsSimulator {
  private options: SimulatorOptions;
  private vehicleStates: VehicleSimState[] = [];
  private stepCount = 0;
  private timer: NodeJS.Timeout | null = null;

  constructor(options: Partial<SimulatorOptions> = {}) {
    this.options = {
      apiUrl: "http://localhost:3000/api/v1/telemetry/gps",
      intervalMs: 2000,
      vehicleCount: 3,
      protocol: "webhook",
      once: false,
      dryRun: false,
      tenantId: "default-tenant-0000",
      ...options,
    };

    this.initVehicles();
  }

  private initVehicles(): void {
    const fleet = NAGPUR_SIMULATION_FLEET.slice(0, this.options.vehicleCount);

    this.vehicleStates = fleet.map((v, idx) => {
      const w1 = v.waypoints[0];
      const w2 = v.waypoints[1 % v.waypoints.length];
      const initialBearing = calculateBearing(w1.lat, w1.lng, w2.lat, w2.lng);

      return {
        vehicleId: v.vehicleId,
        licensePlate: v.licensePlate,
        driverName: v.driverName,
        currentWaypointIndex: 0,
        progressSegmentT: (idx * 0.2) % 1.0, // Stagger initial vehicle positions along route
        currentLat: w1.lat,
        currentLng: w1.lng,
        speedKmh: w1.speedLimitKmh + (Math.random() - 0.5) * 6,
        heading: initialBearing,
        batteryPct: 94 - idx * 5,
        fuelPct: 82 - idx * 8,
        odometerKm: 34120 + idx * 8200,
        altitudeMeters: 310 + idx * 12,
      };
    });
  }

  /**
   * Advance all vehicles by one tick along their Nagpur routes.
   */
  public step(): { payloads: Record<string, unknown>[]; states: VehicleSimState[] } {
    this.stepCount++;
    const payloads: Record<string, unknown>[] = [];

    for (const v of this.vehicleStates) {
      const route = NAGPUR_SIMULATION_FLEET.find((f) => f.vehicleId === v.vehicleId);
      if (!route) continue;

      const waypoints = route.waypoints;
      const wpCount = waypoints.length;
      const currWp = waypoints[v.currentWaypointIndex];
      const nextWp = waypoints[(v.currentWaypointIndex + 1) % wpCount];

      // Advance progress along current segment
      // Step increment depends on speed: e.g. at 60 km/h in 2s ≈ 33m delta ≈ 0.04 - 0.08 progress
      const stepT = 0.05 + (v.speedKmh / 100) * 0.03;
      v.progressSegmentT += stepT;

      if (v.progressSegmentT >= 1.0) {
        v.progressSegmentT = 0;
        v.currentWaypointIndex = (v.currentWaypointIndex + 1) % wpCount;
      }

      const activeNextWp = waypoints[(v.currentWaypointIndex + 1) % wpCount];
      const activeCurrWp = waypoints[v.currentWaypointIndex];

      const interpolated = interpolateCoordinate(
        { lat: activeCurrWp.lat, lng: activeCurrWp.lng },
        { lat: activeNextWp.lat, lng: activeNextWp.lng },
        v.progressSegmentT
      );

      v.currentLat = interpolated.lat;
      v.currentLng = interpolated.lng;

      // Compute directional bearing
      v.heading = calculateBearing(activeCurrWp.lat, activeCurrWp.lng, activeNextWp.lat, activeNextWp.lng);

      // Speed jitter around segment limit (+/- 4 km/h)
      const targetSpeed = activeCurrWp.speedLimitKmh;
      const jitter = (Math.random() - 0.5) * 5;
      v.speedKmh = Math.max(15, Math.min(85, Number((targetSpeed + jitter).toFixed(1))));

      // Increment odometer & minor battery drain
      v.odometerKm += Number((v.speedKmh / 1800).toFixed(3));
      if (this.stepCount % 30 === 0 && v.batteryPct > 10) {
        v.batteryPct -= 1;
      }

      // Construct standard payload
      const payload = {
        subjectId: v.vehicleId,
        deviceId: v.vehicleId,
        licensePlate: v.licensePlate,
        driverName: v.driverName,
        latitude: v.currentLat,
        longitude: v.currentLng,
        speed: Number((v.speedKmh / 3.6).toFixed(2)), // m/s for standard LocationUpdate
        speedKmh: v.speedKmh,
        heading: v.heading,
        altitude: v.altitudeMeters,
        accuracy: 4.5,
        batteryPct: v.batteryPct,
        fuelPct: v.fuelPct,
        ignition: "ON",
        timestamp: new Date().toISOString(),
        source: "gps-simulator",
      };

      payloads.push(payload);
    }

    return { payloads, states: [...this.vehicleStates] };
  }

  /**
   * Transmit telemetry to the GeoSphere Ingestion API
   */
  public async transmit(payloads: Record<string, unknown>[]): Promise<boolean> {
    if (this.options.dryRun) {
      console.log(`[DRY-RUN] Step #${this.stepCount} Generated ${payloads.length} telemetry points`);
      return true;
    }

    try {
      const res = await fetch(this.options.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gps-protocol": this.options.protocol,
          "x-tenant-id": this.options.tenantId,
        },
        body: JSON.stringify(payloads),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[SIMULATOR] Ingestion returned HTTP ${res.status}: ${errText.substring(0, 100)}`);
        return false;
      }

      const json = await res.json();
      return json.success === true;
    } catch (err) {
      console.error(`[SIMULATOR] Transmission error (API may be offline): ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  }

  public async start(): Promise<void> {
    console.log("================================================================================");
    console.log("🚛 GEOSPHERE PLATFORM — NAGPUR LIVE GPS TELEMETRY SIMULATOR");
    console.log("================================================================================");
    console.log(`Target Ingestion API : ${this.options.apiUrl}`);
    console.log(`Update Interval      : ${this.options.intervalMs}ms`);
    console.log(`Active Vehicles      : ${this.options.vehicleCount} vehicles around Nagpur, India`);
    console.log(`Protocol Adapter     : ${this.options.protocol.toUpperCase()}`);
    console.log(`Dry Run Mode         : ${this.options.dryRun ? "ENABLED" : "DISABLED"}`);
    console.log("--------------------------------------------------------------------------------");

    this.vehicleStates.forEach((v) => {
      console.log(`  • [${v.vehicleId}] ${v.licensePlate} (${v.driverName}) → Starting at [${v.currentLat}, ${v.currentLng}]`);
    });
    console.log("================================================================================");

    const executeTick = async () => {
      const { payloads, states } = this.step();

      const timeStr = new Date().toLocaleTimeString();
      const statusLine = states
        .map((s) => `${s.licensePlate}: ${s.speedKmh} km/h ${getDirectionArrow(s.heading)} (${s.heading}°)`)
        .join(" | ");

      console.log(`[${timeStr}] Step #${this.stepCount} → ${statusLine}`);

      await this.transmit(payloads);
    };

    if (this.options.once) {
      await executeTick();
      console.log("✅ Single step completed successfully.");
      return;
    }

    await executeTick();
    this.timer = setInterval(executeTick, this.options.intervalMs);
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

// Auto-run when executed directly via CLI
if (typeof require !== "undefined" && require.main === module) {
  const options = parseArgs();
  const simulator = new NagpurGpsSimulator(options);
  simulator.start();

  process.on("SIGINT", () => {
    console.log("\n🛑 Stopping Nagpur GPS Telemetry Simulator...");
    simulator.stop();
    process.exit(0);
  });
}
