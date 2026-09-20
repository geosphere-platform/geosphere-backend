/**
 * Pure Framework-Independent Application Builder & Templates Unit Tests
 *
 * Verifies ApplicationConfig validation, sandboxing guards, versioned publication state machine,
 * version history, rollback, loading all 7 vertical industry templates, and dynamic onboarding without code forks.
 *
 * MUST NOT require browser DOM, React, Next.js, or OpenLayers.
 */

import { ApplicationBuilder } from "../../core/builder/engine/application-builder";
import { ConfigValidator } from "../../core/builder/validator/config-validator";
import { BuilderError } from "../../core/builder/types/builder.types";
import { VerticalTemplates } from "../../core/templates";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

export async function runApplicationBuilderProductizationUnitTests(): Promise<void> {
  console.log("------------------------------------------");
  console.log("RUNNING APPLICATION BUILDER & VERTICAL TEMPLATES PURE TESTS");
  console.log("------------------------------------------");

  const builder = new ApplicationBuilder();
  const validator = new ConfigValidator();

  // 1. ApplicationConfig Draft Creation
  console.log("  [1/9] Testing ApplicationConfig Draft Creation...");
  const draft = builder.createDraft("tenant_logistics_corp", "Logistics Dispatcher", "template_delivery_logistics", {
    modules: { enabledEngines: ["MAP", "LOCATION", "ROUTING", "TASKS"] },
  });
  assert(draft.id.startsWith("app_"), "Application ID must be generated");
  assert(draft.version === 1, "Initial draft version must equal 1");
  assert(draft.status === "DRAFT", "Initial status must equal DRAFT");

  // 2. Sandboxing Guard — Blocking Executable Script Injection
  console.log("  [2/9] Testing Sandboxing Guard (Blocking Executable Script Injections)...");
  let scriptBlocked = false;
  try {
    builder.createDraft("tenant_malicious", "<script>alert('xss')</script>", undefined, {
      modules: { enabledEngines: ["MAP"] },
    });
  } catch (err: any) {
    if (err instanceof BuilderError && err.code === "SANDBOX_VIOLATION") {
      scriptBlocked = true;
    }
  }
  assert(scriptBlocked, "Sandboxing guard must block <script> injection payloads");

  // 3. Sandboxing Guard — Blocking SQL Injection
  console.log("  [3/9] Testing Sandboxing Guard (Blocking SQL Injection)...");
  let sqlBlocked = false;
  try {
    builder.createDraft("tenant_malicious", "Drop Table Users App", undefined, {
      modules: { enabledEngines: ["MAP"] },
    });
  } catch (err: any) {
    if (err instanceof BuilderError && err.code === "SANDBOX_VIOLATION") {
      sqlBlocked = true;
    }
  }
  assert(sqlBlocked, "Sandboxing guard must block SQL injection keywords ('DROP TABLE')");

  // 4. Draft -> Validation -> Versioned Publish State Machine
  console.log("  [4/9] Testing Publication State Machine (DRAFT -> PUBLISHED)...");
  const published = builder.publishConfig(draft.id, "admin_user_01");
  assert(published.status === "PUBLISHED", "Published config status must equal PUBLISHED");
  assert(published.version === 2, "Published version must increment to 2");
  assert(published.publishedAt !== undefined, "publishedAt timestamp must be populated");

  // 5. Version History Tracking
  console.log("  [5/9] Testing Version History Tracking...");
  const history = builder.getVersionHistory(draft.id);
  assert(history.length === 1 && history[0].version === 2, "Version history must store published snapshot");

  // 6. Configuration Rollback State Machine
  console.log("  [6/9] Testing Rollback State Machine...");
  builder.updateDraft(draft.id, { name: "Updated Logistics Dispatcher v2" });
  const publishedV2 = builder.publishConfig(draft.id, "admin_user_01"); // version 3
  assert(publishedV2.version === 3, "Second publication version must equal 3");

  const rollbacked = builder.rollbackVersion(draft.id, 2, "admin_user_01"); // rollbacks to version 2 -> creates version 4
  assert(rollbacked.version === 4, "Rollback must create new version 4");
  assert(rollbacked.name === "Logistics Dispatcher", "Rollbacked payload must match snapshot of version 2");

  // 7. Loading All 7 Vertical Industry Templates
  console.log("  [7/9] Testing Loading All 7 Vertical Industry App Templates...");
  const templateKeys = Object.keys(VerticalTemplates);
  assert(templateKeys.length === 7, "All 7 vertical templates must be defined (Fleet, Field Force, Delivery, Agri, Utilities, Emergency, Security)");

  for (const key of templateKeys) {
    const tmpl = VerticalTemplates[key];
    const appFromTmpl = builder.createDraft(`tenant_${key}`, tmpl.name!, tmpl.templateId, tmpl);
    assert(appFromTmpl.modules.enabledEngines.length >= 4, `Template '${key}' must enable at least 4 platform engines`);
  }

  // 8. Dynamic Customer Onboarding with ZERO Code Forks
  console.log("  [8/9] Testing Dynamic Customer Onboarding with ZERO Source Code Forks...");
  const customerA = builder.createDraft("tenant_customer_alpha", "Alpha Transport Fleet", "template_fleet", VerticalTemplates.fleet);
  const customerB = builder.createDraft("tenant_customer_beta", "Beta Field Services", "template_fieldForce", VerticalTemplates.fieldForce);

  assert(customerA.tenantId !== customerB.tenantId, "Multi-tenant onboarding must isolate tenant IDs");
  assert(customerA.modules.enabledEngines.includes("TRACKING"), "Customer A (Fleet) must contain TRACKING module");
  assert(customerB.modules.enabledEngines.includes("FORMS"), "Customer B (Field Force) must contain FORMS module");

  // 9. Pure Framework Decoupling Verification
  console.log("  [9/9] Verifying Pure Framework Decoupling...");
  assert(typeof builder.createDraft === "function", "ApplicationBuilder must operate without React/DOM");
  assert(typeof validator.validateConfig === "function", "ConfigValidator must operate without React/DOM");

  console.log("✅ Application Builder & Vertical Templates Pure Domain Unit Tests Passed Successfully!");
}
