import pino from "pino";
import { env } from "../config/env";

const isProduction = env.NODE_ENV === "production";

export const logger = pino({
  level: env.LOG_LEVEL,
  transport: !isProduction
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined,
  base: {
    env: env.NODE_ENV,
  },
  redact: ["req.headers.authorization", "password", "token", "jwt"],
});

export type Logger = typeof logger;
export default logger;
