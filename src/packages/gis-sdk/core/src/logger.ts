import { Logger } from "./types";

const SENSITIVE_KEYS = [
  "token",
  "accesstoken",
  "refreshtoken",
  "password",
  "secret",
  "authorization",
  "apikey",
  "privatekey",
];

function sanitizeMeta(meta: any[]): any[] {
  return meta.map((item) => {
    if (typeof item === "string") {
      let sanitized = item;
      for (const key of SENSITIVE_KEYS) {
        const regex = new RegExp(`("${key}"\\s*:\\s*")[^"]+(")`, "gi");
        sanitized = sanitized.replace(regex, `$1[REDACTED]$2`);
      }
      return sanitized;
    }
    if (item && typeof item === "object") {
      const copy: Record<string, any> = Array.isArray(item) ? [] : {};
      for (const [k, v] of Object.entries(item)) {
        if (SENSITIVE_KEYS.some((sk) => k.toLowerCase().includes(sk))) {
          copy[k] = "[REDACTED]";
        } else if (v && typeof v === "object") {
          copy[k] = sanitizeMeta([v])[0];
        } else {
          copy[k] = v;
        }
      }
      return copy;
    }
    return item;
  });
}

export class SDKLogger implements Logger {
  private customLogger?: Logger;
  private enabled: boolean = true;

  constructor(customLogger?: Logger, enabled: boolean = true) {
    this.customLogger = customLogger;
    this.enabled = enabled;
  }

  public setLogger(logger?: Logger) {
    this.customLogger = logger;
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public debug(message: string, ...meta: any[]): void {
    if (!this.enabled) return;
    const sanitized = sanitizeMeta(meta);
    if (this.customLogger) {
      this.customLogger.debug(message, ...sanitized);
    } else if (process.env.NODE_ENV === "development") {
      console.debug(`[GIS-SDK:DEBUG] ${message}`, ...sanitized);
    }
  }

  public info(message: string, ...meta: any[]): void {
    if (!this.enabled) return;
    const sanitized = sanitizeMeta(meta);
    if (this.customLogger) {
      this.customLogger.info(message, ...sanitized);
    } else {
      console.info(`[GIS-SDK:INFO] ${message}`, ...sanitized);
    }
  }

  public warn(message: string, ...meta: any[]): void {
    if (!this.enabled) return;
    const sanitized = sanitizeMeta(meta);
    if (this.customLogger) {
      this.customLogger.warn(message, ...sanitized);
    } else {
      console.warn(`[GIS-SDK:WARN] ${message}`, ...sanitized);
    }
  }

  public error(message: string, ...meta: any[]): void {
    if (!this.enabled) return;
    const sanitized = sanitizeMeta(meta);
    if (this.customLogger) {
      this.customLogger.error(message, ...sanitized);
    } else {
      console.error(`[GIS-SDK:ERROR] ${message}`, ...sanitized);
    }
  }
}
