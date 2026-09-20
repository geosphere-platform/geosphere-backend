/**
 * POST /api/v1/spatial/import
 *
 * Asynchronous Bulk GIS Import API Endpoint
 * Enqueues a background import job using the Phase 17 Job Queue system.
 */

import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { PERMISSIONS } from "@/core/constants";
import { hasPermission } from "@/core/auth/permissions";
import { ForbiddenError, ValidationError } from "@/core/errors/errors";
import { SpatialImportExportService } from "@/core/gis/jobs/spatial-import-export.service";
import { databaseJobQueue } from "@/core/jobs/database-job-queue";
import { db } from "@/database";

const importExportService = new SpatialImportExportService(
  db,
  databaseJobQueue,
);

export const POST = withAuth(async (ctx: AuthContext) => {
  if (
    !hasPermission(
      ctx.user.role,
      PERMISSIONS.GIS_FEATURE_CREATE ?? PERMISSIONS.GIS_QUERY_READ,
    )
  ) {
    throw new ForbiddenError(
      "Permission 'gis:features:create' required for bulk import",
    );
  }

  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const organizationId = ctx.user.orgId ?? "default-org-0000";

  let body: {
    layerId: string;
    features: Array<{
      type?: string;
      geometry: Record<string, unknown>;
      properties?: Record<string, unknown>;
    }>;
    batchSize?: number;
  };

  try {
    body = await ctx.request.json();
  } catch {
    throw new ValidationError("Invalid JSON request body");
  }

  if (!body.layerId || typeof body.layerId !== "string") {
    throw new ValidationError("layerId string parameter required");
  }

  if (!Array.isArray(body.features) || body.features.length === 0) {
    throw new ValidationError(
      "features array containing at least one spatial feature required",
    );
  }

  const job = await importExportService.enqueueImportJob(
    tenantId,
    organizationId,
    {
      layerId: body.layerId,
      features: body.features,
      batchSize: body.batchSize,
    },
    ctx.user.sub,
  );

  return ApiResponse.success(
    {
      jobId: job.id,
      status: job.status,
      type: job.type,
      featureCount: body.features.length,
      message: "Bulk GIS import job enqueued successfully",
    },
    202,
  );
});
