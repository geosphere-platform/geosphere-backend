import { NextRequest, NextResponse } from "next/server";
import { getDbPoolStats } from "@/database";

// In-memory operational metrics collector with Prometheus export support
class MetricsCollector {
  private requestCount = 0;
  private errorCount = 0;
  private latencies: number[] = [];
  private spatialQueryLatencies: number[] = [];

  recordRequest(status: number, durationMs: number = 0) {
    this.requestCount += 1;
    if (status >= 400) {
      this.errorCount += 1;
    }
    if (durationMs > 0) {
      this.latencies.push(durationMs);
      if (this.latencies.length > 1000) {
        this.latencies.shift();
      }
    }
  }

  recordSpatialQuery(durationMs: number) {
    this.spatialQueryLatencies.push(durationMs);
    if (this.spatialQueryLatencies.length > 1000) {
      this.spatialQueryLatencies.shift();
    }
  }

  getMetrics() {
    const mem = process.memoryUsage();
    const sortedLatencies = [...this.latencies].sort((a, b) => a - b);
    const sortedSpatial = [...this.spatialQueryLatencies].sort((a, b) => a - b);

    const getPercentile = (arr: number[], p: number) => {
      if (arr.length === 0) return 0;
      const index = Math.floor((p / 100) * arr.length);
      return arr[Math.min(index, arr.length - 1)];
    };

    return {
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      requests: {
        total: this.requestCount,
        errors: this.errorCount,
        errorRatePercent:
          this.requestCount > 0
            ? parseFloat(
                ((this.errorCount / this.requestCount) * 100).toFixed(2),
              )
            : 0,
        latencyMs: {
          p50: getPercentile(sortedLatencies, 50),
          p95: getPercentile(sortedLatencies, 95),
          p99: getPercentile(sortedLatencies, 99),
        },
      },
      spatialQueries: {
        total: this.spatialQueryLatencies.length,
        latencyMs: {
          p50: getPercentile(sortedSpatial, 50),
          p95: getPercentile(sortedSpatial, 95),
          p99: getPercentile(sortedSpatial, 99),
        },
      },
      databasePool: getDbPoolStats(),
      system: {
        memoryHeapUsedMb: parseFloat((mem.heapUsed / (1024 * 1024)).toFixed(2)),
        memoryHeapTotalMb: parseFloat(
          (mem.heapTotal / (1024 * 1024)).toFixed(2),
        ),
        memoryRssMb: parseFloat((mem.rss / (1024 * 1024)).toFixed(2)),
      },
    };
  }

  toPrometheus(): string {
    const m = this.getMetrics();
    const p = m.databasePool;
    return [
      "# HELP geosphere_uptime_seconds Total runtime of the API server process in seconds",
      "# TYPE geosphere_uptime_seconds gauge",
      `geosphere_uptime_seconds ${m.uptimeSeconds}`,
      "",
      "# HELP geosphere_http_requests_total Total number of HTTP requests processed",
      "# TYPE geosphere_http_requests_total counter",
      `geosphere_http_requests_total ${m.requests.total}`,
      "",
      "# HELP geosphere_http_errors_total Total number of HTTP requests resulting in 4xx/5xx status",
      "# TYPE geosphere_http_errors_total counter",
      `geosphere_http_errors_total ${m.requests.errors}`,
      "",
      "# HELP geosphere_http_latency_p95_ms 95th percentile HTTP request duration in milliseconds",
      "# TYPE geosphere_http_latency_p95_ms gauge",
      `geosphere_http_latency_p95_ms ${m.requests.latencyMs.p95}`,
      "",
      "# HELP geosphere_db_pool_total Total database pool connections",
      "# TYPE geosphere_db_pool_total gauge",
      `geosphere_db_pool_total ${p.totalCount ?? 0}`,
      "",
      "# HELP geosphere_db_pool_idle Idle database pool connections",
      "# TYPE geosphere_db_pool_idle gauge",
      `geosphere_db_pool_idle ${p.idleCount ?? 0}`,
      "",
      "# HELP geosphere_db_pool_waiting Queries waiting for a free database connection",
      "# TYPE geosphere_db_pool_waiting gauge",
      `geosphere_db_pool_waiting ${p.waitingCount ?? 0}`,
      "",
      "# HELP geosphere_memory_heap_used_bytes Node.js heap memory used in bytes",
      "# TYPE geosphere_memory_heap_used_bytes gauge",
      `geosphere_memory_heap_used_bytes ${process.memoryUsage().heapUsed}`,
    ].join("\n");
  }
}

export const metricsCollector = new MetricsCollector();

export async function GET(request: NextRequest) {
  const format = request.nextUrl.searchParams.get("format");
  const accept = request.headers.get("accept") || "";

  if (format === "prometheus" || accept.includes("text/plain")) {
    return new NextResponse(metricsCollector.toPrometheus(), {
      headers: {
        "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
      },
    });
  }

  return NextResponse.json(metricsCollector.getMetrics());
}
