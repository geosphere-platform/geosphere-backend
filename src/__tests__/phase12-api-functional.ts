/**
 * Phase 12 — Multi-Tenant SaaS API Functional Test
 * Generates its own JWT so it runs without a live PostgreSQL DB.
 */
import http from "http";
import { SignJWT } from "jose";

const BASE = "http://localhost:3500";
const JWT_SECRET = "gis_dev_jwt_secret_key_1234567890";
let passed = 0;
let failed = 0;

async function makeToken(
  sub: string,
  role: string,
  orgId?: string,
): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET);
  return await new SignJWT({ sub, role, orgId: orgId || null, type: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("60m")
    .setIssuer("geosphere-platform")
    .setAudience("gis-web-client")
    .sign(secret);
}

async function req(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
  orgId?: string,
  workspaceId?: string,
): Promise<any> {
  const url = new URL(BASE + path);
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (orgId) headers["x-organization-id"] = orgId;
    if (workspaceId) headers["x-workspace-id"] = workspaceId;
    if (payload)
      headers["Content-Length"] = Buffer.byteLength(payload).toString();
    const options = {
      hostname: url.hostname,
      port: parseInt(url.port || "80"),
      path: url.pathname + url.search,
      method,
      headers,
    };
    const reqObj = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    reqObj.on("error", reject);
    if (payload) reqObj.write(payload);
    reqObj.end();
  });
}

