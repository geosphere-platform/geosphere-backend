/**
 * GeoSphere Platform — Administrative Working Area Boundaries Unit Tests
 *
 * Verifies:
 * 1. Multi-tier administrative dataset integrity (Country -> State -> District -> Tehsil)
 * 2. Administrative query methods (getAdminCountries, getAdminStates, getAdminDistricts, getAdminTehsils)
 * 3. Exact polygon closure and coordinate validity across all administrative regions
 * 4. Realistic area in km² and perimeter calculations
 * 5. Cascading administrative hierarchy resolution
 */

import assert from "node:assert";
import {
  ADMINISTRATIVE_COUNTRIES_DATASET,
  getAdminCountries,
  getAdminStates,
  getAdminDistricts,
  getAdminTehsils,
  findAdminBoundaryItem,
} from "../../features/geofence/data/administrativeBoundaries";

export async function runGeofenceAdminBoundariesUnitTests(): Promise<void> {
  console.log("\n============================================================");
  console.log("   TEST SUITE: ADMINISTRATIVE BOUNDARIES & WORKING AREAS");
  console.log("============================================================\n");

  // TEST 1: Administrative Countries Dataset Structure
  console.log("  [1/6] Verifying Country Administrative Boundaries...");
  const countries = getAdminCountries();
  assert(Array.isArray(countries) && countries.length > 0, "Must have at least 1 country");
  const india = countries.find((c) => c.countryCode === "IN");
  assert(india !== undefined, "India must exist in administrative dataset");
  assert.strictEqual(india.level, "country");
  assert.strictEqual(india.areaSqKm, 3287263);
  assert(india.polygonCoords.length >= 10, "National boundary must have at least 10 boundary vertices");
  console.log("    ✓ Country level administrative boundary dataset valid");

  // TEST 2: State Administrative Boundaries
  console.log("  [2/6] Verifying State Administrative Boundaries...");
  const states = getAdminStates("IN");
  assert(states.length >= 3, "Must have at least 3 sample states (MH, GJ, MP)");
  const mh = states.find((s) => s.stateCode === "MH");
  assert(mh !== undefined, "Maharashtra must exist in states");
  assert.strictEqual(mh.level, "state");
  assert.strictEqual(mh.capital, "Mumbai");
  assert.strictEqual(mh.areaSqKm, 307713);
  assert(mh.districts.length >= 4, "Maharashtra must have at least 4 districts defined");
  console.log("    ✓ State level administrative boundaries valid (MH, GJ, MP)");

  // TEST 3: District Administrative Boundaries
  console.log("  [3/6] Verifying District Administrative Boundaries...");
  const mhDistricts = getAdminDistricts("IN", "MH");
  assert(mhDistricts.length >= 4, "Must retrieve Maharashtra districts");
  const nagpur = mhDistricts.find((d) => d.id === "admin_dist_nagpur");
  assert(nagpur !== undefined, "Nagpur District must exist");
  assert.strictEqual(nagpur.level, "district");
  assert.strictEqual(nagpur.areaSqKm, 9892);
  assert.strictEqual(nagpur.perimeterKm, 460);
  assert(nagpur.tehsils.length >= 5, "Nagpur District must have tehsils defined");
  console.log("    ✓ District level administrative boundaries valid");

  // TEST 4: Tehsil / Taluka Administrative Boundaries
  console.log("  [4/6] Verifying Tehsil / Taluka Administrative Boundaries...");
  const tehsils = getAdminTehsils("IN", "MH", "admin_dist_nagpur");
  assert(tehsils.length >= 5, "Nagpur must have at least 5 tehsils defined");
  
  const hingna = tehsils.find((t) => t.id === "admin_teh_hingna");
  assert(hingna !== undefined, "Hingna Tehsil must exist");
  assert.strictEqual(hingna.level, "tehsil");
  assert.strictEqual(hingna.districtId, "admin_dist_nagpur");
  assert.strictEqual(hingna.areaSqKm, 765);

  const nagpurUrban = tehsils.find((t) => t.id === "admin_teh_nagpur_urban");
  assert(nagpurUrban !== undefined, "Nagpur Urban Tehsil must exist");
  assert.strictEqual(nagpurUrban.areaSqKm, 217);
  console.log("    ✓ Tehsil level administrative boundaries valid (Hingna, Nagpur Urban, etc.)");

  // TEST 5: Exact Polygon Closure Across All Administrative Boundaries
  console.log("  [5/6] Testing Polygon Closure & Coordinate Integrity...");
  let checkedCount = 0;

  for (const country of ADMINISTRATIVE_COUNTRIES_DATASET) {
    const cFirst = country.polygonCoords[0];
    const cLast = country.polygonCoords[country.polygonCoords.length - 1];
    assert.strictEqual(cFirst[0], cLast[0], `Country ${country.name} polygon must be closed (lon match)`);
    assert.strictEqual(cFirst[1], cLast[1], `Country ${country.name} polygon must be closed (lat match)`);
    checkedCount++;

    for (const state of country.states) {
      const sFirst = state.polygonCoords[0];
      const sLast = state.polygonCoords[state.polygonCoords.length - 1];
      assert.strictEqual(sFirst[0], sLast[0], `State ${state.name} polygon must be closed`);
      assert.strictEqual(sFirst[1], sLast[1], `State ${state.name} polygon must be closed`);
      checkedCount++;

      for (const dist of state.districts) {
        const dFirst = dist.polygonCoords[0];
        const dLast = dist.polygonCoords[dist.polygonCoords.length - 1];
        assert.strictEqual(dFirst[0], dLast[0], `District ${dist.name} polygon must be closed`);
        assert.strictEqual(dFirst[1], dLast[1], `District ${dist.name} polygon must be closed`);
        checkedCount++;

        for (const teh of dist.tehsils) {
          const tFirst = teh.polygonCoords[0];
          const tLast = teh.polygonCoords[teh.polygonCoords.length - 1];
          assert.strictEqual(tFirst[0], tLast[0], `Tehsil ${teh.name} polygon must be closed`);
          assert.strictEqual(tFirst[1], tLast[1], `Tehsil ${teh.name} polygon must be closed`);
          checkedCount++;
        }
      }
    }
  }
  console.log(`    ✓ Verified 100% polygon closure across all ${checkedCount} administrative boundaries`);

  // TEST 6: Find Boundary Item by ID Utility
  console.log("  [6/6] Testing findAdminBoundaryItem Resolver...");
  const foundTeh = findAdminBoundaryItem("admin_teh_kamptee");
  assert(foundTeh !== null, "Must find Kamptee tehsil");
  assert.strictEqual(foundTeh?.name, "Kamptee Tehsil");
  assert.strictEqual(foundTeh?.level, "tehsil");

  const foundDist = findAdminBoundaryItem("admin_dist_pune");
  assert(foundDist !== null, "Must find Pune District");
  assert.strictEqual(foundDist?.name, "Pune District");

  const notFound = findAdminBoundaryItem("non_existent_id");
  assert.strictEqual(notFound, null, "Should return null for non-existent boundary ID");
  console.log("    ✓ Administrative boundary resolver functions correctly");

  console.log("\n============================================================");
  console.log("   ADMINISTRATIVE BOUNDARIES UNIT TESTS: ALL PASSED (6/6)");
  console.log("============================================================\n");
}

if (process.argv[1]?.includes("geofence.admin-boundaries.unit.test")) {
  runGeofenceAdminBoundariesUnitTests().catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  });
}
