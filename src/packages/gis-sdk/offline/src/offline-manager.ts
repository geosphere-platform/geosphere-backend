import { SDKEventEmitter } from "@gis-sdk/core";

export type NetworkState = "ONLINE" | "OFFLINE" | "RECONNECTING";

export interface CacheProvider {
  get<T = any>(key: string): Promise<T | null>;
  set<T = any>(key: string, value: T, ttlMs?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

export class MemoryCacheProvider implements CacheProvider {
  private cache: Map<string, { value: any; expiresAt?: number }> = new Map();

  public async get<T = any>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return item.value as T;
  }

  public async set<T = any>(
    key: string,
    value: T,
    ttlMs?: number,
  ): Promise<void> {
    const expiresAt = ttlMs ? Date.now() + ttlMs : undefined;
    this.cache.set(key, { value, expiresAt });
  }

  public async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  public async clear(): Promise<void> {
    this.cache.clear();
  }
}

export interface PendingOperation {
  id: string;
  type: string;
  payload: any;
  createdAt: string;
}

export class SyncManager {
  private queue: PendingOperation[] = [];
  private cacheProvider: CacheProvider;
  private syncInProgress: boolean = false;

  constructor(cacheProvider?: CacheProvider) {
    this.cacheProvider = cacheProvider || new MemoryCacheProvider();
  }

  public async enqueue(type: string, payload: any): Promise<PendingOperation> {
    const op: PendingOperation = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      payload,
      createdAt: new Date().toISOString(),
    };
    this.queue.push(op);
    await this.cacheProvider.set("pending_queue", this.queue);
    return op;
  }

  public getQueue(): PendingOperation[] {
    return [...this.queue];
  }

  public async sync(
    processor: (op: PendingOperation) => Promise<boolean>,
  ): Promise<{ success: number; failed: number }> {
    if (this.syncInProgress) return { success: 0, failed: 0 };
    this.syncInProgress = true;

    let success = 0;
    let failed = 0;
    const remaining: PendingOperation[] = [];

    for (const op of this.queue) {
      try {
        const ok = await processor(op);
        if (ok) {
          success++;
        } else {
          failed++;
          remaining.push(op);
        }
      } catch {
        failed++;
        remaining.push(op);
      }
    }

    this.queue = remaining;
    await this.cacheProvider.set("pending_queue", this.queue);
    this.syncInProgress = false;

    return { success, failed };
  }
}

export class OfflineSDK {
  private networkState: NetworkState = "ONLINE";
  private eventBus: SDKEventEmitter = new SDKEventEmitter();
  private cacheProvider: CacheProvider;
  private syncManager: SyncManager;

  constructor(cacheProvider?: CacheProvider) {
    this.cacheProvider = cacheProvider || new MemoryCacheProvider();
    this.syncManager = new SyncManager(this.cacheProvider);

    if (typeof window !== "undefined") {
      this.networkState = navigator.onLine ? "ONLINE" : "OFFLINE";
      window.addEventListener("online", () => this.setNetworkState("ONLINE"));
      window.addEventListener("offline", () => this.setNetworkState("OFFLINE"));
    }
  }

  public getNetworkState(): NetworkState {
    return this.networkState;
  }

  public setNetworkState(state: NetworkState): void {
    this.networkState = state;
    this.eventBus.emit("networkStateChange", state);
  }

  public onNetworkStateChange(cb: (state: NetworkState) => void): () => void {
    return this.eventBus.on("networkStateChange", cb);
  }

  public getCache(): CacheProvider {
    return this.cacheProvider;
  }

  public getSync(): SyncManager {
    return this.syncManager;
  }
}
