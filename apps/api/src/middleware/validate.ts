import type { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from './error-handler.js';

type RequestLocation = 'body' | 'query' | 'params';

/**
 * Middleware factory for validating request data with Zod schemas
 */
export function validate<T>(schema: ZodSchema<T>, location: RequestLocation = 'body') {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = req[location];
      const validated = await schema.parseAsync(data);
      
      // Replace the data with validated/transformed data
      if (location === 'body') {
        req.body = validated;
      } else if (location === 'query') {
        req.query = validated as Record<string, string>;
      } else if (location === 'params') {
        req.params = validated as Record<string, string>;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        }));

        next(
          new ValidationError('Validation failed', {
            errors: validationErrors,
          })
        );
      } else {
        next(error);
      }
    }
  };
}

/**
 * Validate multiple locations at once
 */
export function validateMultiple(schemas: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors: Array<{ location: string; field: string; message: string; code: string }> = [];

      for (const [location, schema] of Object.entries(schemas)) {
        if (schema) {
          try {
            const data = req[location as RequestLocation];
            const validated = await schema.parseAsync(data);
            
            if (location === 'body') {
              req.body = validated;
            } else if (location === 'query') {
              req.query = validated as Record<string, string>;
            } else if (location === 'params') {
              req.params = validated as Record<string, string>;
            }
          } catch (error) {
            if (error instanceof ZodError) {
              for (const e of error.errors) {
                errors.push({
                  location,
                  field: e.path.join('.'),
                  message: e.message,
                  code: e.code,
                });
              }
            } else {
              throw error;
            }
          }
        }
      }

      if (errors.length > 0) {
        next(new ValidationError('Validation failed', { errors }));
      } else {
        next();
      }
    } catch (error) {
      next(error);
    }
  };
}
