import { TokenPayload, TokenType } from '../../../domain/entities/Token';
import { Permission } from '../../../domain/entities/User';
import { UserRepository } from '../../../domain/repositories/UserRepository';
import { TokenService } from '../../../domain/services';
import { logger } from '../../../utils/logger';

export interface ValidateTokenRequest {
  token: string;
  requiredPermission?: Permission;
  requiredTokenType?: TokenType;
}

export interface ValidateTokenResponse {
  isValid: boolean;
  payload?: TokenPayload;
  user?: {
    id: string;
    email: string;
    permissions: Permission[];
  };
  error?: string;
}

export class ValidateToken {
  constructor(
    private userRepository: UserRepository,
    private tokenService: TokenService
  ) {}

  async execute(request: ValidateTokenRequest): Promise<ValidateTokenResponse> {
    const { token, requiredPermission, requiredTokenType } = request;

    try {
      // Validate input
      if (!token) {
        return {
          isValid: false,
          error: 'Token is required'
        };
      }

      // Verify and decode token
      let payload: TokenPayload;
      try {
        payload = this.tokenService.verifyToken(token);
      } catch (error) {
        logger.warn('Token validation failed - invalid token', { 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        return {
          isValid: false,
          error: 'Invalid or expired token'
        };
      }

      // Check token type if required
      if (requiredTokenType && !this.tokenService.isTokenType(payload, requiredTokenType)) {
        logger.warn('Token validation failed - wrong token type', {
          userId: payload.userId,
          tokenType: payload.type,
          requiredTokenType
        });
        return {
          isValid: false,
          error: `Token type ${requiredTokenType} required`
        };
      }

      // Check permission if required
      if (requiredPermission && !this.tokenService.hasPermission(payload, requiredPermission)) {
        logger.warn('Token validation failed - insufficient permissions', {
          userId: payload.userId,
          userPermissions: payload.permissions,
          requiredPermission
        });
        return {
          isValid: false,
          error: `Permission ${requiredPermission} required`
        };
      }

      // Verify user still exists and is active
      const user = await this.userRepository.findById(payload.userId);
      if (!user) {
        logger.warn('Token validation failed - user not found', { userId: payload.userId });
        return {
          isValid: false,
          error: 'User not found'
        };
      }

      // For refresh tokens, verify the token exists in user's stored tokens
      if (payload.type === TokenType.REFRESH) {
        const hasValidRefreshToken = user.refreshTokens.some(
          tokenData => tokenData.token === token && tokenData.expiresAt > new Date()
        );

        if (!hasValidRefreshToken) {
          logger.warn('Refresh token validation failed - token not found or expired', { 
            userId: user.id 
          });
          return {
            isValid: false,
            error: 'Refresh token not found or expired'
          };
        }
      }

      logger.debug('Token validated successfully', {
        userId: payload.userId,
        tokenType: payload.type,
        permissions: payload.permissions
      });

      return {
        isValid: true,
        payload,
        user: {
          id: user.id,
          email: user.email,
          permissions: user.permissions
        }
      };

    } catch (error) {
      logger.error('Token validation error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return {
        isValid: false,
        error: 'Token validation failed'
      };
    }
  }
}