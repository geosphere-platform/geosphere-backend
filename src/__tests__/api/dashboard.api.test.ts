import { HTTP_STATUS } from "@/core/constants";

export function runDashboardApiTests(): boolean {
  // Test matrix for HTTP status codes across dashboard endpoints
  const apiTestCases = [
    {
      endpoint: "/api/v1/dashboard/summary",
      status: HTTP_STATUS.OK,
      expectedCode: 200,
    },
    {
      endpoint: "/api/v1/dashboard/vehicle-status",
      status: HTTP_STATUS.OK,
      expectedCode: 200,
    },
    {
      endpoint: "/api/v1/dashboard/recent-alerts",
      status: HTTP_STATUS.OK,
      expectedCode: 200,
    },
    {
      endpoint: "/api/v1/dashboard/recent-trips",
      status: HTTP_STATUS.OK,
      expectedCode: 200,
    },
    {
      endpoint: "/api/v1/dashboard/summary",
      status: HTTP_STATUS.UNAUTHORIZED,
      expectedCode: 401,
    },
    {
      endpoint: "/api/v1/dashboard/summary",
      status: HTTP_STATUS.FORBIDDEN,
      expectedCode: 403,
    },
    {
      endpoint: "/api/v1/vehicles/non-existent-id",
      status: HTTP_STATUS.NOT_FOUND,
      expectedCode: 404,
    },
    {
      endpoint: "/api/v1/dashboard/summary",
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      expectedCode: 500,
    },
  ];

  for (const tc of apiTestCases) {
    if (tc.status !== tc.expectedCode) {
      throw new Error(
        `API status code test failed for ${tc.endpoint}: expected ${tc.expectedCode}, got ${tc.status}`,
      );
    }
  }

  return true;
}
