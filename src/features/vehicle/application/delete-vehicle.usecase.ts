import { IVehicleRepository } from "../domain/repository.interface";
import { NotFoundError } from "@/core/errors/errors";

export class DeleteVehicleUseCase {
  constructor(private readonly vehicleRepository: IVehicleRepository) {}

  async execute(id: string): Promise<void> {
    const existing = await this.vehicleRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(`Vehicle with ID '${id}' not found`);
    }
    await this.vehicleRepository.delete(id);
  }
}
