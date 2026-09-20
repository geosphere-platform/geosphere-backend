/**
 * Spatial Filter Processor
 *
 * Converts validated SpatialQuery filters into safe, parameterized
 * Drizzle SQL fragments. Never concatenates user-supplied strings
 * directly into SQL — all values are passed as named parameters.
 *
 * Only whitelisted fields and operators are processed here.
 * All inputs MUST have passed SpatialQueryValidator first.
 */

import { sql, SQL } from "drizzle-orm";
import {
  FilterGroup,
  AttributeFilter,
  FilterOperator,
  TemporalFilter,
} from "./spatial-query.model";

// ─── Field-to-Column Mapping ─────────────────────────────────────────────────

/**
 * Maps a whitelisted field name to a safe SQL column expression.
 * Properties-prefixed fields use jsonb operator.
 * IMPORTANT: Column names here are hard-coded, never from user input.
 */
function fieldToColumn(field: string): string {
  // JSONB property fields — use ->> operator
  if (field.startsWith("properties.")) {
    const prop = field.substring("properties.".length);
    // Hardcoded prop list to prevent injection
    const SAFE_JSONB_PROPS = new Set([
      "status",
      "type",
      "name",
      "category",
      "priority",
      "value",
      "score",
      "active",
      "zoneType",
      "featureType",
      "externalId",
      "description",
    ]);
    if (!SAFE_JSONB_PROPS.has(prop)) {
      throw new Error(`JSONB property '${prop}' is not whitelisted`);
    }
    return `properties->>'${prop}'`;
  }

  // Direct column mappings
  const COLUMN_MAP: Record<string, string> = {
    type: "type",
    name: "name",
    externalId: "external_id",
    status: "type", // spatial features use 'type' for status-like grouping
    category: "type",
    source: "source",
    active: "active",
    priority: "type",
    description: "type",
    layerId: "tenant_id", // placeholder — actual layer filtering done separately
    zoneType: "type",
    featureType: "type",
    createdAt: "created_at",
    updatedAt: "updated_at",
    timestamp: "timestamp",
    subjectId: "subject_id",
    subjectType: "type",
    speed: "speed",
    heading: "heading",
    accuracy: "accuracy",
    altitude: "altitude",
  };

  const col = COLUMN_MAP[field];
  if (!col) {
    throw new Error(`Field '${field}' has no column mapping`);
  }
  return col;
}

// ─── Operator to SQL Fragment ─────────────────────────────────────────────────

function buildOperatorClause(
  columnExpr: string,
  operator: FilterOperator,
  value: unknown,
  values: unknown[] | undefined,
): SQL {
  // Use parameterized sql tag for all values
  switch (operator) {
    case "equals":
      return sql.raw(`${columnExpr} = `).append(sql`${value}`);

    case "notEquals":
      return sql.raw(`${columnExpr} != `).append(sql`${value}`);

    case "contains":
      return sql
        .raw(`${columnExpr} ILIKE `)
        .append(sql`${"%" + String(value) + "%"}`);

    case "startsWith":
      return sql
        .raw(`${columnExpr} ILIKE `)
        .append(sql`${String(value) + "%"}`);

    case "endsWith":
      return sql
        .raw(`${columnExpr} ILIKE `)
        .append(sql`${"%" + String(value)}`);

    case "greaterThan":
      return sql.raw(`${columnExpr} > `).append(sql`${value}`);

    case "greaterThanOrEqual":
      return sql.raw(`${columnExpr} >= `).append(sql`${value}`);

    case "lessThan":
      return sql.raw(`${columnExpr} < `).append(sql`${value}`);

    case "lessThanOrEqual":
      return sql.raw(`${columnExpr} <= `).append(sql`${value}`);

    case "in": {
      if (!values || values.length === 0) {
        return sql`FALSE`;
      }
      // Build parameterized IN clause
      const placeholders = values.map((v) => sql`${v}`);
      let clause = sql.raw(`${columnExpr} IN (`);
      for (let i = 0; i < placeholders.length; i++) {
        if (i > 0) clause = clause.append(sql`, `);
        clause = clause.append(placeholders[i]);
      }
      return clause.append(sql`)`);
    }

    case "notIn": {
      if (!values || values.length === 0) {
        return sql`TRUE`;
      }
      const placeholders = values.map((v) => sql`${v}`);
      let clause = sql.raw(`${columnExpr} NOT IN (`);
      for (let i = 0; i < placeholders.length; i++) {
        if (i > 0) clause = clause.append(sql`, `);
        clause = clause.append(placeholders[i]);
      }
      return clause.append(sql`)`);
    }

    case "isNull":
      return sql.raw(`${columnExpr} IS NULL`);

    case "isNotNull":
      return sql.raw(`${columnExpr} IS NOT NULL`);

    default:
      throw new Error(`Unsupported operator: ${operator}`);
  }
}

