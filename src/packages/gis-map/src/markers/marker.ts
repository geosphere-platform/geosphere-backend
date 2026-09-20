/**
 * GIS Map SDK — Generic MapMarker
 */

import { MapMarker, MapFeature, PointGeometry } from "../types";
import { createMapFeature } from "../features/feature";

export function markerToFeature(marker: MapMarker): MapFeature {
  const pointGeom: PointGeometry = {
    type: "Point",
    coordinates: marker.coordinate,
  };

  return createMapFeature(
    marker.id,
    pointGeom,
    {
      title: marker.title,
      ...marker.metadata,
    },
    {
      iconUrl: marker.icon,
      iconScale: marker.scale ?? 1,
      iconRotation: marker.rotation ?? 0,
      label: marker.title,
      ...marker.style,
    },
  );
}
