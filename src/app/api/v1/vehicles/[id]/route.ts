import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { PERMISSIONS, USER_ROLES } from "@/core/constants";
import { hasPermission } from "@/core/auth/permissions";
import { ForbiddenError, NotFoundError } from "@/core/errors/errors";
import { db } from "@/database";
import { DrizzleVehicleRepository } from "@/features/vehicle/infrastructure/drizzle-repository";
import { GetVehicleByIdUseCase } from "@/features/vehicle/application/get-vehicle-by-id.usecase";
import { UpdateVehicleUseCase } from "@/features/vehicle/application/update-vehicle.usecase";
import { DeleteVehicleUseCase } from "@/features/vehicle/application/delete-vehicle.usecase";

interface Context {
  params: Promise<{ id: string }>;
}

function enforceTenantBoundary(
  userRole: string,
  userOrgId: string | null | undefined,
  vehicleOrgId: string | null | undefined,
) {
  const isSuper =
    userRole === USER_ROLES.SUPER_ADMIN ||
    userRole === USER_ROLES.PLATFORM_ADMIN;
  if (isSuper) return;

  if (!vehicleOrgId || vehicleOrgId !== userOrgId) {
    throw new ForbiddenError(
      "You are not authorized to access vehicles from another organization",
    );
  }
}

/**
 * GET /api/v1/vehicles/[id]
 */
export const GET = withAuth(
  async (ctx: AuthContext, routeCtx?: Record<string, unknown>) => {
    if (!hasPermission(ctx.user.role, PERMISSIONS.VEHICLE_READ)) {
      throw new ForbiddenError(
        "Insufficient permission to view vehicle details",
      );
    }

    const { id } = await (routeCtx as unknown as Context).params;
    const repository = new DrizzleVehicleRepository(db);
    const useCase = new GetVehicleByIdUseCase(repository);
    const vehicle = await useCase.execute(id);

    if (!vehicle) {
      throw new NotFoundError("Vehicle not found");
    }

    // Enforce tenant boundary: non-super-admins cannot view vehicles belonging to another organization
    enforceTenantBoundary(ctx.user.role, ctx.user.orgId, vehicle.organizationId);

    return ApiResponse.success(vehicle);
  },
);

/**
 * PUT /api/v1/vehicles/[id]
 */
export const PUT = withAuth(
  async (ctx: AuthContext, routeCtx?: Record<string, unknown>) => {
    if (!hasPermission(ctx.user.role, PERMISSIONS.VEHICLE_UPDATE)) {
      throw new ForbiddenError("Insufficient permission to update vehicle");
    }

    const { id } = await (routeCtx as unknown as Context).params;
    const body = await ctx.request.json();
    const repository = new DrizzleVehicleRepository(db);

    // Validate existence & tenant ownership prior to update
    const existing = await repository.findById(id);
    if (!existing) {
      throw new NotFoundError("Vehicle not found");
    }
    enforceTenantBoundary(ctx.user.role, ctx.user.orgId, existing.organizationId);

    const useCase = new UpdateVehicleUseCase(repository);
    const updated = await useCase.execute(id, body);

    return ApiResponse.success(updated);
  },
);

/**
 * DELETE /api/v1/vehicles/[id]
 */
export const DELETE = withAuth(
  async (ctx: AuthContext, routeCtx?: Record<string, unknown>) => {
    if (!hasPermission(ctx.user.role, PERMISSIONS.VEHICLE_DELETE)) {
      throw new ForbiddenError("Insufficient permission to delete vehicle");
    }

    const { id } = await (routeCtx as unknown as Context).params;
    const repository = new DrizzleVehicleRepository(db);

    // Validate existence & tenant ownership prior to delete
    const existing = await repository.findById(id);
    if (!existing) {
      throw new NotFoundError("Vehicle not found");
    }
    enforceTenantBoundary(ctx.user.role, ctx.user.orgId, existing.organizationId);

    const useCase = new DeleteVehicleUseCase(repository);
    await useCase.execute(id);

    return ApiResponse.success({ deleted: true, id });
  },
);
