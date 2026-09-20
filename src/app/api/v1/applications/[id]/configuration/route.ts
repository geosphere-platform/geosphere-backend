import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { db } from "@/database";
import { applicationsTable } from "@/database/schema/application-builder";
import { eq, and } from "drizzle-orm";
import { memoryApplicationsStore } from "@/features/application-builder/services/application-store";

async function getAppId(ctx: AuthContext, context?: any): Promise<string> {
  const rawParams = context?.params ? await context.params : {};
  if (rawParams && rawParams.id) return rawParams.id;
  const pathParts = new URL(ctx.request.url).pathname
    .split("/")
    .filter(Boolean);
  return pathParts[pathParts.length - 2] || pathParts[pathParts.length - 1];
}

export const GET = withAuth(async (ctx: AuthContext, context?: any) => {
  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const appId = await getAppId(ctx, context);

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

  return ApiResponse.success(
    {
      applicationId: app.id,
      tenantId: app.tenantId,
      version: app.version,
      status: app.status,
      configuration: app.configuration,
    },
    200,
  );
});

export const PUT = withAuth(async (ctx: AuthContext, context?: any) => {
  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const appId = await getAppId(ctx, context);
  const body = await ctx.request.json();

  let existing = memoryApplicationsStore.get(appId);

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

    if (dbApp) existing = dbApp;
  } catch (error: any) {
    // Ignore
  }

  if (!existing || existing.tenantId !== tenantId) {
    return ApiResponse.error("Application not found", 404);
  }

  const newConfig = body.configuration || body;
  existing.configuration = newConfig;
  existing.status = "DRAFT";
  existing.updatedAt = new Date().toISOString();

  memoryApplicationsStore.set(appId, existing);

  try {
    await db
      .update(applicationsTable)
      .set({
        configuration: newConfig,
        status: "DRAFT",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(applicationsTable.id, appId),
          eq(applicationsTable.tenantId, tenantId),
        ),
      );
  } catch (error: any) {
    // Ignore
  }

  return ApiResponse.success(
    {
      message: "Application draft configuration updated",
      configuration: existing.configuration,
    },
    200,
  );
});
