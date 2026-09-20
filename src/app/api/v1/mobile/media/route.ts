import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";

const mediaUploadsStore: Map<string, any> = new Map();

export const POST = withAuth(async (ctx: AuthContext) => {
  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const userId = ctx.user.sub;
  const body = await ctx.request.json();

  const {
    deviceId,
    clientOperationId,
    mediaType,
    fileName,
    fileSizeBytes,
    chunkIndex = 0,
    chunksTotal = 1,
    base64Chunk,
  } = body;

  if (!clientOperationId || !fileName || !mediaType) {
    return ApiResponse.error(
      "Missing required upload parameters",
      400,
      "BAD_REQUEST",
    );
  }

  const safeFileName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
  const ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "video/mp4",
    "application/pdf",
  ];

  if (!ALLOWED_MIME_TYPES.includes(mediaType)) {
    return ApiResponse.error(
      `Invalid or unsupported file MIME type '${mediaType}'`,
      400,
      "BAD_REQUEST",
    );
  }

  let uploadRecord = mediaUploadsStore.get(clientOperationId);

  if (!uploadRecord) {
    uploadRecord = {
      id: `media_${Date.now()}`,
      tenantId,
      userId,
      deviceId: deviceId || "unknown_device",
      clientOperationId,
      mediaType,
      fileName: safeFileName,
      fileSizeBytes: fileSizeBytes || 0,
      chunksTotal,
      chunksReceived: 0,
      storageUrl: `/uploads/${encodeURIComponent(tenantId)}/${encodeURIComponent(safeFileName)}`,
      status: "UPLOADING",
      createdAt: new Date().toISOString(),
    };
  }

  uploadRecord.chunksReceived = Math.min(
    uploadRecord.chunksTotal,
    uploadRecord.chunksReceived + 1,
  );
  if (uploadRecord.chunksReceived >= uploadRecord.chunksTotal) {
    uploadRecord.status = "COMPLETED";
    uploadRecord.completedAt = new Date().toISOString();
  }

  mediaUploadsStore.set(clientOperationId, uploadRecord);

  return ApiResponse.success(uploadRecord, 200);
});
