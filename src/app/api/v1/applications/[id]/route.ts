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
  return pathParts[pathParts.length - 1];
}

export const GET = withAuth(async (ctx: AuthContext, context?: any) => {
  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const appId = await getAppId(ctx, context);

  try {
    const [app] = await db
      .select()
      .from(applicationsTable)
      .where(
        and(
          eq(applicationsTable.id, appId),
          eq(applicationsTable.tenantId, tenantId),
        ),
      );

    if (app) {
      return ApiResponse.success({ application: app }, 200);
    }
  } catch (error: any) {
    // Ignore DB error, check memory store
  }

  const memApp = memoryApplicationsStore.get(appId);
  if (memApp && memApp.tenantId === tenantId) {
    return ApiResponse.success({ application: memApp }, 200);
  }

  return ApiResponse.error("Application not found", 404);
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
  } catch (e) {
    // Ignore
  }

  if (!existing || existing.tenantId !== tenantId) {
    return ApiResponse.error("Application not found", 404);
  }

  const { name, description, environment, platform, status, configuration } =
    body;
  const updatedConfig = configuration
    ? { ...existing.configuration, ...configuration }
    : existing.configuration;

  const updatedRecord = {
    ...existing,
    name: name !== undefined ? name : existing.name,
    description: description !== undefined ? description : existing.description,
    environment: environment !== undefined ? environment : existing.environment,
    platform: platform !== undefined ? platform : existing.platform,
    status: status !== undefined ? status : existing.status,
    configuration: updatedConfig,
    updatedAt: new Date().toISOString(),
  };

  memoryApplicationsStore.set(appId, updatedRecord);

  try {
    await db
      .update(applicationsTable)
      .set({
        name: updatedRecord.name,
        description: updatedRecord.description,
        environment: updatedRecord.environment,
        platform: updatedRecord.platform,
        status: updatedRecord.status,
        configuration: updatedRecord.configuration,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(applicationsTable.id, appId),
          eq(applicationsTable.tenantId, tenantId),
        ),
      );
  } catch (e) {
    // Ignore
  }

  return ApiResponse.success({ application: updatedRecord }, 200);
});

export const DELETE = withAuth(async (ctx: AuthContext, context?: any) => {
  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const appId = await getAppId(ctx, context);

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
  } catch (e) {
    // Ignore
  }

  if (!existing || existing.tenantId !== tenantId) {
    return ApiResponse.error("Application not found", 404);
  }

  existing.status = "ARCHIVED";
  memoryApplicationsStore.set(appId, existing);

  try {
    await db
      .update(applicationsTable)
      .set({ status: "ARCHIVED", updatedAt: new Date() })
      .where(
        and(
          eq(applicationsTable.id, appId),
          eq(applicationsTable.tenantId, tenantId),
        ),
      );
  } catch (e) {
    // Ignore
  }

  return ApiResponse.success(
    { message: "Application archived successfully", application: existing },
    200,
  );
});
