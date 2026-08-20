import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-error';
import { ApiResponse } from '../types';
import { Prisma } from '@prisma/client';

function formatPrismaError(err: Prisma.PrismaClientKnownRequestError): AppError {
  switch (err.code) {
    case 'P2002':
      return new AppError(409, 'DUPLICATE_ENTRY', 'A record with this data already exists', {
        fields: (err.meta?.target as string[]) || [],
      });
    case 'P2025':
      return new AppError(404, 'NOT_FOUND', 'Record not found');
    case 'P2003':
      return new AppError(400, 'FK_CONSTRAINT', 'Referenced record does not exist');
    default:
      return new AppError(500, 'DATABASE_ERROR', 'Database operation failed');
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    const response: ApiResponse = {
      success: false,
      error: err.message,
      code: err.code,
      ...(err.details && { details: err.details }),
    };
    res.status(err.statusCode).json(response);
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const appErr = formatPrismaError(err);
    const response: ApiResponse = {
      success: false,
      error: appErr.message,
      code: appErr.code,
      ...(appErr.details && { details: appErr.details }),
    };
    res.status(appErr.statusCode).json(response);
    return;
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    const response: ApiResponse = {
      success: false,
      error: 'Invalid data provided',
      code: 'INVALID_INPUT',
    };
    res.status(400).json(response);
    return;
  }

  console.error('[Error] Unhandled:', err);

  const response: ApiResponse = {
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
  };
  res.status(500).json(response);
}
