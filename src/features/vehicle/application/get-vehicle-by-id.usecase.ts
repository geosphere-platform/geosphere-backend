import { IVehicleRepository } from "../domain/repository.interface";
import { Vehicle } from "../domain/entities";
import { NotFoundError } from "@/core/errors/errors";

export class GetVehicleByIdUseCase {
  constructor(private readonly vehicleRepository: IVehicleRepository) {}

  async execute(id: string): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findById(id);
    if (!vehicle) {
      throw new NotFoundError(`Vehicle with ID '${id}' not found`);
    }
    return vehicle;
  }
}
