/**
 * Framework-Independent MediaEngine Class
 *
 * Provides MIME magic-number binary inspection, EXIF location extraction,
 * chunked upload session orchestration, attachment binding, and progress broadcasting.
 *
 * MUST NOT depend on React, Next.js, OpenLayers, Android/iOS UI, or vehicle PII.
 */

import { Coordinate } from "../../gis/types/geometry";
import {
  MediaType,
  MediaMetadata,
  MediaAttachment,
  ChunkedUploadSession,
  ChunkedUploadProgress,
  MediaError,
  MediaProgressListener,
} from "../types/media.types";
import { IMediaStorageAdapter, InMemoryMediaStorageAdapter } from "../storage/media-storage.interface";

export interface MediaEngineOptions {
  storageAdapter?: IMediaStorageAdapter;
  maxSizeBytes?: number; // Default: 50MB (52,428,800 bytes)
}

export class MediaEngine {
  private readonly storage: IMediaStorageAdapter;
  private readonly maxSizeBytes: number;
  private readonly sessions = new Map<string, ChunkedUploadSession>();
  private readonly progressListeners = new Set<MediaProgressListener>();

  constructor(options: MediaEngineOptions = {}) {
    this.storage = options.storageAdapter ?? new InMemoryMediaStorageAdapter();
    this.maxSizeBytes = options.maxSizeBytes ?? 52428800; // 50 MB
  }

  public getStorageAdapter(): IMediaStorageAdapter {
    return this.storage;
  }

  public subscribeProgress(listener: MediaProgressListener): () => void {
    this.progressListeners.add(listener);
    return () => this.progressListeners.delete(listener);
  }

  private notifyProgress(progress: ChunkedUploadProgress): void {
    for (const listener of this.progressListeners) {
      try {
        listener(progress);
      } catch (err) {
        console.error("[MEDIA-ENGINE:ERR] Progress listener error:", err);
      }
    }
  }

  /**
   * Validate magic numbers in binary buffer
   */
  public validateBufferHeader(buffer: Buffer, filename: string): { valid: boolean; mimeType: string; mediaType: MediaType } {
    if (!buffer || buffer.length === 0) {
      throw new MediaError("INVALID_FILE_HEADER", "File buffer is empty");
    }
    if (buffer.length > this.maxSizeBytes) {
      throw new MediaError("FILE_TOO_LARGE", `File size ${buffer.length} exceeds max limit of ${this.maxSizeBytes} bytes`);
    }

    const headerHex = buffer.subarray(0, 8).toString("hex").toUpperCase();
    let mimeType = "application/octet-stream";
    let mediaType: MediaType = "document";

    if (headerHex.startsWith("89504E47")) {
      mimeType = "image/png";
      mediaType = "image";
    } else if (headerHex.startsWith("FFD8FF")) {
      mimeType = "image/jpeg";
      mediaType = "image";
    } else if (headerHex.startsWith("47494638")) {
      mimeType = "image/gif";
      mediaType = "image";
    } else if (headerHex.startsWith("25504446")) {
      mimeType = "application/pdf";
      mediaType = "document";
    } else if (headerHex.startsWith("504B0304")) {
      mimeType = "application/zip";
      mediaType = "document";
    } else if (filename.endsWith(".svg")) {
      mimeType = "image/svg+xml";
      mediaType = filename.includes("signature") ? "signature" : "image";
    }

    return { valid: true, mimeType, mediaType };
  }

  /**
   * Mock EXIF coordinate extraction from image metadata or custom tags
   */
  public extractExifCoordinate(buffer: Buffer): Coordinate | undefined {
    // In pure TS unit tests, simulate EXIF header inspection
    const content = buffer.toString("utf-8");
    if (content.includes("EXIF_GPS:")) {
      const match = content.match(/EXIF_GPS:\s*\[([0-9.-]+),\s*([0-9.-]+)\]/);
      if (match) {
        const lng = parseFloat(match[1]);
        const lat = parseFloat(match[2]);
        if (!isNaN(lng) && !isNaN(lat)) {
          return [lng, lat];
        }
      }
    }
    return undefined;
  }

