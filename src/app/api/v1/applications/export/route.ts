import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { db } from "@/database";
import { applicationsTable } from "@/database/schema/application-builder";
import { eq, and } from "drizzle-orm";
import { publishingVersioningService } from "@/features/application-builder/services/publishing-versioning.service";

export const POST = withAuth(async (ctx: AuthContext) => {
  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const body = await ctx.request.json();
  const applicationId = body.applicationId;

  if (!applicationId) {
    return ApiResponse.error("applicationId parameter is required", 400);
  }

  try {
    const [app] = await db
      .select()
      .from(applicationsTable)
      .where(
        and(
          eq(applicationsTable.id, applicationId),
          eq(applicationsTable.tenantId, tenantId),
        ),
      );

    if (!app) {
      return ApiResponse.error("Application not found", 404);
    }

    const sanitizedConfig = publishingVersioningService.sanitizeForExport(
      app.configuration as any,
    );

    const exportPackage = {
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: ctx.user.sub,
        applicationName: app.name,
        applicationCode: app.code,
        version: app.version,
      },
      configuration: sanitizedConfig,
    };

    return ApiResponse.success({ exportPackage }, 200);
  } catch (error: any) {
    return ApiResponse.error(
      error.message || "Failed to export application configuration",
      500,
    );
  }
});
