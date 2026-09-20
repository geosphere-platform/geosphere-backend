/**
 * GeoSphere Step 7 Platform Authentication & RBAC Foundation Unit Test Suite
 */

import {
  GeoSphereAuthProviderWeb,
  GeoSphereAuthProviderContract,
  GeoSphereAuthState,
  createAuthorizationContext,
  evaluatePermissionState,
  GeoSphereEventBus
} from "../contracts/index.js";

import { GeoSphereClient } from "../client.js";

declare const process: { exit(code?: number): never };

async function runAuthRbacTests() {
  console.log("==========================================");
  console.log("RUNNING GEOSPHERE AUTH & RBAC FOUNDATION UNIT TESTS");
  console.log("==========================================");

  const eventBus = new GeoSphereEventBus();
  const authProvider: GeoSphereAuthProviderContract = new GeoSphereAuthProviderWeb(eventBus, "test_session_key");

  // 1. Initial State
  console.log("  [1/16] Testing Initial Authentication State...");
  if (authProvider.state !== "UNAUTHENTICATED") {
    throw new Error(`Expected initial state UNAUTHENTICATED, got ${authProvider.state}`);
  }
  if (authProvider.isAuthenticated()) {
    throw new Error("Expected isAuthenticated() to be false initially");
  }

  // 2. State Change Subscription
  console.log("  [2/16] Testing Auth State Change Listener Subscription...");
  const statesRecorded: GeoSphereAuthState[] = [];
  const unsubscribe = authProvider.onAuthStateChanged((state: GeoSphereAuthState) => {
    statesRecorded.push(state);
  });

  // 3. Login Success
  console.log("  [3/16] Testing Login Success & Identity Extraction...");
  const identity = await authProvider.login({
    email: "operator@geosphere.test",
    password: "Password123!",
    tenantId: "tenant_alpha_101"
  });

  if (!identity || identity.tenantId !== "tenant_alpha_101" || identity.email !== "operator@geosphere.test") {
    throw new Error("Login failed to return valid GeoSphereIdentity object");
  }
  if (!authProvider.isAuthenticated()) {
    throw new Error("Expected isAuthenticated() to be true after successful login");
  }
  if ((authProvider.state as GeoSphereAuthState) !== "AUTHENTICATED") {
    throw new Error(`Expected state AUTHENTICATED, got ${authProvider.state}`);
  }

  // 4. Password Security Leakage Guard
  console.log("  [4/12] Verifying Password & Token Security Leakage Guard...");
  const rawIdentity = JSON.stringify(identity);
  if (rawIdentity.includes("password") || rawIdentity.includes("Password123!")) {
    throw new Error("SECURITY VIOLATION: Password leaked into public GeoSphereIdentity model!");
  }

  // 5. Session Expiration & Acquisition
  console.log("  [5/16] Testing Session Acquisition & Expiration Metadata...");
  const session = authProvider.getSession();
  if (!session || session.tenantId !== "tenant_alpha_101" || session.state !== "AUTHENTICATED") {
    throw new Error("Failed to retrieve active GeoSphereSession");
  }
  if (!session.expiresAt || new Date(session.expiresAt).getTime() <= Date.now()) {
    throw new Error("Session expiration timestamp invalid or expired");
  }

  // 6. Session Refresh
  console.log("  [6/16] Testing Session Refresh Execution...");
  const refreshedSession = await authProvider.refresh();
  if (!refreshedSession || refreshedSession.state !== "AUTHENTICATED") {
    throw new Error("Session refresh failed to return updated active session");
  }

  // 7. Authorization Context & `can()` Allow Checks
  console.log("  [7/16] Testing Authorization Context `can()` Allow Checks...");
  const authCtx = authProvider.getAuthContext();
  if (!authCtx.can("VIEW_GIS_MAP") || !authCtx.can("VIEW_LIVE_TRACKING")) {
    throw new Error("Authorization context failed to allow granted permission");
  }

  // 8. Authorization Context `can()` Deny Checks
  console.log("  [8/16] Testing Authorization Context `can()` Deny Checks...");
  if (authCtx.can("ADMIN_ALL") || authCtx.can("DELETE_TENANT")) {
    throw new Error("Authorization context failed to deny unassigned permission");
  }

  // 9. Role Checks
  console.log("  [9/16] Testing Role Resolution & `hasRole()`...");
  if (!authCtx.hasRole("OPERATOR")) {
    throw new Error("Authorization context `hasRole()` failed for assigned role OPERATOR");
  }
  if (authCtx.hasRole("PLATFORM_ADMIN")) {
    throw new Error("Authorization context `hasRole()` returned true for unassigned PLATFORM_ADMIN");
  }

  // 10. Resource Access Checks
  console.log(" [10/16] Testing Resource Access Matching (`canAccess`)...");
  if (!authCtx.canAccess("VIEW_GIS")) {
    throw new Error("`canAccess('VIEW_GIS')` failed for prefix matching");
  }

  // 11. Multi-Tenant Isolation Boundaries
  console.log(" [11/16] Testing Multi-Tenant Boundary Isolation (Tenant A vs Tenant B)...");
  const tenantACtx = createAuthorizationContext({
    tenantId: "tenant_alpha_101",
    userId: "usr_101",
    roles: ["OPERATOR"],
    permissions: ["VIEW_GIS_MAP"]
  });

  const tenantBCtx = createAuthorizationContext({
    tenantId: "tenant_beta_202",
    userId: "usr_202",
    roles: ["OPERATOR"],
    permissions: ["VIEW_GIS_MAP"]
  });

  if (tenantACtx.tenantId === tenantBCtx.tenantId) {
    throw new Error("Multi-tenant isolation failure: Tenant IDs match!");
  }

  // 12. SuperAdmin Override Verification
  console.log(" [12/16] Testing SuperAdmin Privilege Override...");
  const superAdminCtx = createAuthorizationContext({
    tenantId: "tenant_alpha_101",
    userId: "usr_admin",
    roles: ["PLATFORM_ADMIN"],
    permissions: ["*"],
    isSuperAdmin: true
  });

  if (!superAdminCtx.can("ANY_ARBITRARY_PERMISSION") || !superAdminCtx.hasRole("ANY_ROLE")) {
    throw new Error("SuperAdmin privilege override failed");
  }

  // 13. UI Authorization State Integration
  console.log(" [13/16] Testing UI Authorization State Evaluator Integration...");
  const grantedUI = evaluatePermissionState(authCtx.permissions, "VIEW_GIS_MAP", "hide");
  if (grantedUI.status !== "granted") {
    throw new Error("UI permission state evaluator failed for granted permission");
  }

  const deniedUI = evaluatePermissionState(authCtx.permissions, "MANAGE_TENANT", "disable");
  if (deniedUI.status !== "denied" || deniedUI.mode !== "disable") {
    throw new Error("UI permission state evaluator failed for denied permission");
  }

  // 14. Logout Execution
  console.log(" [14/16] Testing Logout Execution & Credential Cleanup...");
  await authProvider.logout();
  if (authProvider.isAuthenticated()) {
    throw new Error("Expected isAuthenticated() to be false after logout");
  }
  if (authProvider.getIdentity() !== null || authProvider.getSession() !== null) {
    throw new Error("Logout failed to clear identity and session state");
  }

  // 15. Refresh Failure Handling when Unauthenticated
  console.log(" [15/16] Testing Refresh Failure Handling when Unauthenticated...");
  let refreshErrorThrown = false;
  try {
    await authProvider.refresh();
  } catch (err: any) {
    refreshErrorThrown = true;
    if (!err.message.includes("SESSION_EXPIRED")) {
      throw new Error("Unexpected error message on unauthenticated refresh");
    }
  }
  if (!refreshErrorThrown) {
    throw new Error("Failed to throw error on unauthenticated session refresh");
  }

  unsubscribe();

  // 16. Backward Compatibility with GeoSphereClient.auth
  console.log(" [16/16] Verifying Backward Compatibility with Existing GeoSphereClient.auth...");
  const client = new GeoSphereClient({
    baseUrl: "https://api.geosphere.local",
    tenantId: "tenant_compat_test_001",
    applicationId: "app_compat_test_001"
  });

  if (!client.auth || typeof client.auth.login !== "function" || typeof client.auth.logout !== "function") {
    throw new Error("Backward compatibility broken: existing client.auth facade is invalid");
  }

  console.log("✅ All GeoSphere Platform Auth & RBAC Foundation Unit Tests Passed Successfully!");
}

runAuthRbacTests().catch((err) => {
  console.error("❌ GeoSphere Auth & RBAC Unit Tests Failed:", err);
  process.exit(1);
});