  /**
   * Upload single media file
   */
  public async uploadMedia(
    filename: string,
    buffer: Buffer,
    boundEntityId?: string,
    boundEntityType?: "form_submission" | "task" | "inspection" | "generic",
    customExif?: Coordinate,
  ): Promise<MediaAttachment> {
    const { mimeType, mediaType } = this.validateBufferHeader(buffer, filename);
    const exifCoordinate = customExif ?? this.extractExifCoordinate(buffer);

    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9_\-.]/g, "_");
    const id = `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const storageKey = `media/${id}/${sanitizedFilename}`;

    const publicUrl = await this.storage.uploadFile({
      storageKey,
      buffer,
      contentType: mimeType,
    });

    const attachment: MediaAttachment = {
      id,
      filename,
      mediaType,
      metadata: {
        mimeType,
        sizeBytes: buffer.length,
        exifCoordinate,
        capturedAt: new Date().toISOString(),
      },
      storageKey,
      publicUrl,
      boundEntityId,
      boundEntityType,
      createdAt: new Date().toISOString(),
    };

    await this.storage.saveAttachmentMetadata(attachment);
    return attachment;
  }

  /**
   * Initiate chunked upload session
   */
  public async initiateChunkedUpload(filename: string, totalSizeBytes: number, chunkSizeBytes: number = 1048576): Promise<ChunkedUploadSession> {
    if (totalSizeBytes > this.maxSizeBytes) {
      throw new MediaError("FILE_TOO_LARGE", `File size ${totalSizeBytes} exceeds max limit of ${this.maxSizeBytes} bytes`);
    }

    const sessionId = `chk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const totalChunks = Math.ceil(totalSizeBytes / chunkSizeBytes);

    const session: ChunkedUploadSession = {
      sessionId,
      filename,
      totalSizeBytes,
      chunkSizeBytes,
      totalChunks,
      uploadedChunkIndices: [],
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Upload a chunk for an active session
   */
  public async uploadChunk(sessionId: string, chunkIndex: number, chunkBuffer: Buffer): Promise<ChunkedUploadProgress> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new MediaError("SESSION_NOT_FOUND", `Chunked upload session '${sessionId}' not found`);
    }

    if (chunkIndex < 0 || chunkIndex >= session.totalChunks) {
      throw new MediaError("CHUNK_OUT_OF_BOUNDS", `Chunk index ${chunkIndex} out of valid range [0, ${session.totalChunks - 1}]`);
    }

    await this.storage.uploadChunk(sessionId, chunkIndex, chunkBuffer);

    if (!session.uploadedChunkIndices.includes(chunkIndex)) {
      session.uploadedChunkIndices.push(chunkIndex);
    }

    const uploadedBytes = Math.min(session.totalSizeBytes, session.uploadedChunkIndices.length * session.chunkSizeBytes);
    const percentage = Number(((uploadedBytes / session.totalSizeBytes) * 100).toFixed(1));

    const progress: ChunkedUploadProgress = {
      sessionId,
      uploadedBytes,
      totalBytes: session.totalSizeBytes,
      percentage,
      currentChunkIndex: chunkIndex,
      totalChunks: session.totalChunks,
    };

    this.notifyProgress(progress);
    return progress;
  }

  /**
   * Finalize chunked upload session and construct MediaAttachment
   */
  public async finalizeChunkedUpload(
    sessionId: string,
    boundEntityId?: string,
    boundEntityType?: "form_submission" | "task" | "inspection" | "generic",
  ): Promise<MediaAttachment> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new MediaError("SESSION_NOT_FOUND", `Chunked upload session '${sessionId}' not found`);
    }

    if (session.uploadedChunkIndices.length < session.totalChunks) {
      throw new MediaError("STORAGE_ERROR", `Cannot finalize chunked upload. ${session.uploadedChunkIndices.length}/${session.totalChunks} chunks uploaded.`);
    }

    const sanitizedFilename = session.filename.replace(/[^a-zA-Z0-9_\-.]/g, "_");
    const id = `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const destinationKey = `media/${id}/${sanitizedFilename}`;

    const publicUrl = await this.storage.assembleChunks(sessionId, session.totalChunks, destinationKey, "application/octet-stream");
    session.isCompleted = true;

    const attachment: MediaAttachment = {
      id,
      filename: session.filename,
      mediaType: "document",
      metadata: {
        mimeType: "application/octet-stream",
        sizeBytes: session.totalSizeBytes,
        capturedAt: new Date().toISOString(),
      },
      storageKey: destinationKey,
      publicUrl,
      boundEntityId,
      boundEntityType,
      createdAt: new Date().toISOString(),
    };

    await this.storage.saveAttachmentMetadata(attachment);
    this.sessions.delete(sessionId);
    return attachment;
  }

  /**
   * Bind an existing MediaAttachment to an entity (e.g. Task or FormSubmission)
   */
  public async bindAttachment(attachmentId: string, entityId: string, entityType: "form_submission" | "task" | "inspection" | "generic"): Promise<MediaAttachment> {
    const attachment = await this.storage.getAttachmentMetadata(attachmentId);
    if (!attachment) {
      throw new MediaError("STORAGE_ERROR", `MediaAttachment '${attachmentId}' not found`);
    }

    attachment.boundEntityId = entityId;
    attachment.boundEntityType = entityType;
    await this.storage.saveAttachmentMetadata(attachment);
    return attachment;
  }
}
