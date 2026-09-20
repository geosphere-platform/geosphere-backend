export interface UploadFileOptions {
  key: string;
  buffer: Buffer;
  contentType: string;
  isPrivate?: boolean;
  metadata?: Record<string, string>;
}

export interface StoredFile {
  key: string;
  url: string;
  sizeBytes: number;
  contentType: string;
  isPrivate: boolean;
  uploadedAt: Date;
}

export interface ObjectStorageProvider {
  /**
   * Upload a file buffer to storage
   */
  uploadFile(options: UploadFileOptions): Promise<StoredFile>;

  /**
   * Get a stored file as a Buffer
   */
  getFile(key: string): Promise<Buffer | null>;

  /**
   * Delete a stored file by key
   */
  deleteFile(key: string): Promise<boolean>;

  /**
   * Generate a secure, time-limited URL for private file access
   */
  getSignedUrl(key: string, expiresSeconds?: number): Promise<string>;

  /**
   * Check if a file key exists in storage
   */
  exists(key: string): Promise<boolean>;
}
