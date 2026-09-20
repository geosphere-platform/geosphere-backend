/**
 * Framework-Independent Geofence Repository Abstraction
 *
 * Defines the interface for querying and persisting active Geofence definitions.
 * Provides a pure in-memory repository implementation for headless execution and unit tests.
 */

import { Geofence } from "../types/geofence.types";

export interface IGeofenceRepository {
  addGeofence(geofence: Geofence): Promise<void>;
  getGeofence(id: string): Promise<Geofence | null>;
  listActiveGeofences(): Promise<Geofence[]>;
  removeGeofence(id: string): Promise<boolean>;
  clear(): Promise<void>;
}

export class InMemoryGeofenceRepository implements IGeofenceRepository {
  private readonly geofences = new Map<string, Geofence>();

  async addGeofence(geofence: Geofence): Promise<void> {
    this.geofences.set(geofence.id, { ...geofence });
  }

  async getGeofence(id: string): Promise<Geofence | null> {
    const gf = this.geofences.get(id);
    return gf ? { ...gf } : null;
  }

  async listActiveGeofences(): Promise<Geofence[]> {
    return Array.from(this.geofences.values())
      .filter((gf) => gf.enabled)
      .map((gf) => ({ ...gf }));
  }

  async removeGeofence(id: string): Promise<boolean> {
    return this.geofences.delete(id);
  }

  async clear(): Promise<void> {
    this.geofences.clear();
  }
}
