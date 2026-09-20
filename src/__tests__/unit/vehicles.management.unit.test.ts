import { IVehicleRepository } from "@/features/vehicle/domain/repository.interface";
import { Vehicle, TelemetryLog } from "@/features/vehicle/domain/entities";
import { CreateVehicleUseCase } from "@/features/vehicle/application/create-vehicle.usecase";
import { UpdateVehicleUseCase } from "@/features/vehicle/application/update-vehicle.usecase";
import { GetVehicleByIdUseCase } from "@/features/vehicle/application/get-vehicle-by-id.usecase";
import { DeleteVehicleUseCase } from "@/features/vehicle/application/delete-vehicle.usecase";
import { DEFAULT_FLEET_VEHICLES } from "@/features/vehicle/ui/mock-vehicles";

class MockVehicleRepository implements IVehicleRepository {
  private vehicles: Map<string, Vehicle> = new Map();

  async findById(id: string): Promise<Vehicle | null> {
    return this.vehicles.get(id) || null;
  }

  async findAll(): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values());
  }

  async save(vehicle: Vehicle): Promise<Vehicle> {
    const id = vehicle.id || `mock-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const saved: Vehicle = {
      ...vehicle,
      id,
      updatedAt: new Date(),
    };
    this.vehicles.set(id, saved);
    return saved;
  }

  async delete(id: string): Promise<void> {
    this.vehicles.delete(id);
  }

  async saveTelemetry(log: TelemetryLog): Promise<TelemetryLog> {
    return log;
  }

  async getLatestTelemetry(): Promise<TelemetryLog | null> {
    return null;
  }

  async getHistory(): Promise<TelemetryLog[]> {
    return [];
  }
}

export async function runVehiclesManagementUnitTests(): Promise<boolean> {
  console.log("------------------------------------------");
  console.log("RUNNING VEHICLES MANAGEMENT UNIT TESTS");
  console.log("------------------------------------------");

  const repo = new MockVehicleRepository();
  const createUseCase = new CreateVehicleUseCase(repo);
  const updateUseCase = new UpdateVehicleUseCase(repo);
  const getByIdUseCase = new GetVehicleByIdUseCase(repo);
  const deleteUseCase = new DeleteVehicleUseCase(repo);

  // 1. Create Vehicle with Driver & Tenant Scope
  process.stdout.write("  [1/6] Testing Vehicle Creation with Driver & Normalization... ");
  const created = await createUseCase.execute({
    name: "Nagpur Express Alpha",
    licensePlate: "mh-31-fa-9999",
    status: "active",
    driverName: "Suresh Rao",
    organizationId: "org-test-123",
  });

  if (!created.id || created.licensePlate !== "MH-31-FA-9999") {
    throw new Error(`Vehicle license plate was not capitalized: ${created.licensePlate}`);
  }
  if (created.driverName !== "Suresh Rao" || created.organizationId !== "org-test-123") {
    throw new Error(`Vehicle driverName or organizationId not persisted properly`);
  }
  console.log("✓");

  // 2. Reject Invalid Vehicle Creation (empty fields)
  process.stdout.write("  [2/6] Testing Input Validation & Error Handling... ");
  try {
    await createUseCase.execute({ name: "", licensePlate: "MH-31-XX-1111" });
    throw new Error("Should have thrown error on empty vehicle name");
  } catch (err: any) {
    if (!err.message.includes("Vehicle name is required")) {
      throw err;
    }
  }

  try {
    await createUseCase.execute({ name: "Valid Name", licensePlate: "   " });
    throw new Error("Should have thrown error on empty license plate");
  } catch (err: any) {
    if (!err.message.includes("License plate is required")) {
      throw err;
    }
  }
  console.log("✓");

  // 3. Update Vehicle & Driver Details
  process.stdout.write("  [3/6] Testing Vehicle Updating & Driver Reassignment... ");
  const updated = await updateUseCase.execute(created.id, {
    name: "Nagpur Express Alpha (Upgraded)",
    driverName: "Dinesh Gaikwad",
    status: "maintenance",
  });

  if (updated.name !== "Nagpur Express Alpha (Upgraded)" || updated.driverName !== "Dinesh Gaikwad") {
    throw new Error("Vehicle name or driverName update failed");
  }
  if (updated.status !== "maintenance") {
    throw new Error(`Vehicle status update failed: ${updated.status}`);
  }
  console.log("✓");

  // 4. Retrieve by ID & Delete Vehicle
  process.stdout.write("  [4/6] Testing Retrieval & Deletion... ");
  const fetched = await getByIdUseCase.execute(created.id);
  if (!fetched || fetched.id !== created.id) {
    throw new Error("Failed to fetch vehicle by ID");
  }

  await deleteUseCase.execute(created.id);
  const afterDelete = await repo.findById(created.id);
  if (afterDelete !== null) {
    throw new Error("Vehicle should have been deleted");
  }

  try {
    await getByIdUseCase.execute(created.id);
    throw new Error("getByIdUseCase should throw NotFoundError after vehicle deletion");
  } catch (err: any) {
    if (!err.message.includes("not found")) throw err;
  }
  console.log("✓");

  // 5. KPI Metrics Aggregation Calculation
  process.stdout.write("  [5/6] Testing Fleet KPI Metrics Aggregation... ");
  const fleet = DEFAULT_FLEET_VEHICLES;
  let movingCount = 0;
  let idleCount = 0;
  let maintenanceCount = 0;
  let offlineCount = 0;

  for (const v of fleet) {
    if (v.status === "moving") movingCount++;
    else if (v.status === "idle") idleCount++;
    else if (v.status === "maintenance") maintenanceCount++;
    else offlineCount++;
  }

  const total = fleet.length;
  const utilization = Math.round(((movingCount + idleCount) / total) * 100);

  if (total < 6) {
    throw new Error(`Expected at least 6 initial vehicles, found ${total}`);
  }
  if (movingCount === 0 || idleCount === 0) {
    throw new Error("Expected both moving and idle vehicles in default fleet");
  }
  if (utilization <= 0 || utilization > 100) {
    throw new Error(`Invalid fleet utilization metric: ${utilization}%`);
  }
  console.log("✓");

  // 6. Search and Filter Algorithms
  process.stdout.write("  [6/6] Testing Search & Type Filtering Precision... ");
  const query = "MH-31";
  const matched = fleet.filter(
    (v) =>
      v.licensePlate.toLowerCase().includes(query.toLowerCase()) ||
      v.name.toLowerCase().includes(query.toLowerCase()),
  );

  if (matched.length === 0) {
    throw new Error(`Search for '${query}' should match Nagpur MH-31 registered vehicles`);
  }

  const haulers = fleet.filter((v) => v.type === "hauler");
  if (haulers.length === 0) {
    throw new Error("Expected at least one hauler in default fleet");
  }
  console.log("✓");

  console.log("✅ VEHICLES MANAGEMENT UNIT TESTS PASSED SUCCESSFULLY!");
  return true;
}
