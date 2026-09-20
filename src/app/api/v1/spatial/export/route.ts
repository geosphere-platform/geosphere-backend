/**
 * POST /api/v1/spatial/export
 *
 * Asynchronous Bulk GIS Export API Endpoint
 * Enqueues a background export job using the Phase 17 Job Queue system.
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
  if (!hasPermission(ctx.user.role, PERMISSIONS.GIS_QUERY_READ)) {
    throw new ForbiddenError(
      "Permission 'gis:query:read' required for bulk export",
    );
  }

  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const organizationId = ctx.user.orgId ?? "default-org-0000";

  let body: {
    layerId?: string;
    format?: "geojson" | "csv" | "json";
    bbox?: [number, number, number, number];
    limit?: number;
  };

  try {
    body = await ctx.request.json();
  } catch {
    body = {};
  }

  const job = await importExportService.enqueueExportJob(
    tenantId,
    organizationId,
    {
      layerId: body.layerId,
      format: body.format,
      bbox: body.bbox,
      limit: body.limit,
    },
    ctx.user.sub,
  );

  return ApiResponse.success(
    {
      jobId: job.id,
      status: job.status,
      type: job.type,
      format: body.format ?? "geojson",
      message: "Bulk GIS export job enqueued successfully",
    },
    202,
  );
});
