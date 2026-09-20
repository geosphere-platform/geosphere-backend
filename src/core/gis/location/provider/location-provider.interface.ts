/**
 * Framework-Independent Location Provider & Permission Abstraction Contracts
 *
 * Separates generic location acquisition contracts from specific native or browser APIs.
 */

import {
  Location,
  LocationError,
  LocationPermissionState,
  LocationSamplingOptions,
} from "../types/location.types";

export interface ILocationPermissionAdapter {
  checkPermission(): Promise<LocationPermissionState>;
  requestPermission(): Promise<LocationPermissionState>;
}

export interface ILocationProvider {
  readonly name: string;
  readonly isAvailable: boolean;
  getCurrentLocation(options?: LocationSamplingOptions): Promise<Location>;
  startListening(
    onLocation: (location: Location) => void,
    onError?: (error: LocationError) => void,
    options?: LocationSamplingOptions
  ): void;
  stopListening(): void;
}
