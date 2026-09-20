/**
 * Framework-Independent Form Repository Abstraction
 *
 * Defines the interface for querying and persisting FormSchemas and FormSubmissions.
 * Provides a pure in-memory repository implementation for headless execution and unit tests.
 */

import { FormSchema, FormSubmission } from "../types/form.types";

export interface IFormRepository {
  saveSchema(schema: FormSchema): Promise<void>;
  getSchema(id: string): Promise<FormSchema | null>;
  listSchemas(): Promise<FormSchema[]>;
  saveSubmission(submission: FormSubmission): Promise<void>;
  listSubmissions(schemaId?: string): Promise<FormSubmission[]>;
  clear(): Promise<void>;
}

export class InMemoryFormRepository implements IFormRepository {
  private readonly schemas = new Map<string, FormSchema>();
  private readonly submissions: FormSubmission[] = [];

  async saveSchema(schema: FormSchema): Promise<void> {
    this.schemas.set(schema.id, { ...schema });
  }

  async getSchema(id: string): Promise<FormSchema | null> {
    const s = this.schemas.get(id);
    return s ? { ...s } : null;
  }

  async listSchemas(): Promise<FormSchema[]> {
    return Array.from(this.schemas.values())
      .filter((s) => s.enabled)
      .map((s) => ({ ...s }));
  }

  async saveSubmission(submission: FormSubmission): Promise<void> {
    this.submissions.push({ ...submission });
  }

  async listSubmissions(schemaId?: string): Promise<FormSubmission[]> {
    if (!schemaId) {
      return this.submissions.map((sub) => ({ ...sub }));
    }
    return this.submissions
      .filter((sub) => sub.schemaId === schemaId)
      .map((sub) => ({ ...sub }));
  }

  async clear(): Promise<void> {
    this.schemas.clear();
    this.submissions.length = 0;
  }
}
