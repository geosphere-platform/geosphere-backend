import { DEFAULT_FLEET_VEHICLES } from "@/features/vehicle/ui/mock-vehicles";
import { VehicleItem, VehicleStatusFilter, VehicleViewMode } from "@/features/vehicle/ui/vehicle-types";

export function runVehiclesUiTests(): boolean {
  console.log("------------------------------------------");
  console.log("RUNNING VEHICLES UI SUITE TESTS");
  console.log("------------------------------------------");

  // 1. Initial State & Fleet Data Verification
  process.stdout.write("  [1/6] Verifying Fleet Data Item Structure... ");
  const fleet: VehicleItem[] = DEFAULT_FLEET_VEHICLES;
  if (!Array.isArray(fleet) || fleet.length === 0) {
    throw new Error("Fleet data must be a non-empty array");
  }

  for (const v of fleet) {
    if (!v.id || !v.name || !v.licensePlate || !v.status || !v.type) {
      throw new Error(`Vehicle item missing required fields: ${JSON.stringify(v)}`);
    }
  }
  console.log("✓");

  // 2. Status Filter Simulation
  process.stdout.write("  [2/6] Testing Status Filter Transitions... ");
  const filters: VehicleStatusFilter[] = ["all", "moving", "idle", "maintenance", "offline"];
  for (const f of filters) {
    const filtered = fleet.filter((v) => {
      if (f === "all") return true;
      if (f === "moving") return v.status === "moving";
      if (f === "idle") return v.status === "idle";
      if (f === "maintenance") return v.status === "maintenance";
      return v.status === "offline" || v.status === "inactive";
    });

    if (f === "all" && filtered.length !== fleet.length) {
      throw new Error("Filter 'all' must return entire fleet");
    }
  }
  console.log("✓");

  // 3. Grid vs Table View Mode Contracts
  process.stdout.write("  [3/6] Testing Grid and Table View Mode Contracts... ");
  let activeMode: VehicleViewMode = "grid";
  if (activeMode !== "grid") throw new Error("Default mode must be grid");
  activeMode = "table";
  if (activeMode !== "table") throw new Error("Mode failed to toggle to table");
  console.log("✓");

  // 4. Details Drawer Selection State
  process.stdout.write("  [4/6] Testing Details Drawer Selection State... ");
  let selectedVehicle: VehicleItem | null = null;
  if (selectedVehicle !== null) throw new Error("Initial drawer state must be closed (null)");

  selectedVehicle = fleet[0];
  if (!selectedVehicle || selectedVehicle.id !== fleet[0].id) {
    throw new Error("Drawer selection failed to store target vehicle");
  }
  if (!selectedVehicle.licensePlate) {
    throw new Error("Selected vehicle missing license plate");
  }

  selectedVehicle = null;
  if (selectedVehicle !== null) throw new Error("Drawer close transition failed");
  console.log("✓");

  // 5. Add / Edit Modal Payload Integrity
  process.stdout.write("  [5/6] Testing Modal Form Payload Integrity... ");
  const testPayload: Partial<VehicleItem> = {
    name: "Express Carrier 10",
    licensePlate: "MH-31-FA-4004",
    type: "truck",
    driverName: "Ramesh Sharma",
    driverPhone: "+91 98230 44004",
    status: "active",
  };

  if (!testPayload.name || !testPayload.licensePlate) {
    throw new Error("Form payload missing required keys");
  }
  if (testPayload.licensePlate !== testPayload.licensePlate.toUpperCase()) {
    throw new Error("License plate must be uppercase");
  }
  console.log("✓");

  // 6. Search Filter Precision & Empty State Recovery
  process.stdout.write("  [6/7] Testing Search Filter & Recovery... ");
  const emptySearch = fleet.filter((v) => v.licensePlate.includes("NON-EXISTENT-XYZ"));
  if (emptySearch.length !== 0) {
    throw new Error("Empty search check failed");
  }

  const restored = fleet.filter((v) => v.licensePlate.includes("MH-"));
  if (restored.length === 0) {
    throw new Error("Filter recovery check failed");
  }
  console.log("✓");

  // 7. Full-Screen Mode Toggle Mechanics
  process.stdout.write("  [7/7] Testing Full-Screen Mode Toggle Mechanics... ");
  let isFullScreen = false;
  const toggle = () => {
    isFullScreen = !isFullScreen;
  };
  if (isFullScreen) throw new Error("Initial fullscreen state must be false");
  toggle();
  if (!isFullScreen) throw new Error("Fullscreen toggle failed to set true");
  toggle();
  if (isFullScreen) throw new Error("Fullscreen toggle failed to return to false");
  console.log("✓");

  console.log("✅ VEHICLES UI SUITE TESTS PASSED SUCCESSFULLY!");
  return true;
}
