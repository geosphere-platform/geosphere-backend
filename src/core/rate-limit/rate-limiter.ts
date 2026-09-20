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

  private constructor() {}

  public static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  /**
   * Consume 1 token from key rate bucket using sliding-window refill
   */
  public consume(options: RateLimitOptions): RateLimitResult {
    const limit = options.maxRequests ?? env.RATE_LIMIT_REQUESTS_PER_MIN ?? 120;
    const windowMs = options.windowMs ?? env.RATE_LIMIT_WINDOW_MS ?? 60000;
    const now = Date.now();

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
