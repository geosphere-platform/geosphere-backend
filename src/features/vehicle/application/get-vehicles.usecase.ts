import { IVehicleRepository } from "../domain/repository.interface";
import { Vehicle } from "../domain/entities";

export class GetVehiclesUseCase {
  constructor(private readonly vehicleRepository: IVehicleRepository) {}

  async execute(): Promise<Vehicle[]> {
    return this.vehicleRepository.findAll();
  }
}
