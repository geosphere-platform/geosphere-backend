import { eq, and, gte, lte, desc } from "drizzle-orm";
import { IVehicleRepository } from "../domain/repository.interface";
import { Vehicle, TelemetryLog } from "../domain/entities";
import { DatabaseClient } from "@/database";
import {
  vehiclesTable,
  vehicleTelemetryTable,
} from "@/database/schema/vehicle";

export class DrizzleVehicleRepository implements IVehicleRepository {
  constructor(private readonly db: DatabaseClient) {}

  async findById(id: string): Promise<Vehicle | null> {
    const rows = await this.db
      .select()
      .from(vehiclesTable)
      .where(eq(vehiclesTable.id, id))
      .limit(1);

    if (rows.length === 0) return null;
    const row = rows[0];

    return {
      id: row.id,
      name: row.name,
      licensePlate: row.licensePlate,
      status: row.status as Vehicle["status"],
      driverName: row.driverName,
      organizationId: row.organizationId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async findAll(): Promise<Vehicle[]> {
    const rows = await this.db.select().from(vehiclesTable);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      licensePlate: row.licensePlate,
      status: row.status as Vehicle["status"],
      driverName: row.driverName,
      organizationId: row.organizationId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }

  async save(vehicle: Vehicle): Promise<Vehicle> {
    const existing = await this.findById(vehicle.id);

    if (existing) {
      const [updated] = await this.db
        .update(vehiclesTable)
        .set({
          name: vehicle.name,
          licensePlate: vehicle.licensePlate,
          status: vehicle.status,
          driverName: vehicle.driverName !== undefined ? vehicle.driverName : undefined,
          organizationId: vehicle.organizationId !== undefined ? vehicle.organizationId : undefined,
          updatedAt: new Date(),
        })
        .where(eq(vehiclesTable.id, vehicle.id))
        .returning();

      return {
        id: updated.id,
        name: updated.name,
        licensePlate: updated.licensePlate,
        status: updated.status as Vehicle["status"],
        driverName: updated.driverName,
        organizationId: updated.organizationId,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      };
    } else {
      const [inserted] = await this.db
        .insert(vehiclesTable)
        .values({
          id: vehicle.id || undefined,
          name: vehicle.name,
          licensePlate: vehicle.licensePlate,
          status: vehicle.status,
          driverName: vehicle.driverName,
          organizationId: vehicle.organizationId,
        })
        .returning();

      return {
        id: inserted.id,
        name: inserted.name,
        licensePlate: inserted.licensePlate,
        status: inserted.status as Vehicle["status"],
        driverName: inserted.driverName,
        organizationId: inserted.organizationId,
        createdAt: inserted.createdAt,
        updatedAt: inserted.updatedAt,
      };
    }
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(vehiclesTable).where(eq(vehiclesTable.id, id));
  }

  async saveTelemetry(log: TelemetryLog): Promise<TelemetryLog> {
    const [inserted] = await this.db
      .insert(vehicleTelemetryTable)
      .values({
        vehicleId: log.vehicleId,
        latitude: log.latitude,
        longitude: log.longitude,
        speed: log.speed,
        heading: log.heading,
        recordedAt: log.timestamp || new Date(),
      })
      .returning();

    return {
      id: inserted.id,
      vehicleId: inserted.vehicleId,
      latitude: inserted.latitude,
      longitude: inserted.longitude,
      speed: inserted.speed,
      heading: inserted.heading,
      timestamp: inserted.recordedAt,
    };
  }

  async getLatestTelemetry(vehicleId: string): Promise<TelemetryLog | null> {
    const rows = await this.db
      .select()
      .from(vehicleTelemetryTable)
      .where(eq(vehicleTelemetryTable.vehicleId, vehicleId))
      .orderBy(desc(vehicleTelemetryTable.recordedAt))
      .limit(1);

    if (rows.length === 0) return null;
    const row = rows[0];

    return {
      id: row.id,
      vehicleId: row.vehicleId,
      latitude: row.latitude,
      longitude: row.longitude,
      speed: row.speed,
      heading: row.heading,
      timestamp: row.recordedAt,
    };
  }

  async getHistory(
    vehicleId: string,
    from: Date,
    to: Date,
  ): Promise<TelemetryLog[]> {
    const rows = await this.db
      .select()
      .from(vehicleTelemetryTable)
      .where(
        and(
          eq(vehicleTelemetryTable.vehicleId, vehicleId),
          gte(vehicleTelemetryTable.recordedAt, from),
          lte(vehicleTelemetryTable.recordedAt, to),
        ),
      )
      .orderBy(vehicleTelemetryTable.recordedAt);

    return rows.map((row) => ({
      id: row.id,
      vehicleId: row.vehicleId,
      latitude: row.latitude,
      longitude: row.longitude,
      speed: row.speed,
      heading: row.heading,
      timestamp: row.recordedAt,
    }));
  }
}
