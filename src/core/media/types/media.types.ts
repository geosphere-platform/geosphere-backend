/**
 * GeoSphere Core Media Engine — Framework-Independent Domain Models
 *
 * Defines pure TypeScript models for media attachments, media metadata (MIME type, size, EXIF coordinates),
 * chunked upload sessions, upload progress, storage results, and typed errors.
 *
 * MUST NOT depend on React, Next.js, OpenLayers, Android/iOS UI, database ORMs, or vehicle PII.
 */

import { Coordinate } from "../../gis/types/geometry";

export type MediaType = "image" | "video" | "audio" | "document" | "signature";

export interface MediaMetadata {
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  durationSeconds?: number;
  exifCoordinate?: Coordinate; // [longitude, latitude] extracted from camera metadata
  capturedAt?: string; // ISO 8601 UTC
}

export interface MediaAttachment {
  id: string;
  filename: string;
  mediaType: MediaType;
  metadata: MediaMetadata;
  storageKey: string;
  publicUrl?: string;
  boundEntityId?: string; // e.g. FormSubmission ID or Task ID
  boundEntityType?: "form_submission" | "task" | "inspection" | "generic";
  createdAt: string; // ISO 8601 UTC
  customMetadata?: Record<string, unknown>;
}

export interface ChunkedUploadSession {
  sessionId: string;
  filename: string;
  totalSizeBytes: number;
  chunkSizeBytes: number;
  totalChunks: number;
  uploadedChunkIndices: number[];
  isCompleted: boolean;
  createdAt: string; // ISO 8601 UTC
}

export interface ChunkedUploadProgress {
  sessionId: string;
  uploadedBytes: number;
  totalBytes: number;
  percentage: number;
  currentChunkIndex: number;
  totalChunks: number;
}

export interface MediaUploadResult {
  attachment: MediaAttachment;
  storageKey: string;
  publicUrl?: string;
}

export type MediaErrorCode =
  | "INVALID_FILE_HEADER"
  | "FILE_TOO_LARGE"
  | "UNSUPPORTED_MIME_TYPE"
  | "CHUNK_OUT_OF_BOUNDS"
  | "SESSION_NOT_FOUND"
  | "STORAGE_ERROR";

export class MediaError extends Error {
  constructor(
    public readonly code: MediaErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(`[MEDIA_ERROR:${code}] ${message}`);
    this.name = "MediaError";
  }
}

export type MediaProgressListener = (progress: ChunkedUploadProgress) => void;
