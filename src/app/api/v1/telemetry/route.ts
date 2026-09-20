import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { PERMISSIONS } from "@/core/constants";
import { hasPermission } from "@/core/auth/permissions";
import { ForbiddenError } from "@/core/errors/errors";
import { db } from "@/database";
import { DrizzleVehicleRepository } from "@/features/vehicle/infrastructure/drizzle-repository";
import { IngestTelemetryUseCase } from "@/features/vehicle/application/ingest-telemetry.usecase";

/**
 * POST /api/v1/telemetry
 * Ingests a new vehicle telemetry location record.
 */
export const POST = withAuth(async (ctx: AuthContext) => {
  if (!hasPermission(ctx.user.role, PERMISSIONS.VEHICLE_UPDATE)) {
    throw new ForbiddenError(
      "Insufficient permission to ingest vehicle telemetry",
    );
  }

  const body = await ctx.request.json();
  const repository = new DrizzleVehicleRepository(db);
  const useCase = new IngestTelemetryUseCase(repository);
  const ingested = await useCase.execute(body);

  return ApiResponse.success(ingested, 201);
});
