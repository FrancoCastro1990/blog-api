import jwt from 'jsonwebtoken';
import { User, Permission } from '../entities/User';
import { TokenPayload, TokenType } from '../entities/Token';
import { config } from '../../config';

export class TokenService {
  private readonly secret: string;

  constructor(jwtSecret?: string) {
    let secret: string | undefined;
    
    if (jwtSecret !== undefined) {
      secret = jwtSecret;
    } else {
      secret = process.env.AUTH_JWT_SECRET || config.auth.jwtSecret;
    }
    
    if (!secret || secret.trim() === '') {
      throw new Error('JWT secret not configured');
    }
    this.secret = secret;
  }

  /**
   * Generate an access token for a user
   * @param user - The user to generate token for
   * @returns string - The JWT access token
   */
  generateAccessToken(user: User): string {
    const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
      userId: user.id,
      email: user.email,
      permissions: user.permissions,
      type: TokenType.ACCESS
    };

    return jwt.sign(payload, this.secret, {
      expiresIn: config.auth.accessTokenExpiry // '15m' is valid format
    } as jwt.SignOptions);
  }

  /**
   * Generate an admin token for a user with admin permissions
   * @param user - The user to generate admin token for
   * @returns string - The JWT admin token
   * @throws Error if user doesn't have admin permissions
   */
  generateAdminToken(user: User): string {
    if (!user.permissions.includes(Permission.ADMIN)) {
      throw new Error('User does not have admin permissions');
    }

    const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
      userId: user.id,
      email: user.email,
      permissions: user.permissions,
      type: TokenType.ADMIN
    };

    return jwt.sign(payload, this.secret, {
      expiresIn: config.auth.adminTokenExpiry // '1h' is valid format
    } as jwt.SignOptions);
  }

  /**
   * Generate a refresh token for a user
   * @param user - The user to generate refresh token for
   * @returns string - The JWT refresh token
   */
  generateRefreshToken(user: User): string {
    const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
      userId: user.id,
      email: user.email,
      permissions: user.permissions,
      type: TokenType.REFRESH
    };

    return jwt.sign(payload, this.secret, {
      expiresIn: config.auth.refreshTokenExpiry // '7d' is valid format
    } as jwt.SignOptions);
  }

  /**
   * Verify and decode a JWT token
   * @param token - The JWT token to verify
   * @returns TokenPayload - The decoded token payload
   * @throws Error if token is invalid, expired, or malformed
   */
  verifyToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, this.secret) as TokenPayload;
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token has expired');
      }
      if (error instanceof jwt.NotBeforeError) {
        throw new Error('Token not active yet');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error(`Invalid token: ${error.message}`);
      }
      throw new Error(`Token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if a token payload has a specific permission
   * @param payload - The token payload to check
   * @param requiredPermission - The permission to check for
   * @returns boolean - True if the user has the permission
   */
  hasPermission(payload: TokenPayload, requiredPermission: Permission): boolean {
    return payload.permissions.includes(requiredPermission);
  }

  /**
   * Check if a token is of a specific type
   * @param payload - The token payload to check
   * @param tokenType - The token type to check for
   * @returns boolean - True if the token is of the specified type
   */
  isTokenType(payload: TokenPayload, tokenType: TokenType): boolean {
    return payload.type === tokenType;
  }

  /**
   * Extract token from Authorization header
   * @param authHeader - The Authorization header value
   * @returns string | null - The extracted token or null if not found
   */
  extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }
}