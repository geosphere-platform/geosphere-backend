/**
 * DELETE /api/v1/admin/overrides/[id] - Remove an override
 */

import { ApiResponse } from "@/core/http/api-response";
import { withAuth, withPermission, AuthContext } from "@/core/auth/guards";
import { overrideService } from "@/core/subscription/override.service";
import { PERMISSIONS } from "@/core/constants";
import { auditLogsTable } from "@/database/schema";
import { db } from "@/database";

export const DELETE = withAuth(
  withPermission(PERMISSIONS.OVERRIDE_MANAGE)(
    async (ctx: AuthContext, context?: Record<string, unknown>) => {
      const id = (context?.params as Record<string, string>)?.id;
      await overrideService.removeOverride(id);

      await db.insert(auditLogsTable).values({
        userId: ctx.user.sub,
        action: "override.removed",
        entityType: "entitlement_override",
        entityId: id,
      });

      return ApiResponse.success({ removed: true });
    },
  ),
);
