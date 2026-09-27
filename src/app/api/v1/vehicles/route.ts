import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { PERMISSIONS } from "@/core/constants";
import { hasPermission } from "@/core/auth/permissions";
import { ForbiddenError } from "@/core/errors/errors";
import { db } from "@/database";
import { DrizzleVehicleRepository } from "@/features/vehicle/infrastructure/drizzle-repository";
import { GetVehiclesUseCase } from "@/features/vehicle/application/get-vehicles.usecase";
import { CreateVehicleUseCase } from "@/features/vehicle/application/create-vehicle.usecase";

/**
 * GET /api/v1/vehicles
 * Returns vehicles belonging to the user's organization.
 */
export const GET = withAuth(async (ctx: AuthContext) => {
  if (!hasPermission(ctx.user.role, PERMISSIONS.VEHICLE_READ)) {
    throw new ForbiddenError("Insufficient permission to view vehicles");
  }

  const repository = new DrizzleVehicleRepository(db);
  const useCase = new GetVehiclesUseCase(repository);
  const vehicles = await useCase.execute(ctx.user.orgId ?? undefined);

  return ApiResponse.success(vehicles);
});

/**
 * POST /api/v1/vehicles
 * Creates a new vehicle record.
 */
export const POST = withAuth(async (ctx: AuthContext) => {
  if (!hasPermission(ctx.user.role, PERMISSIONS.VEHICLE_CREATE)) {
    throw new ForbiddenError("Insufficient permission to create vehicle");
  }

  const body = await ctx.request.json();
  const repository = new DrizzleVehicleRepository(db);
  const useCase = new CreateVehicleUseCase(repository);

  // Automatically enforce organization ID from token
  const created = await useCase.execute({
    ...body,
    organizationId: ctx.user.orgId ?? body.organizationId,
  });

  return ApiResponse.success(created, 201);
});
