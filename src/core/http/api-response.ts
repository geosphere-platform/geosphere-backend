import { NextResponse } from "next/server";
import { AppError } from "../errors/errors";
import { logger } from "../logger/logger";

export interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export class ApiResponse {
  /**
   * Generates a successful JSON response.
   */
  static success<T>(
    data: T,
    statusCode: number = 200,
    meta?: Record<string, unknown>,
  ): NextResponse<SuccessResponse<T>> {
    return NextResponse.json(
      {
        success: true,
        data,
        meta,
      },
      { status: statusCode },
    );
  }

  /**
   * Generates an error JSON response.
   */
  static error(
    message: string,
    statusCode: number = 500,
    errorCode: string = "INTERNAL_SERVER_ERROR",
    details: unknown = null,
  ): NextResponse<ErrorResponse> {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: errorCode,
          message,
          ...(details ? { details } : {}),
        },
      },
      { status: statusCode },
    );
  }

  /**
   * Handles caught errors automatically, logging appropriately and returning standard format.
   */
  static handle(error: unknown): NextResponse<ErrorResponse> {
    const errObj = error as {
      message?: string;
      statusCode?: number;
      status?: number;
      errorCode?: string;
      code?: string;
      details?: unknown;
    };
    const status = errObj?.statusCode ?? errObj?.status ?? 500;
    const code = errObj?.errorCode ?? errObj?.code ?? "INTERNAL_SERVER_ERROR";
    const message = errObj?.message ?? "An error occurred";

    if (status < 500) {
      logger.warn({ err: error }, `API Operational Warning: ${message}`);
    } else {
      logger.error({ err: error }, `Unhandled Server Error: ${message}`);
    }

    return this.error(message, status, code, errObj?.details ?? null);
  }
}