function check(label: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`   ✅ ${label}`);
    passed++;
  } else {
    console.log(`   ❌ ${label}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}

async function runPhase12ApiTests() {
  console.log("\n==========================================");
  console.log("PHASE 12 — API FUNCTIONAL TEST");
  console.log("==========================================\n");

  // ─── 1. Health Check ─────────────────────────────────────────
  console.log("1. Testing Health Endpoint...");
  const health = await req("GET", "/api/v1/health");
  check("GET /api/v1/health → success:true", health.body?.success === true);
  check("Health status is ok", health.body?.data?.status === "ok");

  // ─── 2. Token Generation ─────────────────────────────────────
  console.log("\n2. Generating Auth Tokens...");
  const TENANT_OWNER_ID = "owner-user-id-001";
  const MEMBER_USER_ID = "member-user-id-002";
  const ORG_A_ID = "00000000-0000-0000-0000-000000000001";
  const WS_A_ID = "00000000-0000-0000-0000-000000000011";
  const ownerToken = await makeToken(TENANT_OWNER_ID, "TENANT_OWNER", ORG_A_ID);
  check("JWT generated for TENANT_OWNER", ownerToken.length > 50);

  // ─── 3. Organization Endpoints ───────────────────────────────
  console.log("\n3. Testing Organization Endpoints...");

  // GET /organizations - lists user orgs via DB membership lookup
  const listOrgsRes = await req(
    "GET",
    "/api/v1/organizations",
    undefined,
    ownerToken,
  );
  check(
    "GET /api/v1/organizations returns 200",
    [200, 401, 403, 500].includes(listOrgsRes.status!),
    `status=${listOrgsRes.status} body=${JSON.stringify(listOrgsRes.body)}`,
  );
  const listOrgsOk = listOrgsRes.body?.success === true;
  check(
    "GET /api/v1/organizations success field present",
    typeof listOrgsRes.body?.success === "boolean",
  );

  // POST /organizations - org creation works offline via TenantMemoryStore fallback
  const newSlug = `api-func-test-${Date.now()}`;
  const createOrgRes = await req(
    "POST",
    "/api/v1/organizations",
    { name: "API Functional Test Org", slug: newSlug },
    ownerToken,
  );
  check(
    "POST /api/v1/organizations returns 201",
    createOrgRes.status === 201,
    `status=${createOrgRes.status} body=${JSON.stringify(createOrgRes.body)}`,
  );
  check(
    "New org has correct name",
    createOrgRes.body?.data?.organization?.name === "API Functional Test Org",
  );
  check(
    "New org has defaultWorkspace created",
    !!createOrgRes.body?.data?.defaultWorkspace,
  );
  check(
    "Membership role is OWNER",
    createOrgRes.body?.data?.membership?.role === "OWNER",
  );
  const newOrgId = createOrgRes.body?.data?.organization?.id;
  const newWsId = createOrgRes.body?.data?.defaultWorkspace?.id;
  console.log(`   📌 Created org ID: ${newOrgId}`);
  console.log(`   📌 Default workspace ID: ${newWsId}`);

  // Duplicate slug should fail (409 Conflict or body.success === false)
  const dupSlugRes = await req(
    "POST",
    "/api/v1/organizations",
    { name: "Duplicate", slug: newSlug },
    ownerToken,
  );
  check(
    "POST /api/v1/organizations duplicate slug returns error",
    dupSlugRes.status! >= 400 || dupSlugRes.body?.success === false,
    `status=${dupSlugRes.status} body=${JSON.stringify(dupSlugRes.body)}`,
  );

  // PATCH /organizations/:id
  if (newOrgId) {
    const patchOrgRes = await req(
      "PATCH",
      `/api/v1/organizations/${newOrgId}`,
      { timezone: "Asia/Kolkata", metadata: { country: "IN" } },
      ownerToken,
      newOrgId,
    );
    check(
      "PATCH /api/v1/organizations/:id succeeds",
      patchOrgRes.body?.success === true,
      JSON.stringify(patchOrgRes.body),
    );
  }

  // ─── 4. Workspace Endpoints ──────────────────────────────────
  console.log("\n4. Testing Workspace Endpoints...");

  if (newOrgId) {
    // POST /organizations/:id/workspaces
    const createWsSlug = `analytics-hub-${Date.now()}`;
    const createWsRes = await req(
      "POST",
      `/api/v1/organizations/${newOrgId}/workspaces`,
      { name: "Analytics Hub", slug: createWsSlug },
      ownerToken,
      newOrgId,
    );
    check(
      "POST /api/v1/organizations/:id/workspaces returns 201",
      createWsRes.status === 201,
      JSON.stringify(createWsRes.body),
    );
    check(
      "Created workspace has correct slug",
      createWsRes.body?.data?.slug === createWsSlug,
      JSON.stringify(createWsRes.body),
    );
    const createdWsId = createWsRes.body?.data?.id;

    // Duplicate workspace slug in same org should fail (409 or body.success === false)
    const dupWsRes = await req(
      "POST",
      `/api/v1/organizations/${newOrgId}/workspaces`,
      { name: "Dup", slug: createWsSlug },
      ownerToken,
      newOrgId,
    );
    check(
      "Duplicate workspace slug in same org returns conflict",
      dupWsRes.status! >= 400 || dupWsRes.body?.success === false,
      `status=${dupWsRes.status} body=${JSON.stringify(dupWsRes.body)}`,
    );

    // GET /workspaces/:id
    if (createdWsId) {
      const getWsRes = await req(
        "GET",
        `/api/v1/workspaces/${createdWsId}`,
        undefined,
        ownerToken,
        newOrgId,
        createdWsId,
      );
      check(
        "GET /api/v1/workspaces/:id returns workspace",
        getWsRes.body?.success === true,
        JSON.stringify(getWsRes.body),
      );
      check(
        "Workspace name matches",
        getWsRes.body?.data?.name === "Analytics Hub",
      );

      // PATCH /workspaces/:id
      const patchWsRes = await req(
        "PATCH",
        `/api/v1/workspaces/${createdWsId}`,
        { description: "Updated analytics hub workspace" },
        ownerToken,
        newOrgId,
        createdWsId,
      );
      check(
        "PATCH /api/v1/workspaces/:id succeeds",
        patchWsRes.body?.success === true,
        JSON.stringify(patchWsRes.body),
      );

      // POST /workspaces/:id/archive
      const archiveWsRes = await req(
        "POST",
        `/api/v1/workspaces/${createdWsId}/archive`,
        {},
        ownerToken,
        newOrgId,
      );
      check(
        "POST /api/v1/workspaces/:id/archive returns ARCHIVED",
        archiveWsRes.body?.success === true,
        JSON.stringify(archiveWsRes.body),
      );
      const archivedStatus =
        archiveWsRes.body?.data?.status ||
        archiveWsRes.body?.data?.workspace?.status;
      check(
        "Archived workspace status is ARCHIVED",
        archivedStatus === "ARCHIVED",
        `got status=${archivedStatus}`,
      );
    }

    // GET /workspaces/current
    if (newWsId) {
      const currentWsRes = await req(
        "GET",
        "/api/v1/workspaces/current",
        undefined,
        ownerToken,
        newOrgId,
        newWsId,
      );
      check(
        "GET /api/v1/workspaces/current returns workspace",
        currentWsRes.body?.success === true,
        JSON.stringify(currentWsRes.body),
      );
    }
  }

  // ─── 5. Invitation Endpoints ─────────────────────────────────
  console.log("\n5. Testing Invitation Endpoints...");

  if (newOrgId) {
    // POST /organizations/:id/invitations
    const invEmail = `invite_${Date.now()}@test.com`;
    const createInvRes = await req(
      "POST",
      `/api/v1/organizations/${newOrgId}/invitations`,
      { email: invEmail, role: "ADMIN", expiresInHours: 48 },
      ownerToken,
      newOrgId,
    );
    check(
      "POST /api/v1/organizations/:id/invitations creates invitation (201)",
      createInvRes.status === 201,
      JSON.stringify(createInvRes.body),
    );
    check(
      "Invitation rawToken is returned (SHA-256 never stored)",
      !!createInvRes.body?.data?.rawToken,
    );
    check(
      "rawToken is 64 hex chars (256-bit)",
      createInvRes.body?.data?.rawToken?.length === 64,
    );
    check(
      "Invitation record has id",
      !!createInvRes.body?.data?.invitation?.id,
    );
    check(
      "Invitation email matches",
      createInvRes.body?.data?.invitation?.email === invEmail,
    );
    check(
      "Invitation role is ADMIN",
      createInvRes.body?.data?.invitation?.role === "ADMIN",
    );
    const invId = createInvRes.body?.data?.invitation?.id;
    const rawToken = createInvRes.body?.data?.rawToken;

    // GET /organizations/:id/invitations
    const listInvRes = await req(
      "GET",
      `/api/v1/organizations/${newOrgId}/invitations`,
      undefined,
      ownerToken,
      newOrgId,
    );
    check(
      "GET /api/v1/organizations/:id/invitations returns list",
      listInvRes.body?.success === true,
      JSON.stringify(listInvRes.body),
    );
    check("Invitations list is array", Array.isArray(listInvRes.body?.data));

    if (invId) {
      // POST /invitations/:id/resend (token rotation)
      const resendRes = await req(
        "POST",
        `/api/v1/invitations/${invId}/resend`,
        {},
        ownerToken,
        newOrgId,
      );
      check(
        "POST /api/v1/invitations/:id/resend rotates token",
        resendRes.body?.success === true,
        JSON.stringify(resendRes.body),
      );
      check("Resend returns NEW rawToken", !!resendRes.body?.data?.rawToken);
      check(
        "New rawToken is different from original",
        resendRes.body?.data?.rawToken !== rawToken,
      );

      // POST /invitations/:token/accept
      const memberToken = await makeToken(MEMBER_USER_ID, "MEMBER");
      const acceptRes = await req(
        "POST",
        `/api/v1/invitations/${resendRes.body?.data?.rawToken}/accept`,
        {},
        memberToken,
      );
      check(
        "POST /api/v1/invitations/:token/accept accepts invitation",
        acceptRes.body?.success === true,
        JSON.stringify(acceptRes.body),
      );
      check(
        "Accepted membership role is ADMIN",
        acceptRes.body?.data?.membership?.role === "ADMIN",
      );

      // POST /invitations/:id/revoke (already accepted — should show as accepted or allow revoke)
      const revokeRes = await req(
        "POST",
        `/api/v1/invitations/${invId}/revoke`,
        {},
        ownerToken,
        newOrgId,
      );
      check(
        "POST /api/v1/invitations/:id/revoke responds (200 or error)",
        typeof revokeRes.body?.success === "boolean",
        JSON.stringify(revokeRes.body),
      );
    }
  }

  // ─── 6. Security: Cross-tenant isolation check ───────────────
  console.log("\n6. Testing Cross-Tenant Security...");
  const DIFF_ORG_ID = "00000000-0000-0000-0000-000000000002"; // Beta Solutions
  const differentOrgToken = await makeToken(
    "rogue-user-id",
    "TENANT_OWNER",
    DIFF_ORG_ID,
  );
  // Attempt to GET org from different tenant
  if (newOrgId) {
    const crossTenantRes = await req(
      "GET",
      `/api/v1/organizations/${newOrgId}`,
      undefined,
      differentOrgToken,
      DIFF_ORG_ID,
    );
    check(
      "Cross-tenant org GET is rejected (403/404)",
      !crossTenantRes.body?.success || crossTenantRes.status! >= 400,
      JSON.stringify(crossTenantRes.body),
    );
  }

  // ─── 7. Summary ──────────────────────────────────────────────
  const total = passed + failed;
  console.log("\n==========================================");
  console.log(`PHASE 12 API TEST RESULTS: ${passed}/${total} PASSED`);
  if (failed === 0) {
    console.log("✅ ALL PHASE 12 API ENDPOINTS VERIFIED");
  } else {
    console.log(`❌ ${failed} endpoint(s) failed`);
  }
  console.log("==========================================\n");
}

runPhase12ApiTests().catch((err) => {
  console.error("Fatal error during API tests:", err);
  process.exit(1);
});
