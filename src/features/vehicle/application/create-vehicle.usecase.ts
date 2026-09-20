import { IVehicleRepository } from "../domain/repository.interface";
import { Vehicle } from "../domain/entities";
import { BadRequestError } from "@/core/errors/errors";

export interface CreateVehicleDTO {
  name: string;
  licensePlate: string;
  status?: "active" | "inactive" | "maintenance" | "moving" | "idle" | "stopped" | "offline";
  driverName?: string | null;
  organizationId?: string | null;
}

export class CreateVehicleUseCase {
  constructor(private readonly vehicleRepository: IVehicleRepository) {}

  async execute(dto: CreateVehicleDTO): Promise<Vehicle> {
    if (!dto.name || dto.name.trim().length === 0) {
      throw new BadRequestError("Vehicle name is required");
    }
    if (!dto.licensePlate || dto.licensePlate.trim().length === 0) {
      throw new BadRequestError("License plate is required");
    }

    const newVehicle: Vehicle = {
      id: "", // database generates UUID if empty
      name: dto.name.trim(),
      licensePlate: dto.licensePlate.trim().toUpperCase(),
      status: dto.status ?? "active",
      driverName: dto.driverName?.trim() ?? null,
      organizationId: dto.organizationId ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.vehicleRepository.save(newVehicle);
  }
}
