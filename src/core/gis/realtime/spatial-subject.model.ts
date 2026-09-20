/**
 * SpatialSubject — Generic Business-Agnostic Spatial Entity Model
 *
 * Represents any movable or stationary subject tracked in space:
 * vehicle, employee, asset, device, equipment, delivery, drone, field-agent, etc.
 */

export interface SpatialSubject {
  id: string;
  tenantId: string;
  type: string; // Configurable string type (vehicle, employee, asset, drone, device, delivery)
  externalId: string;
  name: string;
  metadata: Record<string, unknown>;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSpatialSubjectInput {
  tenantId: string;
  type: string;
  externalId: string;
  name: string;
  metadata?: Record<string, unknown>;
  active?: boolean;
}

export interface UpdateSpatialSubjectInput {
  name?: string;
  type?: string;
  metadata?: Record<string, unknown>;
  active?: boolean;
}
