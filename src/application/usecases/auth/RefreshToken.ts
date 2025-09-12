import { AuthResponse } from '@domain/entities/Token';
import { UserRepository } from '@domain/repositories/UserRepository';
import { TokenService } from '@domain/services';
import { logger } from '../../../utils/logger';

export interface RefreshTokenRequest {
  refreshToken: string;
}

export class RefreshToken {
  constructor(
    private userRepository: UserRepository,
    private tokenService: TokenService
  ) {}

  async execute(request: RefreshTokenRequest): Promise<AuthResponse> {
    const { refreshToken } = request;

    try {
      // Validate input
      if (!refreshToken) {
        throw new Error('Refresh token is required');
      }

      // Verify and decode refresh token
      let payload;
      try {
        payload = this.tokenService.verifyToken(refreshToken);
      } catch (error) {
        logger.warn('Invalid refresh token provided', { 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        throw new Error('Invalid or expired refresh token');
      }

      // Find user
      const user = await this.userRepository.findById(payload.userId);
      if (!user) {
        logger.warn('Refresh token for non-existent user', { userId: payload.userId });
        throw new Error('User not found');
      }

      // Check if refresh token exists in user's stored tokens
      const hasValidRefreshToken = user.refreshTokens.some(
        tokenData => tokenData.token === refreshToken && tokenData.expiresAt > new Date()
      );

      if (!hasValidRefreshToken) {
        logger.warn('Refresh token not found in user tokens or expired', { userId: user.id });
        throw new Error('Invalid or expired refresh token');
      }

      // Clean expired tokens
      await this.userRepository.cleanExpiredTokens(user.id);

      // Generate new tokens
      const newAccessToken = this.tokenService.generateAccessToken(user);
      const newRefreshToken = this.tokenService.generateRefreshToken(user);

      // Remove old refresh token and add new one
      await this.userRepository.removeRefreshToken(user.id, refreshToken);
      
      const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await this.userRepository.addRefreshToken(user.id, {
        token: newRefreshToken,
        expiresAt: refreshTokenExpiry
      });

      logger.info('Token refreshed successfully', { 
        userId: user.id, 
        email: user.email 
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          permissions: user.permissions
        },
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };

    } catch (error) {
      logger.error('Token refresh failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }
}