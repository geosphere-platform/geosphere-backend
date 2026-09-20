import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { db } from "@/database";
import { applicationsTable } from "@/database/schema/application-builder";
import { eq, and } from "drizzle-orm";
import { configurationValidatorService } from "@/features/application-builder/services/configuration-validator.service";

export const POST = withAuth(async (ctx: AuthContext) => {
  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const body = await ctx.request.json();

  const exportPackage = body.exportPackage || body;
  const config = exportPackage.configuration;
  const meta = exportPackage.exportMetadata || {};

  if (!config) {
    return ApiResponse.error(
      "Invalid import package: missing configuration object",
      400,
    );
  }

  const validation = configurationValidatorService.validate(config);
  if (!validation.isValid) {
    return ApiResponse.error(
      `Cannot import invalid configuration: ${validation.issues.map((i) => i.message).join("; ")}`,
      422,
      "VALIDATION_ERROR",
      { issues: validation.issues },
    );
  }

  const appName = meta.applicationName
    ? `${meta.applicationName} (Imported)`
    : "Imported Application";
  const baseCode = meta.applicationCode || "imported_app";
  const appCode = `${baseCode}_${Date.now().toString().slice(-4)}`;

  try {
    const [importedApp] = await db
      .insert(applicationsTable)
      .values({
        tenantId,
        name: appName,
        code: appCode,
        description: `Imported configuration from version ${meta.version || 1}`,
        environment: "DEVELOPMENT",
        platform: "BOTH",
        status: "DRAFT",
        version: 1,
        configuration: config,
        createdBy: ctx.user.sub,
      })
      .returning();

    return ApiResponse.success(
      {
        message: "Application configuration imported successfully",
        importedApplication: importedApp,
      },
      201,
    );
  } catch (error: any) {
    return ApiResponse.error(
      error.message || "Failed to import application configuration",
      500,
    );
  }
});
