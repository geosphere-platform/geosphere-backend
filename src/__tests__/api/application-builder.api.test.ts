import { NextRequest } from "next/server";
import { signAccessToken } from "../../core/auth/jwt";
import {
  GET as getApps,
  POST as createApp,
} from "../../app/api/v1/applications/route";
import {
  GET as getAppDetail,
  PUT as updateApp,
} from "../../app/api/v1/applications/[id]/route";
import { POST as publishApp } from "../../app/api/v1/applications/[id]/publish/route";
import { POST as rollbackApp } from "../../app/api/v1/applications/[id]/rollback/route";
import { GET as getMobileConfig } from "../../app/api/v1/mobile/config/route";

export async function runApplicationBuilderApiTests() {
  console.log("--- Testing Application Builder API Routes ---");

  const mockTenantId = "tenant-api-test-100";
  const mockUserId = "user-api-test-100";
  const token = await signAccessToken({
    sub: mockUserId,
    role: "ADMIN" as any,
    orgId: mockTenantId,
  });

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const createReq = new NextRequest(
    "http://localhost:3000/api/v1/applications",
    {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        name: "API Test Field Service",
        code: `api_test_field_service_${Date.now()}`,
        description: "Test application created via API",
        templateCode: "FIELD_SERVICE_TEMPLATE",
      }),
    },
  );

  const createRes = await createApp(createReq);
  const createData = await createRes.json();
  if (!createData.success || !createData.data?.application) {
    throw new Error(
      `Failed to create application via API: ${JSON.stringify(createData)}`,
    );
  }

  const createdAppId = createData.data.application.id;

  // Verify GET Applications List
  const listReq = new NextRequest("http://localhost:3000/api/v1/applications", {
    method: "GET",
    headers: authHeaders,
  });
  const listRes = await getApps(listReq);
  const listData = await listRes.json();
  if (
    !listData.success ||
    !listData.data.applications ||
    listData.data.applications.length === 0
  ) {
    throw new Error("Failed to list applications for tenant");
  }

  // Publish Application Version
  const publishReq = new NextRequest(
    `http://localhost:3000/api/v1/applications/${createdAppId}/publish`,
    {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ changeSummary: "Version 2 publish API test" }),
    },
  );
  const publishRes = await publishApp(publishReq, {
    params: Promise.resolve({ id: createdAppId }),
  } as any);
  const publishData = await publishRes.json();
  if (!publishData.success || publishData.data.application.version !== 2) {
    throw new Error(
      `Failed to publish version snapshot: ${JSON.stringify(publishData)}`,
    );
  }

  // Test Mobile Config retrieval for this published app
  const mobileConfigReq = new NextRequest(
    `http://localhost:3000/api/v1/mobile/config?appId=${createData.data.application.code}`,
    {
      method: "GET",
      headers: authHeaders,
    },
  );
  const mobileConfigRes = await getMobileConfig(mobileConfigReq);
  const mobileConfigData = await mobileConfigRes.json();
  if (
    !mobileConfigData.success ||
    mobileConfigData.data.appId !== createData.data.application.code
  ) {
    throw new Error(
      "Mobile config API failed to serve dynamic application configuration",
    );
  }

  console.log("✅ Application Builder API Tests PASSED");
}
