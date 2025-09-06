import { Request, Response, NextFunction } from 'express';
import { JWTUtil } from '../utils/jwt';
import { ApiResponseUtil } from '../utils/response';
import { prisma } from '../lib/prisma';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    console.log("authHeader",authHeader);
    
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      ApiResponseUtil.error(res, 'No valid token provided', 401);
      return;
    }

    const token = authHeader.substring(7);
    console.log("token",token);
    
    const decoded = JWTUtil.verifyAccessToken(token);
    console.log("decoded",decoded);
    
    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      ApiResponseUtil.error(res, 'User not found', 401);
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    ApiResponseUtil.error(res, 'Invalid or expired token', 401);
  }
};

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ApiResponseUtil.error(res, 'Authentication required', 401);
      return;
    }

    if (!roles.includes(req.user.role)) {
      ApiResponseUtil.error(res, 'Insufficient permissions', 403);
      return;
    }

    next();
  };
};