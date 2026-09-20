import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { db } from "@/database";
import { applicationsTable } from "@/database/schema/application-builder";
import { eq, and } from "drizzle-orm";
import { configurationValidatorService } from "@/features/application-builder/services/configuration-validator.service";
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

  const validation = configurationValidatorService.validate(
    app.configuration as any,
  );

  if (validation.isValid && app.status === "DRAFT") {
    app.status = "VALIDATED";
    memoryApplicationsStore.set(appId, app);

    try {
      await db
        .update(applicationsTable)
        .set({ status: "VALIDATED", updatedAt: new Date() })
        .where(eq(applicationsTable.id, appId));
    } catch (e) {
      // Ignore
    }
  }

  return ApiResponse.success({ validation }, 200);
});
