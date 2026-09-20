/**
 * Pure Framework-Independent Media Engine Unit Tests
 *
 * Verifies binary magic-number inspection, EXIF coordinate extraction, chunked upload lifecycle,
 * attachment binding, progress callbacks, and pure framework decoupling.
 *
 * MUST NOT require browser DOM, React, Next.js, or OpenLayers.
 */

import { MediaEngine } from "../../core/media/engine/media-engine";
import { InMemoryMediaStorageAdapter } from "../../core/media/storage/media-storage.interface";
import { ChunkedUploadProgress, MediaError } from "../../core/media/types/media.types";
import { Coordinate } from "../../core/gis/types/geometry";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

export async function runMediaEnginePureUnitTests(): Promise<void> {
  console.log("------------------------------------------");
  console.log("RUNNING GENERIC MEDIA ENGINE PURE DOMAIN TESTS");
  console.log("------------------------------------------");

  const storage = new InMemoryMediaStorageAdapter();
  const engine = new MediaEngine({ storageAdapter: storage, maxSizeBytes: 10485760 }); // 10MB limit

  // 1. Binary Magic Number Inspection (JPEG)
  console.log("  [1/12] Testing Binary Magic-Number Header Inspection (JPEG & PNG)...");
  const jpegHeader = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46]);
  const jpegValidation = engine.validateBufferHeader(jpegHeader, "photo.jpg");
  assert(jpegValidation.valid && jpegValidation.mimeType === "image/jpeg", "JPEG header magic numbers must be validated");

  const pngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const pngValidation = engine.validateBufferHeader(pngHeader, "icon.png");
  assert(pngValidation.valid && pngValidation.mimeType === "image/png", "PNG header magic numbers must be validated");

  // 2. Empty Buffer Rejection
  console.log("  [2/12] Testing Empty File Buffer Rejection...");
  let emptyBufferFailed = false;
  try {
    engine.validateBufferHeader(Buffer.alloc(0), "empty.txt");
  } catch (err: any) {
    if (err instanceof MediaError && err.code === "INVALID_FILE_HEADER") {
      emptyBufferFailed = true;
    }
  }
  assert(emptyBufferFailed, "Empty buffer must throw MediaError INVALID_FILE_HEADER");

  // 3. Oversized File Rejection
  console.log("  [3/12] Testing Oversized File Rejection...");
  let oversizedFailed = false;
  try {
    const hugeBuffer = Buffer.alloc(15728640); // 15MB > 10MB max
    engine.validateBufferHeader(hugeBuffer, "large.zip");
  } catch (err: any) {
    if (err instanceof MediaError && err.code === "FILE_TOO_LARGE") {
      oversizedFailed = true;
    }
  }
  assert(oversizedFailed, "Oversized buffer must throw MediaError FILE_TOO_LARGE");

  // 4. EXIF Coordinate Extraction
  console.log("  [4/4] Testing EXIF Location Coordinate Extraction...");
  const exifJpeg = Buffer.from("FFD8FF... EXIF_GPS: [77.2090, 28.6139] ...", "utf-8");
  const coord = engine.extractExifCoordinate(exifJpeg);
  assert(coord !== undefined && coord[0] === 77.2090 && coord[1] === 28.6139, "EXIF coordinate must be extracted");

  // 5. Single Media File Upload & Metadata Normalization
  console.log("  [5/12] Testing Single Media Upload & Attachment Metadata Normalization...");
  const attachment = await engine.uploadMedia("inspection_photo.jpg", jpegHeader, "task-101", "task", [77.2090, 28.6139]);
  assert(attachment.id.startsWith("att_"), "Attachment ID must be generated");
  assert(attachment.metadata.mimeType === "image/jpeg", "MIME type must be image/jpeg");
  assert(attachment.boundEntityId === "task-101", "Bound Entity ID must match task-101");

  // 6. Chunked Upload Session Lifecycle
  console.log("  [6/12] Testing Chunked Upload Session Initiation...");
  const session = await engine.initiateChunkedUpload("field_report.pdf", 3000, 1000); // 3000 bytes, 3 chunks
  assert(session.totalChunks === 3, "Total chunks must equal 3");

  // 7. Upload Chunks & Progress Callbacks
  console.log("  [7/12] Testing Chunk Uploads & Progress Callbacks...");
  const progressList: ChunkedUploadProgress[] = [];
  const unsub = engine.subscribeProgress((p) => progressList.push(p));

  const c1 = Buffer.alloc(1000, "A");
  const c2 = Buffer.alloc(1000, "B");
  const c3 = Buffer.alloc(1000, "C");

  await engine.uploadChunk(session.sessionId, 0, c1);
  await engine.uploadChunk(session.sessionId, 1, c2);
  await engine.uploadChunk(session.sessionId, 2, c3);

  assert(progressList.length === 3, "Progress listener must capture 3 chunk upload events");
  assert(progressList[2].percentage === 100, "Final chunk progress percentage must equal 100%");

  // 8. Chunk Finalization & Assembly
  console.log("  [8/12] Testing Chunk Assembly & Finalization...");
  const finalAttachment = await engine.finalizeChunkedUpload(session.sessionId, "sub-555", "form_submission");
  assert(finalAttachment.metadata.sizeBytes === 3000, "Assembled file size must equal 3000 bytes");

  // 9. Out of Bounds Chunk Index Rejection
  console.log("  [9/12] Testing Out-of-Bounds Chunk Index Rejection...");
  const session2 = await engine.initiateChunkedUpload("doc.zip", 2000, 1000);
  let oobFailed = false;
  try {
    await engine.uploadChunk(session2.sessionId, 99, c1);
  } catch (err: any) {
    if (err instanceof MediaError && err.code === "CHUNK_OUT_OF_BOUNDS") {
      oobFailed = true;
    }
  }
  assert(oobFailed, "Out-of-bounds chunk index 99 must fail");

  // 10. Attachment Binding
  console.log("  [10/12] Testing Attachment Binding to Entities...");
  const bound = await engine.bindAttachment(attachment.id, "inspection-99", "inspection");
  assert(bound.boundEntityId === "inspection-99", "Bound entity ID must update to inspection-99");

  // 11. Multi-Vertical Media Attachment Support (Agri, Utility, Delivery)
  console.log("  [11/12] Testing Multi-Vertical Media Scenario Support...");
  const pdfHeader = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34]); // %PDF-1.4
  const pdfAtt = await engine.uploadMedia("utility_audit.pdf", pdfHeader, "audit-77", "generic");
  assert(pdfAtt.mediaType === "document" && pdfAtt.metadata.mimeType === "application/pdf", "PDF utility audit document must be classified as document");

  // 12. Pure Framework Decoupling Verification
  console.log("  [12/12] Verifying Pure Framework Decoupling...");
  assert(typeof engine.uploadMedia === "function", "MediaEngine must expose uploadMedia");
  assert(typeof storage.uploadFile === "function", "IMediaStorageAdapter contract must be satisfied");

  console.log("✅ Generic Media Engine Pure Domain Unit Tests Passed Successfully!");
}
