import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { db } from "@/database";
import {
  applicationsTable,
  applicationVersionsTable,
} from "@/database/schema/application-builder";
import { eq, and } from "drizzle-orm";
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
  const body = await ctx.request.json();

  const targetVersion = body.targetVersion;
  if (!targetVersion || typeof targetVersion !== "number") {
    return ApiResponse.error(
      "Numeric targetVersion parameter is required",
      400,
    );
  }

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

  let targetSnapshot: any = null;

  try {
    const [dbSnapshot] = await db
      .select()
      .from(applicationVersionsTable)
      .where(
        and(
          eq(applicationVersionsTable.applicationId, app.id),
          eq(applicationVersionsTable.version, targetVersion),
          eq(applicationVersionsTable.tenantId, tenantId),
        ),
      );

    if (dbSnapshot) targetSnapshot = dbSnapshot;
  } catch (error: any) {
    // Ignore
  }

  if (!targetSnapshot) {
    const memVersions = memoryVersionsStore.get(app.id) || [];
    targetSnapshot = memVersions.find((v) => v.version === targetVersion);
  }

  if (!targetSnapshot) {
    return ApiResponse.error(
      `Version snapshot ${targetVersion} not found for this application`,
      404,
    );
  }

  // Rollback configuration
  app.configuration = targetSnapshot.snapshot;
  app.status = "PUBLISHED";
  app.currentPublishedVersionId = targetSnapshot.id;
  app.updatedAt = new Date().toISOString();
  memoryApplicationsStore.set(app.id, app);

  try {
    await db
      .update(applicationsTable)
      .set({
        configuration: targetSnapshot.snapshot,
        status: "PUBLISHED",
        currentPublishedVersionId: targetSnapshot.id,
        updatedAt: new Date(),
      })
      .where(eq(applicationsTable.id, app.id));
  } catch (error: any) {
    // Ignore
  }

  return ApiResponse.success(
    {
      message: `Rolled back application configuration to version ${targetVersion}`,
      application: app,
      targetSnapshot,
    },
    200,
  );
});
