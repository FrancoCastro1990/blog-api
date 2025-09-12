import { Request, Response, NextFunction } from 'express';
import { Permission, TokenPayload, TokenType } from '../entities';
import { ValidateToken } from '../usecases';
import { logger } from '../../utils/logger';

// Extend Express Request interface to include auth data
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        permissions: Permission[];
      };
      token?: TokenPayload;
    }
  }
}

export interface AuthMiddlewareOptions {
  validateToken: ValidateToken;
  requiredPermission?: Permission;
  requiredTokenType?: TokenType;
  optional?: boolean; // If true, doesn't fail when no token provided
}

/**
 * Express middleware for JWT authentication and authorization
 */
export function createAuthMiddleware(options: AuthMiddlewareOptions) {
  const { validateToken, requiredPermission, requiredTokenType, optional = false } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;
      const token = extractTokenFromHeader(authHeader);

      // Handle missing token
      if (!token) {
        if (optional) {
          return next(); // Continue without authentication
        }
        logger.warn('Authentication failed - no token provided', {
          path: req.path,
          method: req.method,
          ip: req.ip
        });
        return res.status(401).json({
          error: 'Authentication required',
          message: 'Authorization header with Bearer token is required'
        });
      }

      // Validate token
      const validation = await validateToken.execute({
        token,
        requiredPermission,
        requiredTokenType
      });

      if (!validation.isValid) {
        logger.warn('Authentication failed - token validation failed', {
          path: req.path,
          method: req.method,
          ip: req.ip,
          error: validation.error
        });
        return res.status(401).json({
          error: 'Authentication failed',
          message: validation.error || 'Invalid token'
        });
      }

      // Token is valid, add user info to request
      if (validation.user && validation.payload) {
        req.user = validation.user;
        req.token = validation.payload;

        logger.debug('Authentication successful', {
          userId: validation.user.id,
          email: validation.user.email,
          permissions: validation.user.permissions,
          path: req.path,
          method: req.method
        });
      }

      next();

    } catch (error) {
      logger.error('Authentication middleware error', {
        path: req.path,
        method: req.method,
        ip: req.ip,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Authentication service temporarily unavailable'
      });
    }
  };
}

/**
 * Extract Bearer token from Authorization header
 */
function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Middleware factory functions for common use cases
 */
export class AuthMiddleware {
  constructor(private validateToken: ValidateToken) {}

  /**
   * Require valid access token with READ_POSTS permission
   */
  requireReadAccess() {
    return createAuthMiddleware({
      validateToken: this.validateToken,
      requiredPermission: Permission.READ_POSTS,
      requiredTokenType: TokenType.ACCESS
    });
  }

  /**
   * Require admin token with CREATE_POSTS permission
   */
  requireCreateAccess() {
    return createAuthMiddleware({
      validateToken: this.validateToken,
      requiredPermission: Permission.CREATE_POSTS,
      requiredTokenType: TokenType.ACCESS // Can use access token if user has CREATE_POSTS
    });
  }

  /**
   * Require admin permissions
   */
  requireAdminAccess() {
    return createAuthMiddleware({
      validateToken: this.validateToken,
      requiredPermission: Permission.ADMIN,
      requiredTokenType: TokenType.ACCESS
    });
  }

  /**
   * Optional authentication - adds user info if token present but doesn't fail if missing
   */
  optional() {
    return createAuthMiddleware({
      validateToken: this.validateToken,
      optional: true
    });
  }

  /**
   * Custom authentication with specific requirements
   */
  custom(options: Omit<AuthMiddlewareOptions, 'validateToken'>) {
    return createAuthMiddleware({
      ...options,
      validateToken: this.validateToken
    });
  }
}