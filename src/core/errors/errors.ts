export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 500,
    public readonly errorCode: string = "INTERNAL_SERVER_ERROR",
    public readonly details: unknown = null,
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found", details: unknown = null) {
    super(message, 404, "NOT_FOUND", details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(
    message: string = "Unauthorized access",
    details: unknown = null,
  ) {
    super(message, 401, "UNAUTHORIZED", details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Access forbidden", details: unknown = null) {
    super(message, 403, "FORBIDDEN", details);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = "Bad request", details: unknown = null) {
    super(message, 400, "BAD_REQUEST", details);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = "Validation failed", details: unknown = null) {
    super(message, 400, "BAD_REQUEST", details);
  }
}

export class ConflictError extends AppError {
  constructor(
    message: string = "Resource conflict occurred",
    details: unknown = null,
  ) {
    super(message, 409, "CONFLICT", details);
  }
}
