import { Response } from 'express';
import { ApiResponse, PaginatedResponse, PaginationMeta } from '../types';

export class ApiResponseUtil {
  static success<T>(
    res: Response,
    data?: T,
    message?: string,
    statusCode: number = 200
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
    };
    return res.status(statusCode).json(response);
  }

  static error(
    res: Response,
    message: string,
    statusCode: number = 400,
    errors?: any[]
  ): Response {
    const response: ApiResponse = {
      success: false,
      message,
      errors,
    };
    return res.status(statusCode).json(response);
  }

  static paginated<T>(
    res: Response,
    data: T[],
    meta: PaginationMeta,
    message?: string
  ): Response {
    const response: PaginatedResponse<T> = {
      success: true,
      data,
      meta,
      message,
    };
    return res.status(200).json(response);
  }
}