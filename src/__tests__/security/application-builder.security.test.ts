import { NextRequest } from "next/server";
import { signAccessToken } from "../../core/auth/jwt";
import {
  GET as getAppDetail,
  PUT as updateApp,
} from "../../app/api/v1/applications/[id]/route";

export async function runApplicationBuilderSecurityTests() {
  console.log("--- Testing Application Builder Tenant Isolation Security ---");

  const tenantA = "tenant-sec-a-999";
  const tenantB = "tenant-sec-b-888";
  const userB = "user-sec-b";
  const tokenB = await signAccessToken({
    sub: userB,
    role: "ADMIN" as any,
    orgId: tenantB,
  });

  const mockAppTenantAId = "00000000-0000-0000-0000-000000000001";

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${tokenB}`,
  };

  // Attempt to view Tenant A's app using Tenant B's JWT context
  const getReq = new NextRequest(
    `http://localhost:3000/api/v1/applications/${mockAppTenantAId}`,
    {
      method: "GET",
      headers: authHeaders,
    },
  );
  const getRes = await getAppDetail(getReq, {
    params: Promise.resolve({ id: mockAppTenantAId }),
  } as any);

  const getStatus = getRes.status;
  if (getStatus !== 404 && getStatus !== 403) {
    throw new Error(
      `Security Failure: Tenant B was able to access Tenant A's application detail! Status: ${getStatus}`,
    );
  }

  // Attempt to modify Tenant A's app using Tenant B's JWT context
  const putReq = new NextRequest(
    `http://localhost:3000/api/v1/applications/${mockAppTenantAId}`,
    {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify({ name: "Hacked Application Name" }),
    },
  );
  const putRes = await updateApp(putReq, {
    params: Promise.resolve({ id: mockAppTenantAId }),
  } as any);

  const putStatus = putRes.status;
  if (putStatus !== 404 && putStatus !== 403) {
    throw new Error(
      `Security Failure: Tenant B was able to update Tenant A's application! Status: ${putStatus}`,
    );
  }

  console.log("✅ Application Builder Tenant Isolation Security Tests PASSED");
}
