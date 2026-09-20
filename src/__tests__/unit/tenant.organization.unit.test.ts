import { OrganizationService } from "../../core/tenant/organization.service";
import assert from "assert";

export function runOrganizationUnitTests() {
  console.log("   --> Testing Slug Normalization & Validation...");
  assert.strictEqual(
    OrganizationService.normalizeSlug("Acme Logistics  "),
    "acme-logistics",
  );
  assert.strictEqual(
    OrganizationService.normalizeSlug("  Beta & Gamma Solutions!! "),
    "beta-gamma-solutions",
  );
  assert.strictEqual(
    OrganizationService.normalizeSlug("TEST--ORGANIZATION"),
    "test-organization",
  );

  assert.throws(
    () => OrganizationService.normalizeSlug("a"),
    /between 2 and 100/,
  );

  console.log("   ✅ Organization Unit Tests Passed.");
}

if (require.main === module) {
  runOrganizationUnitTests();
}
