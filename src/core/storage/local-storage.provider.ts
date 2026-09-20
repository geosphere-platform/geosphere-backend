import fs from "fs";
import path from "path";
import crypto from "crypto";
import {
  ObjectStorageProvider,
  UploadFileOptions,
  StoredFile,
} from "./object-storage.interface";
import { env } from "@/core/config/env";

export class LocalStorageProvider implements ObjectStorageProvider {
  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir ?? env.STORAGE_LOCAL_DIR ?? "./uploads";
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async uploadFile(options: UploadFileOptions): Promise<StoredFile> {
    const sanitizedKey = options.key.replace(/[^a-zA-Z0-9_\-./]/g, "_");
    const filePath = path.join(this.baseDir, sanitizedKey);
    const dir = path.dirname(filePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, options.buffer);

    return {
      key: sanitizedKey,
      url: `/api/v1/storage/file?key=${encodeURIComponent(sanitizedKey)}`,
      sizeBytes: options.buffer.length,
      contentType: options.contentType,
      isPrivate: options.isPrivate ?? true,
      uploadedAt: new Date(),
    };
  }

  async getFile(key: string): Promise<Buffer | null> {
    const sanitizedKey = key.replace(/[^a-zA-Z0-9_\-./]/g, "_");
    const filePath = path.join(this.baseDir, sanitizedKey);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    return fs.readFileSync(filePath);
  }

  async deleteFile(key: string): Promise<boolean> {
    const sanitizedKey = key.replace(/[^a-zA-Z0-9_\-./]/g, "_");
    const filePath = path.join(this.baseDir, sanitizedKey);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }

    return false;
  }

  async getSignedUrl(
    key: string,
    expiresSeconds: number = 3600,
  ): Promise<string> {
    const expiresAt = Math.floor(Date.now() / 1000) + expiresSeconds;
    const signature = crypto
      .createHmac("sha256", env.JWT_SECRET)
      .update(`${key}:${expiresAt}`)
      .digest("hex");

    return `/api/v1/storage/download?key=${encodeURIComponent(key)}&expires=${expiresAt}&signature=${signature}`;
  }

  async exists(key: string): Promise<boolean> {
    const sanitizedKey = key.replace(/[^a-zA-Z0-9_\-./]/g, "_");
    const filePath = path.join(this.baseDir, sanitizedKey);
    return fs.existsSync(filePath);
  }
}
