import { NextRequest, NextResponse } from "next/server";
import { getDbPoolStats } from "@/database";

// In-memory operational metrics collector
class MetricsCollector {
  private requestCount = 0;
  private errorCount = 0;
  private latencies: number[] = [];
  private spatialQueryLatencies: number[] = [];

  recordRequest(status: number, durationMs: number) {
    this.requestCount += 1;
    if (status >= 400) {
      this.errorCount += 1;
    }
    this.latencies.push(durationMs);
    if (this.latencies.length > 1000) {
      this.latencies.shift();
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
}

export const metricsCollector = new MetricsCollector();

export async function GET(request: NextRequest) {
  return NextResponse.json(metricsCollector.getMetrics());
}
