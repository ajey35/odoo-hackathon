import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import logger from '../utils/logger';
import { ApiResponseUtil } from '../utils/response';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error(error);

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        ApiResponseUtil.error(res, 'Unique constraint violation', 409);
        return;
      case 'P2025':
        ApiResponseUtil.error(res, 'Record not found', 404);
        return;
      default:
        ApiResponseUtil.error(res, 'Database error', 500);
        return;
    }
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    ApiResponseUtil.error(res, 'Invalid token', 401);
    return;
  }

  if (error.name === 'TokenExpiredError') {
    ApiResponseUtil.error(res, 'Token expired', 401);
    return;
  }

  // Default error
  ApiResponseUtil.error(res, 'Internal server error', 500);
};