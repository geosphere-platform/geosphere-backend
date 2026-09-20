/**
 * Framework-Independent Media Storage Adapter Abstraction
 *
 * Defines the contract for uploading, retrieving, and deleting media files and chunked payloads.
 * Includes an InMemoryMediaStorageAdapter for headless testing and unit tests.
 */

import { MediaAttachment } from "../types/media.types";

export interface UploadOptions {
  storageKey: string;
  buffer: Buffer;
  contentType: string;
  isPrivate?: boolean;
}

export interface IMediaStorageAdapter {
  uploadFile(options: UploadOptions): Promise<string>; // Returns storage key or URL
  uploadChunk(sessionId: string, chunkIndex: number, chunkBuffer: Buffer): Promise<void>;
  assembleChunks(sessionId: string, totalChunks: number, destinationKey: string, contentType: string): Promise<string>;
  getDownloadUrl(storageKey: string, expiresInSeconds?: number): Promise<string>;
  deleteFile(storageKey: string): Promise<void>;
  saveAttachmentMetadata(attachment: MediaAttachment): Promise<void>;
  getAttachmentMetadata(id: string): Promise<MediaAttachment | null>;
  listAttachments(boundEntityId?: string): Promise<MediaAttachment[]>;
}

export class InMemoryMediaStorageAdapter implements IMediaStorageAdapter {
  private readonly files = new Map<string, Buffer>();
  private readonly chunkSessions = new Map<string, Map<number, Buffer>>();
  private readonly metadataMap = new Map<string, MediaAttachment>();

  async uploadFile(options: UploadOptions): Promise<string> {
    this.files.set(options.storageKey, Buffer.from(options.buffer));
    return `memory://${options.storageKey}`;
  }

  async uploadChunk(sessionId: string, chunkIndex: number, chunkBuffer: Buffer): Promise<void> {
    if (!this.chunkSessions.has(sessionId)) {
      this.chunkSessions.set(sessionId, new Map<number, Buffer>());
    }
    const sessionChunks = this.chunkSessions.get(sessionId)!;
    sessionChunks.set(chunkIndex, Buffer.from(chunkBuffer));
  }

  async assembleChunks(sessionId: string, totalChunks: number, destinationKey: string, contentType: string): Promise<string> {
    const sessionChunks = this.chunkSessions.get(sessionId);
    if (!sessionChunks) {
      throw new Error(`Chunked session '${sessionId}' not found`);
    }

    const buffers: Buffer[] = [];
    for (let i = 0; i < totalChunks; i++) {
      const chunk = sessionChunks.get(i);
      if (!chunk) {
        throw new Error(`Missing chunk index ${i} for session '${sessionId}'`);
      }
      buffers.push(chunk);
    }

    const assembledBuffer = Buffer.concat(buffers);
    await this.uploadFile({ storageKey: destinationKey, buffer: assembledBuffer, contentType });
    this.chunkSessions.delete(sessionId);
    return `memory://${destinationKey}`;
  }

  async getDownloadUrl(storageKey: string): Promise<string> {
    if (!this.files.has(storageKey)) {
      throw new Error(`File '${storageKey}' not found in storage`);
    }
    return `https://storage.geosphere.local/${storageKey}`;
  }

  async deleteFile(storageKey: string): Promise<void> {
    this.files.delete(storageKey);
  }

  async saveAttachmentMetadata(attachment: MediaAttachment): Promise<void> {
    this.metadataMap.set(attachment.id, { ...attachment });
  }

  async getAttachmentMetadata(id: string): Promise<MediaAttachment | null> {
    const a = this.metadataMap.get(id);
    return a ? { ...a } : null;
  }

  async listAttachments(boundEntityId?: string): Promise<MediaAttachment[]> {
    const all = Array.from(this.metadataMap.values());
    if (!boundEntityId) return all.map((a) => ({ ...a }));
    return all.filter((a) => a.boundEntityId === boundEntityId).map((a) => ({ ...a }));
  }

  public getFileBuffer(storageKey: string): Buffer | undefined {
    return this.files.get(storageKey);
  }
}
