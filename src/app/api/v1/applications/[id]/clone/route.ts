import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { db } from "@/database";
import { applicationsTable } from "@/database/schema/application-builder";
import { eq, and } from "drizzle-orm";
import { publishingVersioningService } from "@/features/application-builder/services/publishing-versioning.service";
import { memoryApplicationsStore } from "@/features/application-builder/services/application-store";

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

  const targetEnv = body.targetEnvironment || "STAGING";
  const customName = body.name;
  const customCode = body.code;

  let sourceApp = memoryApplicationsStore.get(appId);

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

    if (dbApp) sourceApp = dbApp;
  } catch (error: any) {
    // Ignore
  }

  if (!sourceApp || sourceApp.tenantId !== tenantId) {
    return ApiResponse.error("Source application not found", 404);
  }

  const cloned = publishingVersioningService.cloneConfiguration(
    sourceApp.name,
    sourceApp.code,
    sourceApp.configuration as any,
    targetEnv,
  );

  const newName = customName || cloned.newName;
  const newCode =
    customCode || `${cloned.newCode}_${Date.now().toString().slice(-4)}`;

  const clonedAppRecord = {
    id: `app_${Date.now()}_cloned`,
    tenantId,
    workspaceId: sourceApp.workspaceId,
    name: newName,
    code: newCode,
    description: `Cloned from ${sourceApp.name} (${sourceApp.code})`,
    environment: targetEnv,
    platform: sourceApp.platform,
    status: "DRAFT",
    version: 1,
    configuration: cloned.clonedConfig,
    createdBy: ctx.user.sub,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  memoryApplicationsStore.set(clonedAppRecord.id, clonedAppRecord);

  try {
    const [clonedApp] = await db
      .insert(applicationsTable)
      .values({
        tenantId,
        workspaceId: sourceApp.workspaceId,
        name: newName,
        code: newCode,
        description: `Cloned from ${sourceApp.name} (${sourceApp.code})`,
        environment: targetEnv,
        platform: sourceApp.platform,
        status: "DRAFT",
        version: 1,
        configuration: cloned.clonedConfig,
        createdBy: ctx.user.sub,
      })
      .returning();

    memoryApplicationsStore.set(clonedApp.id, clonedApp);
    return ApiResponse.success(
      {
        message: `Application cloned successfully to environment ${targetEnv}`,
        clonedApplication: clonedApp,
      },
      201,
    );
  } catch (error: any) {
    // Fallback to memory store
    return ApiResponse.success(
      {
        message: `Application cloned successfully to environment ${targetEnv}`,
        clonedApplication: clonedAppRecord,
      },
      201,
    );
  }
});