// ─── Filter Processor ─────────────────────────────────────────────────────────

export class SpatialFilterProcessor {
  /**
   * Process a filter node (flat array or FilterGroup) into a SQL fragment.
   * Returns null if no filters to apply.
   */
  static processFilters(
    node: FilterGroup | AttributeFilter[] | null | undefined,
  ): SQL | null {
    if (!node) return null;

    if (Array.isArray(node)) {
      // Flat array: implicit AND
      return this.processFilterArray(node);
    }

    if ("connector" in node) {
      return this.processFilterGroup(node as FilterGroup);
    }

    return null;
  }

  private static processFilterGroup(group: FilterGroup): SQL | null {
    const clauses: SQL[] = [];

    for (const child of group.filters) {
      let clause: SQL | null = null;

      if (Array.isArray(child)) {
        clause = this.processFilterArray(child as AttributeFilter[]);
      } else if ("connector" in child) {
        clause = this.processFilterGroup(child as FilterGroup);
      } else {
        clause = this.processSingleFilter(child as AttributeFilter);
      }

      if (clause) clauses.push(clause);
    }

    if (clauses.length === 0) return null;
    if (clauses.length === 1) return clauses[0];

    const connector = group.connector === "AND" ? " AND " : " OR ";
    let result = sql`(`;
    for (let i = 0; i < clauses.length; i++) {
      if (i > 0) result = result.append(sql.raw(connector));
      result = result.append(clauses[i]);
    }
    result = result.append(sql`)`);
    return result;
  }

  private static processFilterArray(filters: AttributeFilter[]): SQL | null {
    if (filters.length === 0) return null;

    const clauses = filters
      .map((f) => this.processSingleFilter(f))
      .filter(Boolean) as SQL[];
    if (clauses.length === 0) return null;
    if (clauses.length === 1) return clauses[0];

    let result = sql`(`;
    for (let i = 0; i < clauses.length; i++) {
      if (i > 0) result = result.append(sql` AND `);
      result = result.append(clauses[i]);
    }
    result = result.append(sql`)`);
    return result;
  }

  private static processSingleFilter(filter: AttributeFilter): SQL | null {
    const columnExpr = fieldToColumn(filter.field);
    return buildOperatorClause(
      columnExpr,
      filter.operator,
      filter.value,
      filter.values,
    );
  }

  // ─── Temporal Clause ────────────────────────────────────────────────────────

  /**
   * Build a temporal WHERE clause from a TemporalFilter.
   * Defaults to 'timestamp' column if no field specified.
   */
  static processTemporalFilter(
    temporal: TemporalFilter,
    tableAlias?: string,
  ): SQL | null {
    const col = temporal.field ? fieldToColumn(temporal.field) : "timestamp";
    const prefix = tableAlias ? `${tableAlias}.` : "";
    const fullCol = `${prefix}${col}`;

    const clauses: SQL[] = [];

    if (temporal.from) {
      clauses.push(
        sql.raw(`${fullCol} >= `).append(sql`${temporal.from}::timestamptz`),
      );
    }
    if (temporal.to) {
      clauses.push(
        sql.raw(`${fullCol} <= `).append(sql`${temporal.to}::timestamptz`),
      );
    }

    if (clauses.length === 0) return null;
    if (clauses.length === 1) return clauses[0];
    return clauses[0].append(sql` AND `).append(clauses[1]);
  }
}
