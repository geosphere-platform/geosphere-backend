import { env } from "@/core/config/env";

export interface RateLimitOptions {
  key: string; // e.g. "ip:127.0.0.1" or "api_key:ak_123" or "org:org_456"
  maxRequests?: number;
  windowMs?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTimeMs: number;
  retryAfterSeconds?: number;
}

interface BucketState {
  tokens: number;
  lastRefillAt: number;
}

export class RateLimiter {
  private static instance: RateLimiter;
  private memoryBuckets = new Map<string, BucketState>();
  private lastPruneAt = Date.now();
  private static readonly MAX_BUCKETS = 10000;
  private static readonly PRUNE_INTERVAL_MS = 60000; // 1 minute

  private constructor() {}

  public static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  /**
   * Periodically remove stale idle buckets to prevent memory leaks and OOM crashes
   */
  private pruneStale(now: number, windowMs: number): void {
    if (
      now - this.lastPruneAt < RateLimiter.PRUNE_INTERVAL_MS &&
      this.memoryBuckets.size < RateLimiter.MAX_BUCKETS
    ) {
      return;
    }

    this.lastPruneAt = now;

    // Prune buckets that have been idle longer than their window
    for (const [key, state] of this.memoryBuckets.entries()) {
      if (now - state.lastRefillAt > windowMs) {
        this.memoryBuckets.delete(key);
      }
    }

    // If still over capacity under extreme IP churn, evict oldest entries
    if (this.memoryBuckets.size >= RateLimiter.MAX_BUCKETS) {
      const keysToDrop = this.memoryBuckets.size - Math.floor(RateLimiter.MAX_BUCKETS * 0.8);
      let dropped = 0;
      for (const key of this.memoryBuckets.keys()) {
        this.memoryBuckets.delete(key);
        dropped++;
        if (dropped >= keysToDrop) break;
      }
    }
  }

  /**
   * Consume 1 token from key rate bucket using sliding-window refill
   */
  public consume(options: RateLimitOptions): RateLimitResult {
    const limit = options.maxRequests ?? env.RATE_LIMIT_REQUESTS_PER_MIN ?? 120;
    const windowMs = options.windowMs ?? env.RATE_LIMIT_WINDOW_MS ?? 60000;
    const now = Date.now();

    // Trigger maintenance sweep to bound memory footprint
    this.pruneStale(now, windowMs);

    let state = this.memoryBuckets.get(options.key);
    if (!state) {
      state = { tokens: limit, lastRefillAt: now };
      this.memoryBuckets.set(options.key, state);
    }

    // Calculate token refill based on elapsed time
    const elapsed = now - state.lastRefillAt;
    if (elapsed > windowMs) {
      state.tokens = limit;
      state.lastRefillAt = now;
    } else {
      const refillAmount = Math.floor((elapsed / windowMs) * limit);
      if (refillAmount > 0) {
        state.tokens = Math.min(limit, state.tokens + refillAmount);
        state.lastRefillAt = now;
      }
    }

    const resetTimeMs = state.lastRefillAt + windowMs;

    if (state.tokens > 0) {
      state.tokens -= 1;
      return {
        allowed: true,
        limit,
        remaining: state.tokens,
        resetTimeMs,
      };
    } else {
      const retryAfterSeconds = Math.ceil((resetTimeMs - now) / 1000);
      return {
        allowed: false,
        limit,
        remaining: 0,
        resetTimeMs,
        retryAfterSeconds: Math.max(1, retryAfterSeconds),
      };
    }
  }

  /**
   * Reset rate limit state for a key (admin utility)
   */
  public reset(key: string): void {
    this.memoryBuckets.delete(key);
  }

  /**
   * Clear all memory buckets
   */
  public clearAll(): void {
    this.memoryBuckets.clear();
  }
}

export const rateLimiter = RateLimiter.getInstance();
