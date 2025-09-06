import jwt from 'jsonwebtoken';
import { JWTPayload, AuthTokens } from '../types';

export class JWTUtil {
  private static readonly accessTokenSecret = process.env.JWT_SECRET!;
  private static readonly refreshTokenSecret = process.env.JWT_REFRESH_SECRET!;
  private static readonly accessTokenExpiry = '60m';
  private static readonly refreshTokenExpiry = '7d';

  static generateTokens(payload: JWTPayload): AuthTokens {
    const accessToken = jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry,
    });

    const refreshToken = jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiry,
    });

    return { accessToken, refreshToken };
  }

  static verifyAccessToken(token: string): JWTPayload {
    return jwt.verify(token, this.accessTokenSecret) as JWTPayload;
  }

  static verifyRefreshToken(token: string): JWTPayload {
    return jwt.verify(token, this.refreshTokenSecret) as JWTPayload;
  }
}