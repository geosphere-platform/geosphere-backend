import { WorkspaceService } from "../../core/tenant/workspace.service";
import assert from "assert";

export function runWorkspaceUnitTests() {
  console.log("   --> Testing Workspace Slug Normalization & Validation...");
  assert.strictEqual(
    WorkspaceService.normalizeSlug("  Operations Main  "),
    "operations-main",
  );
  assert.strictEqual(
    WorkspaceService.normalizeSlug("Analytics & Reporting!!"),
    "analytics-reporting",
  );

  assert.throws(() => WorkspaceService.normalizeSlug("x"), /between 2 and 100/);

  console.log("   ✅ Workspace Unit Tests Passed.");
}

if (require.main === module) {
  runWorkspaceUnitTests();
}
