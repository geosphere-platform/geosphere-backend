import { env } from "@/core/config/env";
import { ObjectStorageProvider } from "./object-storage.interface";
import { LocalStorageProvider } from "./local-storage.provider";
import { S3StorageProvider } from "./s3-storage.provider";

export interface FileValidationResult {
  valid: boolean;
  detectedMime: string;
  error?: string;
}

export class FileUploadService {
  private storage: ObjectStorageProvider;

  constructor(storage?: ObjectStorageProvider) {
    if (storage) {
      this.storage = storage;
    } else {
      this.storage =
        env.STORAGE_PROVIDER === "s3"
          ? new S3StorageProvider()
          : new LocalStorageProvider();
    }
  }

  /**
   * Verify actual file content headers (Magic Numbers) rather than relying on client MIME string
   */
  static validateFileHeader(
    buffer: Buffer,
    declaredFilename: string,
  ): FileValidationResult {
    if (!buffer || buffer.length === 0) {
      return {
        valid: false,
        detectedMime: "unknown",
        error: "File buffer is empty",
      };
    }

    if (buffer.length > (env.MAX_FILE_SIZE_BYTES ?? 52428800)) {
      return {
        valid: false,
        detectedMime: "unknown",
        error: `File size exceeds maximum allowed limit of ${env.MAX_FILE_SIZE_BYTES} bytes`,
      };
    }

    // Inspect Magic Numbers (First 4-8 bytes)
    const headerHex = buffer.subarray(0, 8).toString("hex").toUpperCase();

    let detectedMime = "application/octet-stream";

    if (headerHex.startsWith("89504E47")) {
      detectedMime = "image/png";
    } else if (headerHex.startsWith("FFD8FF")) {
      detectedMime = "image/jpeg";
    } else if (headerHex.startsWith("47494638")) {
      detectedMime = "image/gif";
    } else if (headerHex.startsWith("25504446")) {
      detectedMime = "application/pdf";
    } else if (headerHex.startsWith("504B0304")) {
      detectedMime = "application/zip"; // includes shapefiles, geopackages, zip archives
    } else if (
      declaredFilename.endsWith(".json") ||
      declaredFilename.endsWith(".geojson") ||
      declaredFilename.endsWith(".kml") ||
      declaredFilename.endsWith(".gpx")
    ) {
      // Validate text UTF-8 GeoJSON / spatial format structure
      try {
        const textContent = buffer.toString("utf-8");
        if (
          declaredFilename.endsWith(".json") ||
          declaredFilename.endsWith(".geojson")
        ) {
          JSON.parse(textContent);
          detectedMime = "application/geo+json";
        } else {
          detectedMime = "application/xml";
        }
      } catch {
        return {
          valid: false,
          detectedMime: "text/plain",
          error: "Malformed GeoJSON or XML file payload",
        };
      }
    }

    return { valid: true, detectedMime };
  }

  async processAndUpload(
    tenantId: string,
    filename: string,
    buffer: Buffer,
    isPrivate: boolean = true,
  ) {
    const validation = FileUploadService.validateFileHeader(buffer, filename);
    if (!validation.valid) {
      throw new Error(`File upload rejected: ${validation.error}`);
    }

    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9_\-.]/g, "_");
    const fileKey = `tenants/${tenantId}/${Date.now()}_${sanitizedFilename}`;

    return await this.storage.uploadFile({
      key: fileKey,
      buffer,
      contentType: validation.detectedMime,
      isPrivate,
    });
  }

  getStorageProvider(): ObjectStorageProvider {
    return this.storage;
  }
}
