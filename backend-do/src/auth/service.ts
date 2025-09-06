import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { JWTUtil } from '../utils/jwt';
import { AuthTokens, JWTPayload } from '../types';

export class AuthService {
  static async register(name: string, email: string, password: string): Promise<AuthTokens> {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    return JWTUtil.generateTokens(payload);
  }

  static async login(email: string, password: string): Promise<AuthTokens> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    return JWTUtil.generateTokens(payload);
  }

  static async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const decoded = JWTUtil.verifyRefreshToken(refreshToken);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    return JWTUtil.generateTokens(payload);
  }

  static async getProfile(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  static async updateProfile(userId: string, data: { name?: string; email?: string }) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });
  }
}