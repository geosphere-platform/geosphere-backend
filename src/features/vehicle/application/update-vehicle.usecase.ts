import { IVehicleRepository } from "../domain/repository.interface";
import { Vehicle } from "../domain/entities";
import { NotFoundError } from "@/core/errors/errors";

export interface UpdateVehicleDTO {
  name?: string;
  licensePlate?: string;
  status?: "active" | "inactive" | "maintenance" | "moving" | "idle" | "stopped" | "offline";
  driverName?: string | null;
}

export class UpdateVehicleUseCase {
  constructor(private readonly vehicleRepository: IVehicleRepository) {}

  async execute(id: string, dto: UpdateVehicleDTO): Promise<Vehicle> {
    const existing = await this.vehicleRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Vehicle with ID '${id}' not found`);
    }

    const updatedVehicle: Vehicle = {
      ...existing,
      name: dto.name?.trim() ?? existing.name,
      licensePlate:
        dto.licensePlate?.trim().toUpperCase() ?? existing.licensePlate,
      status: dto.status ?? existing.status,
      driverName:
        dto.driverName !== undefined ? (dto.driverName ? dto.driverName.trim() : null) : existing.driverName,
      updatedAt: new Date(),
    };

    return this.vehicleRepository.save(updatedVehicle);
  }
}
