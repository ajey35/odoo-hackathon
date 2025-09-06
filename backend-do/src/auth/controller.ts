import { Request, Response, NextFunction } from 'express';
import { AuthService } from './service';
import { ApiResponseUtil } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password } = req.body;
      const tokens = await AuthService.register(name, email, password);
      ApiResponseUtil.success(res, tokens, 'Registration successful', 201);
    } catch (error: any) {
      if (error.message === 'User already exists') {
        ApiResponseUtil.error(res, error.message, 409);
      } else {
        next(error);
      }
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const tokens = await AuthService.login(email, password);
      ApiResponseUtil.success(res, tokens, 'Login successful');
    } catch (error: any) {
      if (error.message === 'Invalid credentials') {
        ApiResponseUtil.error(res, error.message, 401);
      } else {
        next(error);
      }
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const tokens = await AuthService.refreshToken(refreshToken);
      ApiResponseUtil.success(res, tokens, 'Token refreshed successfully');
    } catch (error: any) {
      ApiResponseUtil.error(res, 'Invalid refresh token', 401);
    }
  }

  static async getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await AuthService.getProfile(req.user!.id);
      ApiResponseUtil.success(res, profile, 'Profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await AuthService.updateProfile(req.user!.id, req.body);
      ApiResponseUtil.success(res, profile, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }
}