/**
 * Pre-Built GeoSphere Vertical Industry Application Templates Entrypoint
 *
 * Exports ready-to-use application configuration templates across all 7 industry verticals:
 * 1. Fleet & Asset Tracking Pro (fleetTemplate)
 * 2. Field Force Operations Suite (fieldForceTemplate)
 * 3. Last-Mile Delivery Express (deliveryTemplate)
 * 4. Smart Agriculture Crop Scout (agricultureTemplate)
 * 5. Utilities Pipeline Inspector (utilitiesTemplate)
 * 6. Emergency Incident Dispatch (emergencyTemplate)
 * 7. Facility Guard Security Patrol (securityTemplate)
 */

export * from "./fleet-template";
export * from "./field-force-template";
export * from "./delivery-template";
export * from "./agriculture-template";
export * from "./utilities-template";
export * from "./emergency-template";
export * from "./security-template";

import { fleetTemplate } from "./fleet-template";
import { fieldForceTemplate } from "./field-force-template";
import { deliveryTemplate } from "./delivery-template";
import { agricultureTemplate } from "./agriculture-template";
import { utilitiesTemplate } from "./utilities-template";
import { emergencyTemplate } from "./emergency-template";
import { securityTemplate } from "./security-template";
import { ApplicationConfig } from "../builder/types/builder.types";

export const VerticalTemplates: Record<string, Partial<ApplicationConfig>> = {
  fleet: fleetTemplate,
  fieldForce: fieldForceTemplate,
  delivery: deliveryTemplate,
  agriculture: agricultureTemplate,
  utilities: utilitiesTemplate,
  emergency: emergencyTemplate,
  security: securityTemplate,
};
