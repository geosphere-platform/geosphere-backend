/**
 * GIS Map SDK — Generic MapPopup Overlay
 */

import { Coordinate } from "../types";

export interface IPopupAdapter {
  open(coordinate: Coordinate, content: HTMLElement | string): void;
  close(): void;
  setPosition(coordinate: Coordinate | undefined): void;
}

export class MapPopup {
  private adapter: IPopupAdapter;
  private isOpen: boolean = false;
  private currentCoordinate: Coordinate | null = null;

  constructor(adapter: IPopupAdapter) {
    this.adapter = adapter;
  }

  public open(coordinate: Coordinate, content: HTMLElement | string): void {
    this.currentCoordinate = coordinate;
    this.isOpen = true;
    this.adapter.open(coordinate, content);
  }

  public close(): void {
    this.isOpen = false;
    this.currentCoordinate = null;
    this.adapter.close();
  }

  public setPosition(coordinate: Coordinate | undefined): void {
    if (!coordinate) {
      this.close();
    } else {
      this.currentCoordinate = coordinate;
      this.adapter.setPosition(coordinate);
    }
  }

  public getIsOpen(): boolean {
    return this.isOpen;
  }

  public getCoordinate(): Coordinate | null {
    return this.currentCoordinate;
  }
}
