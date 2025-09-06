import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ApiResponseUtil } from '../utils/response';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error: any) {
      const errors = error.errors?.map((err: any) => ({
        path: err.path.join('.'),
        message: err.message,
      }));
      ApiResponseUtil.error(res, 'Validation failed', 400, errors);
    }
  };
};