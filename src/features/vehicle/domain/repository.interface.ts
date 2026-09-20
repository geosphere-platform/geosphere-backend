import { Vehicle, TelemetryLog } from "./entities";

export interface IVehicleRepository {
  findById(id: string): Promise<Vehicle | null>;
  findAll(): Promise<Vehicle[]>;
  save(vehicle: Vehicle): Promise<Vehicle>;
  delete(id: string): Promise<void>;

  // Telemetry logs
  saveTelemetry(log: TelemetryLog): Promise<TelemetryLog>;
  getLatestTelemetry(vehicleId: string): Promise<TelemetryLog | null>;
  getHistory(vehicleId: string, from: Date, to: Date): Promise<TelemetryLog[]>;
}
