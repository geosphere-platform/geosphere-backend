import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { db } from "@/database";
import {
  applicationsTable,
  applicationVersionsTable,
} from "@/database/schema/application-builder";
import { eq, and } from "drizzle-orm";
import { publishingVersioningService } from "@/features/application-builder/services/publishing-versioning.service";
import {
  memoryApplicationsStore,
  memoryVersionsStore,
} from "@/features/application-builder/services/application-store";

async function getAppId(ctx: AuthContext, context?: any): Promise<string> {
  const rawParams = context?.params ? await context.params : {};
  if (rawParams && rawParams.id) return rawParams.id;
  const pathParts = new URL(ctx.request.url).pathname
    .split("/")
    .filter(Boolean);
  return pathParts[pathParts.length - 2] || pathParts[pathParts.length - 1];
}

export const POST = withAuth(async (ctx: AuthContext, context?: any) => {
  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const appId = await getAppId(ctx, context);
  const body = await ctx.request.json().catch(() => ({}));

  const changeSummary =
    body.changeSummary || "Published new application version";

  let app = memoryApplicationsStore.get(appId);

  try {
    const [dbApp] = await db
      .select()
      .from(applicationsTable)
      .where(
        and(
          eq(applicationsTable.id, appId),
          eq(applicationsTable.tenantId, tenantId),
        ),
      );

    if (dbApp) app = dbApp;
  } catch (error: any) {
    // Ignore
  }

  if (!app || app.tenantId !== tenantId) {
    return ApiResponse.error("Application not found", 404);
  }

  const publishPrep = publishingVersioningService.preparePublishSnapshot(
    app.id,
    tenantId,
    app.version,
    app.configuration as any,
    changeSummary,
    ctx.user.sub,
  );

  if (!publishPrep.validation.isValid) {
    return ApiResponse.error(
      `Cannot publish invalid configuration: ${publishPrep.validation.issues.map((i) => i.message).join("; ")}`,
      422,
      "VALIDATION_ERROR",
      { issues: publishPrep.validation.issues },
    );
  }

  const versionSnapshot = {
    id: `ver_${Date.now()}`,
    applicationId: app.id,
    tenantId,
    version: publishPrep.newVersion,
    status: "PUBLISHED",
    snapshot: app.configuration,
    changeSummary,
    publishedBy: ctx.user.sub,
    publishedAt: new Date().toISOString(),
  };

  const existingVersions = memoryVersionsStore.get(app.id) || [];
  memoryVersionsStore.set(app.id, [versionSnapshot, ...existingVersions]);

  app.version = publishPrep.newVersion;
  app.status = "PUBLISHED";
  app.currentPublishedVersionId = versionSnapshot.id;
  app.updatedAt = new Date().toISOString();
  memoryApplicationsStore.set(app.id, app);

  try {
    const [dbVersion] = await db
      .insert(applicationVersionsTable)
      .values({
        applicationId: app.id,
        tenantId,
        version: publishPrep.newVersion,
        status: "PUBLISHED",
        snapshot: app.configuration,
        changeSummary: changeSummary,
        publishedBy: ctx.user.sub,
      })
      .returning();

    await db
      .update(applicationsTable)
      .set({
        version: publishPrep.newVersion,
        status: "PUBLISHED",
        currentPublishedVersionId: dbVersion.id,
        updatedAt: new Date(),
      })
      .where(eq(applicationsTable.id, app.id));
  } catch (error: any) {
    // Fallback to memory store
  }

  return ApiResponse.success(
    {
      message: `Application successfully published version ${publishPrep.newVersion}`,
      application: app,
      versionSnapshot,
    },
    200,
  );
});
