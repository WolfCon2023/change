import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiErrorCode } from '@change/shared';
import { config } from '../config/index.js';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: Record<string, unknown>;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = ApiErrorCode.INTERNAL_ERROR,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 400, ApiErrorCode.VALIDATION_ERROR, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, ApiErrorCode.UNAUTHORIZED);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, ApiErrorCode.FORBIDDEN);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, ApiErrorCode.NOT_FOUND);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, ApiErrorCode.CONFLICT);
  }
}

export class TenantAccessError extends AppError {
  constructor() {
    super('Access denied to this tenant', 403, ApiErrorCode.TENANT_ACCESS_DENIED);
  }
}

export class InvalidTransitionError extends AppError {
  constructor(message: string) {
    super(message, 400, ApiErrorCode.INVALID_TRANSITION);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 400, ApiErrorCode.INVALID_INPUT, details);
  }
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    validationErrors?: Array<{ field: string; message: string; code: string }>;
    stack?: string;
  };
  meta: {
    timestamp: string;
    requestId?: string;
  };
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log the error
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  const response: ErrorResponse = {
    success: false,
    error: {
      code: ApiErrorCode.INTERNAL_ERROR,
      message: 'An unexpected error occurred',
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string,
    },
  };

  let statusCode = 500;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    response.error.code = err.code;
    response.error.message = err.message;
    if (err.details) {
      response.error.details = err.details;
    }
  } else if (err instanceof ZodError) {
    statusCode = 400;
    response.error.code = ApiErrorCode.VALIDATION_ERROR;
    response.error.message = 'Validation failed';
    response.error.validationErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
      code: e.code,
    }));
  } else if (err.name === 'MongoServerError' && (err as unknown as { code: number }).code === 11000) {
    statusCode = 409;
    response.error.code = ApiErrorCode.ALREADY_EXISTS;
    response.error.message = 'Resource already exists';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    response.error.code = ApiErrorCode.INVALID_INPUT;
    response.error.message = 'Invalid ID format';
  }

  // Include stack trace in development
  if (config.isDev) {
    response.error.stack = err.stack;
    response.error.message = err.message; // Show actual error message in dev
  }

  res.status(statusCode).json(response);
}

export function notFoundHandler(req: Request, res: Response): void {
  const response: ErrorResponse = {
    success: false,
    error: {
      code: ApiErrorCode.NOT_FOUND,
      message: `Route ${req.method} ${req.url} not found`,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string,
    },
  };

  res.status(404).json(response);
}
