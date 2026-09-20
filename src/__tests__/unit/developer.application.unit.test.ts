import { applicationService } from "../../core/developer/application.service";
import { db } from "../../database";
import {
  applicationsTable,
  apiKeysTable,
} from "../../database/schema/developer-portal";
import { eq } from "drizzle-orm";

export function runDeveloperApplicationUnitTests() {
  console.log("Testing Developer Application Service...");

  const testOrgId = "00000000-0000-0000-0000-000000000001";
  let createdAppId: string;

  // Test 1: Create application
  const testCreate = async () => {
    const app = await applicationService.createApplication({
      organizationId: testOrgId,
      name: "Unit Test App",
      description: "Test application for unit tests",
      type: "WEB",
      environment: "DEVELOPMENT",
      allowedOrigins: ["http://localhost:3000"],
      scopeCodes: ["gis:read", "layers:read"],
    });

    if (!app.id || !app.clientId.startsWith("app_deve_")) {
      throw new Error(
        "Application creation failed or client ID format invalid",
      );
    }
    if (app.grantedScopes.length !== 2) {
      throw new Error("Granted scopes count mismatch");
    }
    createdAppId = app.id;
  };

  // Test 2: List applications
  const testList = async () => {
    const apps = await applicationService.listApplications(testOrgId);
    if (apps.length === 0) {
      throw new Error("Application listing returned empty array");
    }
  };

  // Test 3: Get application details
  const testGetDetails = async () => {
    const details = await applicationService.getApplicationDetails(
      createdAppId,
      testOrgId,
    );
    if (
      details.name !== "Unit Test App" ||
      details.grantedScopes.length !== 2
    ) {
      throw new Error("Get application details failed");
    }
  };

  // Test 4: Update application
  const testUpdate = async () => {
    const updated = await applicationService.updateApplication(
      createdAppId,
      testOrgId,
      {
        name: "Updated Unit Test App",
        allowedOrigins: ["http://localhost:3000", "https://test.com"],
      },
    );

    if (
      updated.name !== "Updated Unit Test App" ||
      (updated.allowedOrigins as string[]).length !== 2
    ) {
      throw new Error("Application update failed");
    }
  };

  // Test 5: Suspend and Reactivate
  const testSuspendReactivate = async () => {
    const suspended = await applicationService.suspendApplication(
      createdAppId,
      testOrgId,
    );
    if (suspended.status !== "SUSPENDED") {
      throw new Error("Application suspension failed");
    }

    const reactivated = await applicationService.reactivateApplication(
      createdAppId,
      testOrgId,
    );
    if (reactivated.status !== "ACTIVE") {
      throw new Error("Application reactivation failed");
    }
  };

  // Execute synchronously in test runner wrapper
  return (async () => {
    await testCreate();
    await testList();
    await testGetDetails();
    await testUpdate();
    await testSuspendReactivate();
  })();
}
