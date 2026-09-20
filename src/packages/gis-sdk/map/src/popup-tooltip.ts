import { Coordinates } from "@gis-sdk/core";

export interface PopupOptions {
  id?: string;
  title?: string;
  content: string | HTMLElement;
  coordinates: Coordinates;
}

export interface TooltipOptions {
  content: string;
  coordinates: Coordinates;
}

export class PopupManager {
  private activePopup: PopupOptions | null = null;
  private listeners: Set<(popup: PopupOptions | null) => void> = new Set();

  public openPopup(options: PopupOptions): void {
    this.activePopup = options;
    this.notify();
  }

  public closePopup(): void {
    this.activePopup = null;
    this.notify();
  }

  public getActivePopup(): PopupOptions | null {
    return this.activePopup;
  }

  public onChange(cb: (popup: PopupOptions | null) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify(): void {
    this.listeners.forEach((cb) => cb(this.activePopup));
  }
}

export class TooltipManager {
  private activeTooltip: TooltipOptions | null = null;
  private listeners: Set<(tooltip: TooltipOptions | null) => void> = new Set();

  public showTooltip(options: TooltipOptions): void {
    this.activeTooltip = options;
    this.notify();
  }

  public hideTooltip(): void {
    this.activeTooltip = null;
    this.notify();
  }

  public getActiveTooltip(): TooltipOptions | null {
    return this.activeTooltip;
  }

  public onChange(cb: (tooltip: TooltipOptions | null) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify(): void {
    this.listeners.forEach((cb) => cb(this.activeTooltip));
  }
}
