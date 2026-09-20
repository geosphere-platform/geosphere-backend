import { Coordinates } from "@gis-sdk/core";

export interface GeocodingResult {
  placeName: string;
  coordinates: Coordinates;
  bbox?: number[];
  properties?: Record<string, any>;
}

export interface GeocodingProvider {
  forwardGeocode(query: string): Promise<GeocodingResult[]>;
  reverseGeocode(coordinates: Coordinates): Promise<GeocodingResult[]>;
}

export class DefaultGeocodingProvider implements GeocodingProvider {
  public async forwardGeocode(query: string): Promise<GeocodingResult[]> {
    return [
      {
        placeName: `Geocoded Result for "${query}"`,
        coordinates: { latitude: 18.5204, longitude: 73.8567 },
        properties: { provider: "mock" },
      },
    ];
  }

  public async reverseGeocode(
    coordinates: Coordinates,
  ): Promise<GeocodingResult[]> {
    return [
      {
        placeName: `Location (${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)})`,
        coordinates,
        properties: { provider: "mock" },
      },
    ];
  }
}
