import { IVehicleRepository } from "../domain/repository.interface";
import { TelemetryLog } from "../domain/entities";
import { BadRequestError, NotFoundError } from "@/core/errors/errors";

export interface IngestTelemetryDTO {
  vehicleId: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  timestamp?: Date | string;
}

export class IngestTelemetryUseCase {
  constructor(private readonly vehicleRepository: IVehicleRepository) {}

  async execute(dto: IngestTelemetryDTO): Promise<TelemetryLog> {
    if (!dto.vehicleId) {
      throw new BadRequestError("Vehicle ID is required");
    }
    if (dto.latitude < -90 || dto.latitude > 90) {
      throw new BadRequestError("Latitude must be between -90 and 90 degrees");
    }
    if (dto.longitude < -180 || dto.longitude > 180) {
      throw new BadRequestError(
        "Longitude must be between -180 and 180 degrees",
      );
    }

    const vehicle = await this.vehicleRepository.findById(dto.vehicleId);
    if (!vehicle) {
      throw new NotFoundError(`Vehicle with ID '${dto.vehicleId}' not found`);
    }

    const log: TelemetryLog = {
      id: "",
      vehicleId: dto.vehicleId,
      latitude: dto.latitude,
      longitude: dto.longitude,
      speed: dto.speed ?? 0,
      heading: dto.heading ?? 0,
      timestamp: dto.timestamp ? new Date(dto.timestamp) : new Date(),
    };

    return this.vehicleRepository.saveTelemetry(log);
  }
}
