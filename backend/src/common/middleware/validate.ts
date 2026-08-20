import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ValidationError } from '../errors/app-error';

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.issues.reduce(
        (acc, issue) => {
          const field = issue.path.join('.');
          acc[field] = issue.message;
          return acc;
        },
        {} as Record<string, string>,
      );
      next(new ValidationError('Validation failed', details));
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const details = result.error.issues.reduce(
        (acc, issue) => {
          const field = issue.path.join('.');
          acc[field] = issue.message;
          return acc;
        },
        {} as Record<string, string>,
      );
      next(new ValidationError('Invalid query parameters', details));
      return;
    }
    Object.assign(req.query, result.data);
    next();
  };
}
