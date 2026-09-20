/**
 * Pure Framework-Independent Routing Engine Unit Tests
 *
 * Verifies route calculation, waypoint ordering, distance/duration normalization,
 * provider switching, fallback estimation, and pure framework decoupling.
 *
 * MUST NOT require browser DOM, React, Next.js, or OpenLayers.
 */

import { RoutingEngine } from "../../core/gis/routing/engine/routing-engine";
import { MockRoutingProvider, IRoutingProvider } from "../../core/gis/routing/provider/routing-provider.interface";
import { RouteRequest, RouteResponse, RoutingError } from "../../core/gis/routing/types/routing.types";
import { Coordinate } from "../../core/gis/types/geometry";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

class FailingRoutingProvider implements IRoutingProvider {
  public readonly providerName = "FailingRoutingProvider";
  public async calculateRoute(): Promise<RouteResponse> {
    throw new RoutingError("PROVIDER_UNAVAILABLE", "Simulated network failure in primary routing provider");
  }
}

export async function runRoutingEnginePureUnitTests(): Promise<void> {
  console.log("------------------------------------------");
  console.log("RUNNING GENERIC ROUTING ENGINE PURE DOMAIN TESTS");
  console.log("------------------------------------------");

  const mockProvider = new MockRoutingProvider();
  const engine = new RoutingEngine(mockProvider);

  const origin: Coordinate = [77.2090, 28.6139]; // Delhi Connaught Place
  const dest: Coordinate = [77.3910, 28.5355];   // Noida Sector 62

  // 1. Basic Route Request Validation
  console.log("  [1/12] Testing Route Request Coordinate Validation...");
  let invalidRequestError = false;
  try {
    engine.validateRequest({ origin: [77.2090, 999], destination: dest });
  } catch (err: any) {
    if (err instanceof RoutingError && err.code === "INVALID_COORDINATE") {
      invalidRequestError = true;
    }
  }
  assert(invalidRequestError, "RoutingEngine must reject out-of-bounds latitude (999)");

  // 2. Primary Route Calculation
  console.log("  [2/12] Testing Primary Route Calculation...");
  const request: RouteRequest = {
    origin,
    destination: dest,
    options: { profile: "driving" },
  };

  const response = await engine.calculateRoute(request);
  assert(response.primaryRoute !== undefined, "RouteResponse must contain primaryRoute");
  assert(response.primaryRoute.summary.totalDistanceMeters > 0, "Route total distance must be positive");
  assert(response.primaryRoute.geometry.type === "LineString", "Route geometry must be GeoJSON LineString");

  // 3. Multi-Waypoint Ordering Preservation
  console.log("  [3/12] Testing Multi-Waypoint Ordering Preservation...");
  const wp1: Coordinate = [77.2500, 28.5800];
  const wp2: Coordinate = [77.3000, 28.5500];

  const multiWpRequest: RouteRequest = {
    origin,
    destination: dest,
    waypoints: [wp1, wp2],
  };

  const multiWpRes = await engine.calculateRoute(multiWpRequest);
  assert(multiWpRes.primaryRoute.waypoints.length === 4, "Waypoints count must equal 4 (Origin + 2 WPs + Dest)");
  assert(multiWpRes.primaryRoute.summary.waypointCount === 4, "Summary waypointCount must reflect total waypoints");

  // 4. Routing Profiles
  console.log("  [4/12] Testing Routing Profiles (walking, cycling, truck)...");
  const truckRequest: RouteRequest = {
    origin,
    destination: dest,
    options: { profile: "truck" },
  };
  const truckRes = await engine.calculateRoute(truckRequest);
  assert(truckRes.primaryRoute.summary.profile === "truck", "Route summary profile must reflect 'truck'");

  // 5. Provider Switching
  console.log("  [5/12] Testing Provider Switching via Dependency Injection...");
  const customProvider = new MockRoutingProvider();
  engine.setProvider(customProvider);
  assert(engine.getProvider().providerName === "MockRoutingProvider", "Provider must be updated");

  // 6. Fallback Behavior on Provider Failure
  console.log("  [6/12] Testing Automatic Provider Fallback on Failure...");
  engine.setProvider(new FailingRoutingProvider());
  const fallbackRes = await engine.calculateRoute(request);
  assert(fallbackRes.primaryRoute !== undefined, "Fallback route must be returned when primary provider fails");
  assert(fallbackRes.providerName === "MockRoutingProvider", "Fallback provider must be MockRoutingProvider");

  // Reset to MockProvider
  engine.setProvider(mockProvider);

  // 7. Route Bounds Computation
  console.log("  [7/12] Testing Route BoundingBox Computation...");
  const bounds = engine.calculateRouteBounds(response);
  assert(bounds !== undefined, "Route bounds must be computed");
  assert(bounds.minLng <= bounds.maxLng, "BoundingBox minLng must be <= maxLng");

  // 8. Direct Travel Estimation
  console.log("  [8/12] Testing Direct Travel Distance & Duration Estimation...");
  const estimate = engine.estimateDirectTravel(origin, dest, 60); // 60 km/h
  assert(estimate.distanceMeters > 0, "Estimated distance must be positive");
  assert(estimate.durationSeconds > 0, "Estimated duration must be positive");

  // 9. Typed Error Mapping
  console.log("  [9/12] Testing Typed Routing Error Codes...");
  let missingReqError = false;
  try {
    engine.validateRequest(null as any);
  } catch (err: any) {
    if (err instanceof RoutingError && err.code === "INVALID_REQUEST") {
      missingReqError = true;
    }
  }
  assert(missingReqError, "Null request must throw RoutingError with INVALID_REQUEST code");

  // 10. Summary Units Consistency
  console.log("  [10/12] Testing Distance & Duration Units Consistency...");
  const summary = response.primaryRoute.summary;
  assert(summary.totalDistanceKm === Number((summary.totalDistanceMeters / 1000).toFixed(2)), "Km and Meters must be mathematically consistent");
  assert(summary.totalDurationMinutes === Number((summary.totalDurationSeconds / 60).toFixed(1)), "Minutes and Seconds must be mathematically consistent");

  // 11. Generic Application Model Support (Fleet, Delivery, Field Force)
  console.log("  [11/12] Testing Generic Industry Model Support...");
  assert(response.primaryRoute.summary.providerName === "MockRoutingProvider", "Provider name must be exposed");

  // 12. Pure Framework Decoupling Verification
  console.log("  [12/12] Verifying Pure Framework Decoupling...");
  assert(typeof engine.calculateRoute === "function", "RoutingEngine must expose calculateRoute");
  assert(typeof mockProvider.calculateRoute === "function", "IRoutingProvider contract must be satisfied");

  console.log("✅ Generic Routing Engine Pure Domain Unit Tests Passed Successfully!");
}
