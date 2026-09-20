/**
 * Framework-Independent FormsEngine Class
 *
 * Provides dynamic form schema management, submission validation, submission persistence,
 * spatial binding, and submission event broadcasting.
 *
 * MUST NOT depend on React, Next.js, OpenLayers, Android/iOS UI, or vehicle PII.
 */

import { Coordinate } from "../../gis/types/geometry";
import {
  FormSchema,
  FormSubmission,
  FormValidationResult,
  FormSubmissionListener,
} from "../types/form.types";
import { IFormRepository, InMemoryFormRepository } from "../repository/form-repository.interface";
import { FormValidator } from "../validator/form-validator";

export class FormsEngine {
  private readonly repository: IFormRepository;
  private readonly validator: FormValidator;
  private readonly listeners = new Set<FormSubmissionListener>();

  constructor(repository?: IFormRepository) {
    this.repository = repository ?? new InMemoryFormRepository();
    this.validator = new FormValidator();
  }

  public getRepository(): IFormRepository {
    return this.repository;
  }

  public subscribeSubmissions(listener: FormSubmissionListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public unsubscribeSubmissions(listener: FormSubmissionListener): void {
    this.listeners.delete(listener);
  }

  private notifyListeners(submission: FormSubmission): void {
    for (const listener of this.listeners) {
      try {
        listener(submission);
      } catch (err) {
        console.error("[FORMS-ENGINE:ERR] Submission listener error:", err);
      }
    }
  }

  /**
   * Register or update a FormSchema
   */
  public async registerSchema(schema: FormSchema): Promise<void> {
    if (!schema || !schema.id || !schema.name || !Array.isArray(schema.fields)) {
      throw new Error("[FORMS_ENGINE] Invalid FormSchema definition");
    }
    await this.repository.saveSchema(schema);
  }

  /**
   * Validate submission against a schema
   */
  public async validateSubmission(
    schemaId: string,
    values: Record<string, unknown>,
  ): Promise<FormValidationResult> {
    const schema = await this.repository.getSchema(schemaId);
    if (!schema) {
      return {
        valid: false,
        errors: [{ fieldId: "_schema", fieldLabel: "Schema", rule: "notFound", message: `FormSchema '${schemaId}' not found` }],
      };
    }
    return this.validator.validateSubmission(schema, values);
  }

  /**
   * Process and persist a FormSubmission
   */
  public async submitForm(
    schemaId: string,
    submitterId: string,
    values: Record<string, unknown>,
    coordinate?: Coordinate,
    metadata?: Record<string, unknown>,
  ): Promise<FormSubmission> {
    const schema = await this.repository.getSchema(schemaId);
    if (!schema) {
      throw new Error(`[FORMS_ENGINE] FormSchema '${schemaId}' not found`);
    }

    const validationResult = this.validator.validateSubmission(schema, values);
    if (!validationResult.valid) {
      const errorMsgs = validationResult.errors.map((e) => e.message).join("; ");
      throw new Error(`[FORMS_ENGINE:VALIDATION_FAILED] ${errorMsgs}`);
    }

    const submission: FormSubmission = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      schemaId,
      schemaVersion: schema.version,
      submitterId,
      values,
      coordinate,
      submittedAt: new Date().toISOString(),
      metadata,
    };

    await this.repository.saveSubmission(submission);
    this.notifyListeners(submission);

    return submission;
  }
}
