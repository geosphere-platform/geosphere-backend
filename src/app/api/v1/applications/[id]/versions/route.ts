import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { db } from "@/database";
import { applicationVersionsTable } from "@/database/schema/application-builder";
import { eq, and, desc } from "drizzle-orm";
import { memoryVersionsStore } from "@/features/application-builder/services/application-store";

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

  try {
    const versions = await db
      .select()
      .from(applicationVersionsTable)
      .where(
        and(
          eq(applicationVersionsTable.applicationId, appId),
          eq(applicationVersionsTable.tenantId, tenantId),
        ),
      )
      .orderBy(desc(applicationVersionsTable.version));

    if (versions && versions.length > 0) {
      return ApiResponse.success({ versions }, 200);
    }
  } catch (error: any) {
    // Ignore
  }

  const memVersions = memoryVersionsStore.get(appId) || [];
  return ApiResponse.success({ versions: memVersions }, 200);
});
