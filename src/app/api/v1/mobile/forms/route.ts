import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";

const submissionsStore: Map<string, any> = new Map();

export const GET = withAuth(async (ctx: AuthContext) => {
  const tenantId = ctx.user.orgId ?? "default-tenant-0000";

  // Data-driven form schemas
  const forms = [
    {
      id: "form_asset_inspection",
      tenantId,
      formKey: "asset_inspection",
      title: "Asset Safety Inspection",
      version: 1,
      fields: [
        { name: "asset_id", type: "TEXT", label: "Asset ID", required: true },
        {
          name: "condition",
          type: "DROPDOWN",
          label: "Condition",
          required: true,
          options: ["EXCELLENT", "GOOD", "FAIR", "POOR", "CRITICAL"],
        },
        {
          name: "temperature",
          type: "NUMBER",
          label: "Temperature (°C)",
          required: false,
          min: -50,
          max: 150,
        },
        {
          name: "inspection_date",
          type: "DATE",
          label: "Inspection Date",
          required: true,
        },
        {
          name: "has_leak",
          type: "BOOLEAN",
          label: "Leak Observed",
          required: true,
        },
        {
          name: "location",
          type: "GPS",
          label: "GPS Location",
          required: true,
        },
        {
          name: "photo",
          type: "PHOTO",
          label: "Inspection Photo",
          required: false,
        },
        {
          name: "signature",
          type: "SIGNATURE",
          label: "Inspector Signature",
          required: true,
        },
      ],
    },
    {
      id: "form_field_work_order",
      tenantId,
      formKey: "field_work_order",
      title: "Field Work Order Completion",
      version: 2,
      fields: [
        {
          name: "order_number",
          type: "TEXT",
          label: "Work Order #",
          required: true,
        },
        {
          name: "work_type",
          type: "DROPDOWN",
          label: "Work Type",
          required: true,
          options: ["REPAIR", "INSTALLATION", "MAINTENANCE"],
        },
        { name: "notes", type: "TEXT", label: "Field Notes", required: false },
        {
          name: "completed",
          type: "BOOLEAN",
          label: "Mark Completed",
          required: true,
        },
      ],
    },
  ];

  return ApiResponse.success({ tenantId, forms }, 200);
});

export const POST = withAuth(async (ctx: AuthContext) => {
  const tenantId = ctx.user.orgId ?? "default-tenant-0000";
  const userId = ctx.user.sub;
  const body = await ctx.request.json();

  const { formId, formVersion, clientOperationId, geometry, formData } = body;

  if (!formId || !clientOperationId || !formData) {
    return ApiResponse.error(
      "Missing required submission fields",
      400,
      "BAD_REQUEST",
    );
  }

  const submission = {
    id: `sub_${Date.now()}`,
    tenantId,
    userId,
    formId,
    formVersion: formVersion || 1,
    clientOperationId,
    geometry: geometry || null,
    formData,
    syncStatus: "SYNCED",
    submittedAt: new Date().toISOString(),
  };

  submissionsStore.set(clientOperationId, submission);

  return ApiResponse.success(submission, 201);
});
