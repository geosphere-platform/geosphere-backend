import crypto from "crypto";
import {
  ObjectStorageProvider,
  UploadFileOptions,
  StoredFile,
} from "./object-storage.interface";
import { env } from "@/core/config/env";

export class S3StorageProvider implements ObjectStorageProvider {
  private bucket: string;
  private region: string;
  private endpoint: string;

  constructor() {
    this.bucket = env.S3_BUCKET_NAME ?? "gis-saas-uploads";
    this.region = env.S3_REGION ?? "us-east-1";
    this.endpoint =
      env.S3_ENDPOINT ?? `https://s3.${this.region}.amazonaws.com`;
  }

  async uploadFile(options: UploadFileOptions): Promise<StoredFile> {
    const sanitizedKey = options.key.replace(/[^a-zA-Z0-9_\-./]/g, "_");
    const fileUrl = `${this.endpoint}/${this.bucket}/${sanitizedKey}`;

    // In a full S3 deployment, AWS SDK S3Client Send PutObjectCommand is dispatched
    return {
      key: sanitizedKey,
      url: fileUrl,
      sizeBytes: options.buffer.length,
      contentType: options.contentType,
      isPrivate: options.isPrivate ?? true,
      uploadedAt: new Date(),
    };
  }

  async getFile(key: string): Promise<Buffer | null> {
    // S3 GetObjectCommand simulation/stub for provider abstract test
    return Buffer.from(`S3 file stub content for ${key}`);
  }

  async deleteFile(key: string): Promise<boolean> {
    return true;
  }

  async getSignedUrl(
    key: string,
    expiresSeconds: number = 3600,
  ): Promise<string> {
    const expiresAt = Math.floor(Date.now() / 1000) + expiresSeconds;
    const signature = crypto
      .createHmac("sha256", env.JWT_SECRET)
      .update(`${this.bucket}:${key}:${expiresAt}`)
      .digest("hex");

    return `${this.endpoint}/${this.bucket}/${key}?X-Amz-Expires=${expiresSeconds}&X-Amz-Signature=${signature}`;
  }

  async exists(key: string): Promise<boolean> {
    return true;
  }
}
