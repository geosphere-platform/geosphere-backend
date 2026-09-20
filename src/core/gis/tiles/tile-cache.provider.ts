/**
 * Tile Cache Provider Abstraction — Phase 18 Advanced GIS Data Processing
 *
 * Provides HTTP ETag generation, conditional request validation, and caching
 * abstractions for vector tiles without introducing Redis.
 */

import { createHash } from "crypto";

export interface TileCacheEntry {
  etag: string;
  buffer: Buffer;
  contentLength: number;
  updatedAt: number;
}

export interface ITileCacheProvider {
  get(key: string): TileCacheEntry | null;
  set(key: string, buffer: Buffer, ttlSeconds?: number): TileCacheEntry;
  generateETag(buffer: Buffer): string;
  isNotModified(etag: string, ifNoneMatchHeader?: string | null): boolean;
}

export class InMemoryTileCacheProvider implements ITileCacheProvider {
  private cache: Map<string, { entry: TileCacheEntry; expiresAt: number }> =
    new Map();
  private maxEntries: number = 2000;

  constructor(maxEntries = 2000) {
    this.maxEntries = maxEntries;
  }

  public generateETag(buffer: Buffer): string {
    const hash = createHash("md5").update(buffer).digest("hex").slice(0, 16);
    return `W/"${hash}"`;
  }

  public isNotModified(
    etag: string,
    ifNoneMatchHeader?: string | null,
  ): boolean {
    if (!ifNoneMatchHeader) return false;
    const cleanHeader = ifNoneMatchHeader.trim();
    return (
      cleanHeader === etag || cleanHeader === "*" || cleanHeader.includes(etag)
    );
  }

  public get(key: string): TileCacheEntry | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.entry;
  }

  public set(key: string, buffer: Buffer, ttlSeconds = 300): TileCacheEntry {
    if (this.cache.size >= this.maxEntries) {
      // LRU evict oldest item
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    const etag = this.generateETag(buffer);
    const entry: TileCacheEntry = {
      etag,
      buffer,
      contentLength: buffer.length,
      updatedAt: Date.now(),
    };

    this.cache.set(key, {
      entry,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });

    return entry;
  }

  public clear(): void {
    this.cache.clear();
  }
}

export const tileCacheProvider = new InMemoryTileCacheProvider();
