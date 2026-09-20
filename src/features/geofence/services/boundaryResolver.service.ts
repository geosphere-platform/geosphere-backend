import {
  AdminBoundaryItem,
  AdminBoundaryLevel,
  getAdminCountries,
  findAdminBoundaryItem,
} from "../data/administrativeBoundaries";

export interface BoundarySearchResult {
  query: string;
  results: AdminBoundaryItem[];
  source: "local" | "osm" | "cache";
}

export class BoundaryResolverService {
  /**
   * Searches administrative boundaries using local dataset or live OpenStreetMap survey
   */
  static async searchBoundaries(
    query: string,
    level: "all" | AdminBoundaryLevel = "all",
    forceOsm: boolean = false
  ): Promise<BoundarySearchResult> {
    const trimmed = query.trim();
    if (!trimmed) {
      return { query: "", results: [], source: "local" };
    }

    // Try calling the server route if running in a browser environment
    if (typeof window !== "undefined") {
      try {
        const token = localStorage.getItem("gis_access_token");
        const headers: Record<string, string> = { Accept: "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const url = `/api/v1/spatial/boundaries/search?query=${encodeURIComponent(
          trimmed
        )}&level=${level}&source=${forceOsm ? "osm" : "hybrid"}`;

        const res = await fetch(url, { headers });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data?.results)) {
            return {
              query: trimmed,
              results: json.data.results,
              source: json.data.source || "osm",
            };
          }
        }
      } catch {
        // Fall back to local search
      }
    }

    // Fallback: search local dataset
    const results: AdminBoundaryItem[] = [];
    const qLower = trimmed.toLowerCase();
    const countries = getAdminCountries();

    for (const c of countries) {
      if (c.name.toLowerCase().includes(qLower) || c.countryCode.toLowerCase() === qLower) {
        if (level === "all" || level === "country") results.push(c);
      }
      for (const s of c.states) {
        if (s.name.toLowerCase().includes(qLower) || s.stateCode.toLowerCase() === qLower) {
          if (level === "all" || level === "state") results.push(s);
        }
        for (const d of s.districts) {
          if (d.name.toLowerCase().includes(qLower) || d.id.includes(qLower)) {
            if (level === "all" || level === "district") results.push(d);
          }
          for (const t of d.tehsils) {
            if (t.name.toLowerCase().includes(qLower) || t.id.includes(qLower)) {
              if (level === "all" || level === "tehsil") results.push(t);
            }
          }
        }
      }
    }

    return {
      query: trimmed,
      results,
      source: "local",
    };
  }
}
