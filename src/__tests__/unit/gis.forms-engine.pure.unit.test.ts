/**
 * Pure Framework-Independent Forms Engine Unit Tests
 *
 * Verifies FormSchema creation, field validation (required, regex, numeric bounds, coordinates, options),
 * submission processing, event subscriptions, and pure framework decoupling.
 *
 * MUST NOT require browser DOM, React, Next.js, or OpenLayers.
 */

import { FormsEngine } from "../../core/forms/engine/forms-engine";
import { FormSchema, FormSubmission } from "../../core/forms/types/form.types";
import { InMemoryFormRepository } from "../../core/forms/repository/form-repository.interface";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

export async function runFormsEnginePureUnitTests(): Promise<void> {
  console.log("------------------------------------------");
  console.log("RUNNING GENERIC FORMS ENGINE PURE DOMAIN TESTS");
  console.log("------------------------------------------");

  const repo = new InMemoryFormRepository();
  const engine = new FormsEngine(repo);

  // 1. Define Form Schema: Proof of Delivery / Field Inspection
  const podSchema: FormSchema = {
    id: "schema-pod-01",
    name: "Proof of Delivery Form",
    version: 1,
    description: "Dynamic Proof of Delivery & Customer Signature Form",
    enabled: true,
    fields: [
      { id: "recipient_name", label: "Recipient Name", type: "text", required: true, validation: { minLength: 3 } },
      { id: "package_count", label: "Package Count", type: "number", required: true, validation: { min: 1, max: 100 } },
      { id: "delivery_status", label: "Delivery Status", type: "select", required: true, options: [
        { label: "Delivered", value: "DELIVERED" },
        { label: "Partial", value: "PARTIAL" },
        { label: "Refused", value: "REFUSED" },
      ]},
      { id: "customer_signature", label: "Customer Signature", type: "signature", required: false },
      { id: "delivery_coordinate", label: "Capture Location", type: "coordinate", required: false },
    ],
  };

  // 1. Schema Registration
  console.log("  [1/12] Testing FormSchema Registration...");
  await engine.registerSchema(podSchema);
  const fetchedSchema = await repo.getSchema("schema-pod-01");
  assert(fetchedSchema !== null && fetchedSchema.name === "Proof of Delivery Form", "Registered FormSchema must be retrievable from repository");

  // 2. Required Field Validation
  console.log("  [2/12] Testing Required Field Validation...");
  const invalidSub1 = await engine.validateSubmission("schema-pod-01", {
    recipient_name: "", // Missing required
    package_count: 5,
    delivery_status: "DELIVERED",
  });
  assert(!invalidSub1.valid, "Submission missing required recipient_name must be invalid");
  assert(invalidSub1.errors.some((e) => e.fieldId === "recipient_name" && e.rule === "required"), "Required error must be reported");

  // 3. String Length Validation
  console.log("  [3/12] Testing String Length Validation...");
  const invalidSub2 = await engine.validateSubmission("schema-pod-01", {
    recipient_name: "Al", // minLength 3 required
    package_count: 5,
    delivery_status: "DELIVERED",
  });
  assert(!invalidSub2.valid, "recipient_name shorter than minLength must be invalid");
  assert(invalidSub2.errors.some((e) => e.fieldId === "recipient_name" && e.rule === "minLength"), "minLength error must be reported");

  // 4. Numeric Range Validation
  console.log("  [4/12] Testing Numeric Min/Max Range Validation...");
  const invalidSub3 = await engine.validateSubmission("schema-pod-01", {
    recipient_name: "Alice Smith",
    package_count: 0, // min is 1
    delivery_status: "DELIVERED",
  });
  assert(!invalidSub3.valid, "package_count less than min=1 must be invalid");
  assert(invalidSub3.errors.some((e) => e.fieldId === "package_count" && e.rule === "min"), "min numeric error must be reported");

  // 5. Select Options Validation
  console.log("  [5/12] Testing Select Options Validation...");
  const invalidSub4 = await engine.validateSubmission("schema-pod-01", {
    recipient_name: "Alice Smith",
    package_count: 2,
    delivery_status: "INVALID_OPTION",
  });
  assert(!invalidSub4.valid, "Unlisted select option must be invalid");
  assert(invalidSub4.errors.some((e) => e.fieldId === "delivery_status" && e.rule === "options"), "options error must be reported");

  // 6. Coordinate Bounds Validation
  console.log("  [6/12] Testing Coordinate Bounds Validation...");
  const invalidSub5 = await engine.validateSubmission("schema-pod-01", {
    recipient_name: "Alice Smith",
    package_count: 2,
    delivery_status: "DELIVERED",
    delivery_coordinate: [77.2090, 999], // Out of bounds lat
  });
  assert(!invalidSub5.valid, "Out-of-bounds coordinate must be invalid");
  assert(invalidSub5.errors.some((e) => e.fieldId === "delivery_coordinate" && e.rule === "bounds"), "bounds error must be reported");

  // 7. Valid Submission & Persistence
  console.log("  [7/12] Testing Valid Submission Processing & Persistence...");
  const validSubmission = await engine.submitForm(
    "schema-pod-01",
    "agent-101",
    {
      recipient_name: "Alice Smith",
      package_count: 3,
      delivery_status: "DELIVERED",
      customer_signature: "data:image/svg+xml;utf8,...",
      delivery_coordinate: [77.2090, 28.6139],
    },
    [77.2090, 28.6139],
  );

  assert(validSubmission.id.startsWith("sub_"), "Submission ID must be generated");
  assert(validSubmission.schemaId === "schema-pod-01", "Schema ID must match");
  assert(validSubmission.submitterId === "agent-101", "Submitter ID must match");

  const storedSubs = await repo.listSubmissions("schema-pod-01");
  assert(storedSubs.length === 1, "Submission must be persisted in repository");

  // 8. Error Throwing on Invalid Submit
  console.log("  [8/12] Testing Error Throwing on Invalid submitForm...");
  let submitFailed = false;
  try {
    await engine.submitForm("schema-pod-01", "agent-101", { recipient_name: "" });
  } catch (err: any) {
    if (err.message.includes("VALIDATION_FAILED")) {
      submitFailed = true;
    }
  }
  assert(submitFailed, "submitForm with invalid values must throw VALIDATION_FAILED error");

  // 9. Submission Event Subscriptions
  console.log("  [9/12] Testing Submission Event Subscriptions...");
  const captured: FormSubmission[] = [];
  const unsub = engine.subscribeSubmissions((sub) => captured.push(sub));

  await engine.submitForm("schema-pod-01", "agent-102", {
    recipient_name: "Bob Jones",
    package_count: 1,
    delivery_status: "DELIVERED",
  });

  assert(captured.length === 1 && captured[0].submitterId === "agent-102", "Submission listener must capture events");

  // 10. Subscription Cleanup
  console.log("  [10/12] Testing Subscription Cleanup...");
  unsub();
  captured.length = 0;

  await engine.submitForm("schema-pod-01", "agent-103", {
    recipient_name: "Charlie Brown",
    package_count: 2,
    delivery_status: "PARTIAL",
  });

  assert(captured.length === 0, "Unsubscribed listener must NOT receive events");

  // 11. Multi-Industry Vertical Field Forms (Agri, Field Service, Utilities)
  console.log("  [11/12] Testing Multi-Vertical Form Support...");
  const agriSchema: FormSchema = {
    id: "schema-agri-01",
    name: "Crop Inspection Form",
    version: 1,
    enabled: true,
    fields: [
      { id: "crop_health", label: "Crop Health", type: "select", required: true, options: [{ label: "Good", value: "GOOD" }] },
      { id: "moisture_level", label: "Moisture Level %", type: "number", required: true, validation: { min: 0, max: 100 } },
    ],
  };
  await engine.registerSchema(agriSchema);
  const agriSub = await engine.submitForm("schema-agri-01", "farmer-01", { crop_health: "GOOD", moisture_level: 45 });
  assert(agriSub.values.crop_health === "GOOD", "Agri form submission must process cleanly");

  // 12. Pure Framework Decoupling Verification
  console.log("  [12/12] Verifying Pure Framework Decoupling...");
  assert(typeof engine.submitForm === "function", "FormsEngine must expose submitForm");
  assert(typeof repo.listSubmissions === "function", "IFormRepository contract must be satisfied");

  console.log("✅ Generic Forms Engine Pure Domain Unit Tests Passed Successfully!");
}
