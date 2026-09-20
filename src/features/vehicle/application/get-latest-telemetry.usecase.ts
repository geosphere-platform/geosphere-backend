import { IVehicleRepository } from "../domain/repository.interface";
import { Vehicle, TelemetryLog } from "../domain/entities";

export interface LiveVehicleStatus {
  vehicle: Vehicle;
  latestTelemetry: TelemetryLog | null;
}

export class GetLatestTelemetryUseCase {
  constructor(private readonly vehicleRepository: IVehicleRepository) {}

  async executeAll(): Promise<LiveVehicleStatus[]> {
    const vehicles = await this.vehicleRepository.findAll();

    const results: LiveVehicleStatus[] = await Promise.all(
      vehicles.map(async (vehicle) => {
        const latestTelemetry = await this.vehicleRepository.getLatestTelemetry(
          vehicle.id,
        );
        return { vehicle, latestTelemetry };
      }),
    );

    return results;
  }
}
