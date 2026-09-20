/**
 * Phase 18 GIS SDK Business Models Examples
 *
 * Demonstrates that the GIS SDK & Vector Tile Engine are 100% generic
 * and support all 12 commercial GIS business models without industry lock-in.
 */

import { GISMap } from "../map/src/map-facade";

export const IndustryGisExamples = {
  // 1. Fleet & Vehicle Tracking
  fleetTracking: (map: GISMap) => {
    map.createVectorTileLayer(
      "vehicle_positions",
      "/api/v1/tiles/vehicle_positions/{z}/{x}/{y}",
    );
  },

  // 2. Logistics & Delivery
  logisticsDelivery: (map: GISMap) => {
    map.createVectorTileLayer(
      "delivery_zones",
      "/api/v1/tiles/delivery_zones/{z}/{x}/{y}",
    );
    map.createVectorTileLayer(
      "active_couriers",
      "/api/v1/tiles/active_couriers/{z}/{x}/{y}",
    );
  },

  // 3. Field Service Management
  fieldService: (map: GISMap) => {
    map.createVectorTileLayer(
      "work_order_locations",
      "/api/v1/tiles/work_orders/{z}/{x}/{y}",
    );
  },

  // 4. Agriculture & Precision Farming
  agricultureFarming: (map: GISMap) => {
    map.createVectorTileLayer(
      "crop_parcels",
      "/api/v1/tiles/crop_parcels/{z}/{x}/{y}",
    );
    map.createVectorTileLayer(
      "soil_moisture_grids",
      "/api/v1/tiles/soil_moisture/{z}/{x}/{y}",
    );
  },

  // 5. Utility & Infrastructure Management
  utilityInfrastructure: (map: GISMap) => {
    map.createVectorTileLayer(
      "water_pipelines",
      "/api/v1/tiles/water_pipelines/{z}/{x}/{y}",
    );
    map.createVectorTileLayer(
      "electric_substations",
      "/api/v1/tiles/electric_substations/{z}/{x}/{y}",
    );
  },

  // 6. Construction & Infrastructure
  constructionSite: (map: GISMap) => {
    map.createVectorTileLayer(
      "site_boundaries",
      "/api/v1/tiles/site_boundaries/{z}/{x}/{y}",
    );
  },

  // 7. Real Estate & Property GIS
  realEstateProperty: (map: GISMap) => {
    map.createVectorTileLayer(
      "land_parcels",
      "/api/v1/tiles/land_parcels/{z}/{x}/{y}",
    );
  },

  // 8. Public Safety & Emergency Management
  emergencyManagement: (map: GISMap) => {
    map.createVectorTileLayer(
      "incident_hotspots",
      "/api/v1/tiles/incidents/{z}/{x}/{y}",
    );
  },

  // 9. Telecom Network GIS
  telecomNetwork: (map: GISMap) => {
    map.createVectorTileLayer(
      "cell_towers",
      "/api/v1/tiles/cell_towers/{z}/{x}/{y}",
    );
    map.createVectorTileLayer(
      "fiber_lines",
      "/api/v1/tiles/fiber_lines/{z}/{x}/{y}",
    );
  },

  // 10. Retail & Location Intelligence
  retailIntelligence: (map: GISMap) => {
    map.createVectorTileLayer(
      "trade_areas",
      "/api/v1/tiles/trade_areas/{z}/{x}/{y}",
    );
  },

  // 11. Tourism & Travel GIS
  tourismTravel: (map: GISMap) => {
    map.createVectorTileLayer(
      "poi_locations",
      "/api/v1/tiles/poi_locations/{z}/{x}/{y}",
    );
  },

  // 12. Environment & Smart City
  environmentSmartCity: (map: GISMap) => {
    map.createVectorTileLayer(
      "air_quality_sensors",
      "/api/v1/tiles/air_quality/{z}/{x}/{y}",
    );
  },
};
