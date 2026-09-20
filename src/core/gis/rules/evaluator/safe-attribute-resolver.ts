/**
 * SafeAttributeResolver — Security-Hardened Attribute & Value Extraction Service
 *
 * Safely resolves nested property paths from RuleContext WITHOUT `eval()` or dynamic code evaluation.
 * Permitted context roots:
 * - `subject` (id, type, externalId, name, active, attributes.*)
 * - `location` (latitude, longitude, speed, heading, accuracy, source, timestamp)
 * - `geofence` (id, name, state, previousState, transition)
 * - `event` (id, type, timestamp, source, metadata.*)
 * - `distance`
 * - `attributes`
 * - `metadata`
 */

import { RuleContext } from "../types/rule.types";

export class SafeAttributeResolver {
  /**
   * Safely resolve a dot-notation property path against a RuleContext object.
   * Returns `undefined` if path does not exist or traverses unpermitted internal roots.
   */
  public static resolve(path: string, context: RuleContext): unknown {
    if (!path || typeof path !== "string" || !context) {
      return undefined;
    }

    const trimmedPath = path.trim();
    if (trimmedPath === "") return undefined;

    const parts = trimmedPath.split(".");
    const root = parts[0];

    // Ensure root is within permitted context domains
    const PERMITTED_ROOTS = new Set([
      "subject",
      "location",
      "geofence",
      "event",
      "distance",
      "attributes",
      "metadata",
      "timestamp",
    ]);

    if (!PERMITTED_ROOTS.has(root)) {
      return undefined; // Block access to unpermitted objects e.g. process, env, db, window, global
    }

    let current: any = context;
    for (const part of parts) {
      if (
        current === null ||
        current === undefined ||
        typeof current !== "object"
      ) {
        return undefined;
      }

      // Block access to prototype poisoning properties
      if (
        part === "__proto__" ||
        part === "constructor" ||
        part === "prototype"
      ) {
        return undefined;
      }

      current = current[part];
    }

    return current;
  }
}
