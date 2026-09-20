import {
  GISSDK,
  ApiClient,
  SDKError,
  SDKErrorCode,
  SDKEventEmitter,
} from "@gis-sdk/core";

export interface LocationUpdate {
  entityId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
  speed?: number;
  heading?: number;
  altitude?: number;
  metadata?: Record<string, any>;
}

export class TrackingSDK {
  private apiClient: ApiClient;
  private eventBus: SDKEventEmitter = new SDKEventEmitter();
  private activeSubscriptions: Set<string> = new Set();
  private batchBuffer: LocationUpdate[] = [];
  private batchTimer: any = null;
  private batchSize: number = 10;
  private batchIntervalMs: number = 2000;

  constructor(apiClient?: ApiClient) {
    this.apiClient = apiClient || GISSDK.getInstance().getApiClient();
  }

  public validateLocationUpdate(update: LocationUpdate): void {
    if (!update.entityId) {
      throw new SDKError(
        SDKErrorCode.VALIDATION_ERROR,
        "Location update must contain an entityId",
      );
    }
    if (
      typeof update.latitude !== "number" ||
      isNaN(update.latitude) ||
      update.latitude < -90 ||
      update.latitude > 90
    ) {
      throw new SDKError(
        SDKErrorCode.VALIDATION_ERROR,
        `Invalid latitude value: ${update.latitude}`,
      );
    }
    if (
      typeof update.longitude !== "number" ||
      isNaN(update.longitude) ||
      update.longitude < -180 ||
      update.longitude > 180
    ) {
      throw new SDKError(
        SDKErrorCode.VALIDATION_ERROR,
        `Invalid longitude value: ${update.longitude}`,
      );
    }
  }

  public async sendLocationUpdate(update: LocationUpdate): Promise<void> {
    this.validateLocationUpdate(update);
    await this.apiClient.post("/api/v1/tracking/update", update);
    this.eventBus.emit("locationUpdated", update);
    if (update.entityId) {
      this.eventBus.emit(`entity:${update.entityId}`, update);
    }
  }

  public enqueueLocationUpdate(update: LocationUpdate): void {
    this.validateLocationUpdate(update);
    this.batchBuffer.push(update);
    if (this.batchBuffer.length >= this.batchSize) {
      this.flushBatch();
    } else if (!this.batchTimer) {
      this.batchTimer = setTimeout(
        () => this.flushBatch(),
        this.batchIntervalMs,
      );
    }
  }

  public async flushBatch(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    if (this.batchBuffer.length === 0) return;

    const itemsToSend = [...this.batchBuffer];
    this.batchBuffer = [];

    try {
      await this.apiClient.post("/api/v1/tracking/batch", {
        updates: itemsToSend,
      });
      itemsToSend.forEach((item) => {
        this.eventBus.emit("locationUpdated", item);
        if (item.entityId) {
          this.eventBus.emit(`entity:${item.entityId}`, item);
        }
      });
    } catch (err) {
      // Re-queue items on network error
      this.batchBuffer.unshift(...itemsToSend);
      throw err;
    }
  }

  public subscribeToEntity(
    entityId: string,
    callback: (update: LocationUpdate) => void,
  ): () => void {
    this.activeSubscriptions.add(entityId);
    const unbind = this.eventBus.on(`entity:${entityId}`, callback);

    return () => {
      unbind();
      this.activeSubscriptions.delete(entityId);
    };
  }

  public subscribeToWorkspace(
    callback: (update: LocationUpdate) => void,
  ): () => void {
    return this.eventBus.on("locationUpdated", callback);
  }

  public getActiveSubscriptions(): string[] {
    return Array.from(this.activeSubscriptions);
  }
}
