import { logger } from "./logger";

export { logger };

export function createChildLogger(bindings: Record<string, any>) {
  return logger.child(bindings);
}

export function logRequest(
  correlationId: string,
  method: string,
  route: string,
  status: number,
  durationMs: number,
  tenantId?: string,
) {
  logger.info(
    {
      correlationId,
      method,
      route,
      status,
      durationMs,
      tenantId: tenantId ?? "anonymous",
    },
    `HTTP ${method} ${route} -> ${status} (${durationMs}ms)`,
  );
}
