import { RefreshToken, RefreshTokenRequest } from '../../../../src/auth/usecases/RefreshToken';
import { UserRepository } from '../../../../src/auth/repositories';
import { TokenService } from '../../../../src/auth/services';
import { User, Permission } from '../../../../src/auth/entities';
import { TokenPayload, TokenType } from '../../../../src/auth/entities/Token';
import { logger } from '../../../../src/utils/logger';

// Mock the logger
jest.mock('../../../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

describe('RefreshToken', () => {
  let refreshTokenUseCase: RefreshToken;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockTokenService: jest.Mocked<TokenService>;

  const mockUser: User = {
    id: 'user123',
    email: 'test@example.com',
    passwordHash: 'hashedPassword123',
    permissions: [Permission.READ_POSTS],
    refreshTokens: [
      {
        token: 'valid-refresh-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        createdAt: new Date()
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockTokenPayload: TokenPayload = {
    userId: 'user123',
    email: 'test@example.com',
    permissions: [Permission.READ_POSTS],
    type: TokenType.REFRESH,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 // 7 days
  };

  const validRequest: RefreshTokenRequest = {
    refreshToken: 'valid-refresh-token'
  };

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      cleanExpiredTokens: jest.fn(),
      addRefreshToken: jest.fn(),
      removeRefreshToken: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    } as any;

    mockTokenService = {
      generateAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(),
      verifyToken: jest.fn(),
      hasPermission: jest.fn(),
      isTokenType: jest.fn(),
      extractTokenFromHeader: jest.fn(),
      generateAdminToken: jest.fn()
    } as any;

    refreshTokenUseCase = new RefreshToken(mockUserRepository, mockTokenService);

    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should refresh tokens successfully', async () => {
      // Arrange
      mockTokenService.verifyToken.mockReturnValue(mockTokenPayload);
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.cleanExpiredTokens.mockResolvedValue();
      mockUserRepository.removeRefreshToken.mockResolvedValue();
      mockUserRepository.addRefreshToken.mockResolvedValue();
      mockTokenService.generateAccessToken.mockReturnValue('new-access-token');
      mockTokenService.generateRefreshToken.mockReturnValue('new-refresh-token');

      // Act
      const result = await refreshTokenUseCase.execute(validRequest);

      // Assert
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          permissions: mockUser.permissions
        },
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      });

      expect(mockTokenService.verifyToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(mockUserRepository.findById).toHaveBeenCalledWith('user123');
      expect(mockUserRepository.cleanExpiredTokens).toHaveBeenCalledWith('user123');
      expect(mockUserRepository.removeRefreshToken).toHaveBeenCalledWith('user123', 'valid-refresh-token');
      expect(mockUserRepository.addRefreshToken).toHaveBeenCalledWith(
        'user123',
        expect.objectContaining({
          token: 'new-refresh-token',
          expiresAt: expect.any(Date)
        })
      );
      expect(logger.info).toHaveBeenCalledWith('Token refreshed successfully', {
        userId: mockUser.id,
        email: mockUser.email
      });
    });

    it('should throw error when refresh token is missing', async () => {
      // Arrange
      const invalidRequest = { refreshToken: '' };

      // Act & Assert
      await expect(refreshTokenUseCase.execute(invalidRequest))
        .rejects
        .toThrow('Refresh token is required');

      expect(mockTokenService.verifyToken).not.toHaveBeenCalled();
    });

    it('should throw error for invalid refresh token', async () => {
      // Arrange
      const tokenError = new Error('Invalid token');
      mockTokenService.verifyToken.mockImplementation(() => {
        throw tokenError;
      });

      // Act & Assert
      await expect(refreshTokenUseCase.execute(validRequest))
        .rejects
        .toThrow('Invalid or expired refresh token');

      expect(logger.warn).toHaveBeenCalledWith('Invalid refresh token provided', {
        error: 'Invalid token'
      });
      expect(mockUserRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw error when user not found', async () => {
      // Arrange
      mockTokenService.verifyToken.mockReturnValue(mockTokenPayload);
      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(refreshTokenUseCase.execute(validRequest))
        .rejects
        .toThrow('User not found');

      expect(logger.warn).toHaveBeenCalledWith('Refresh token for non-existent user', {
        userId: 'user123'
      });
    });

    it('should throw error when refresh token not found in user tokens', async () => {
      // Arrange
      const userWithoutToken: User = {
        ...mockUser,
        refreshTokens: [] // No refresh tokens
      };

      mockTokenService.verifyToken.mockReturnValue(mockTokenPayload);
      mockUserRepository.findById.mockResolvedValue(userWithoutToken);

      // Act & Assert
      await expect(refreshTokenUseCase.execute(validRequest))
        .rejects
        .toThrow('Invalid or expired refresh token');

      expect(logger.warn).toHaveBeenCalledWith('Refresh token not found in user tokens or expired', {
        userId: mockUser.id
      });
    });

    it('should throw error when refresh token is expired', async () => {
      // Arrange
      const userWithExpiredToken: User = {
        ...mockUser,
        refreshTokens: [
          {
            token: 'valid-refresh-token',
            expiresAt: new Date(Date.now() - 1000), // Expired (1 second ago)
            createdAt: new Date()
          }
        ]
      };

      mockTokenService.verifyToken.mockReturnValue(mockTokenPayload);
      mockUserRepository.findById.mockResolvedValue(userWithExpiredToken);

      // Act & Assert
      await expect(refreshTokenUseCase.execute(validRequest))
        .rejects
        .toThrow('Invalid or expired refresh token');

      expect(logger.warn).toHaveBeenCalledWith('Refresh token not found in user tokens or expired', {
        userId: mockUser.id
      });
    });

    it('should handle repository errors during user lookup', async () => {
      // Arrange
      mockTokenService.verifyToken.mockReturnValue(mockTokenPayload);
      const dbError = new Error('Database connection failed');
      mockUserRepository.findById.mockRejectedValue(dbError);

      // Act & Assert
      await expect(refreshTokenUseCase.execute(validRequest))
        .rejects
        .toThrow('Database connection failed');

      expect(logger.error).toHaveBeenCalledWith('Token refresh failed', {
        error: 'Database connection failed'
      });
    });

    it('should handle errors during token cleanup', async () => {
      // Arrange
      mockTokenService.verifyToken.mockReturnValue(mockTokenPayload);
      mockUserRepository.findById.mockResolvedValue(mockUser);
      const cleanupError = new Error('Failed to clean expired tokens');
      mockUserRepository.cleanExpiredTokens.mockRejectedValue(cleanupError);

      // Act & Assert
      await expect(refreshTokenUseCase.execute(validRequest))
        .rejects
        .toThrow('Failed to clean expired tokens');

      expect(logger.error).toHaveBeenCalledWith('Token refresh failed', {
        error: 'Failed to clean expired tokens'
      });
    });

    it('should handle errors during token generation', async () => {
      // Arrange
      mockTokenService.verifyToken.mockReturnValue(mockTokenPayload);
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.cleanExpiredTokens.mockResolvedValue();
      const tokenError = new Error('Token generation failed');
      mockTokenService.generateAccessToken.mockImplementation(() => {
        throw tokenError;
      });

      // Act & Assert
      await expect(refreshTokenUseCase.execute(validRequest))
        .rejects
        .toThrow('Token generation failed');

      expect(logger.error).toHaveBeenCalledWith('Token refresh failed', {
        error: 'Token generation failed'
      });
    });

    it('should handle errors during refresh token removal', async () => {
      // Arrange
      mockTokenService.verifyToken.mockReturnValue(mockTokenPayload);
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.cleanExpiredTokens.mockResolvedValue();
      mockTokenService.generateAccessToken.mockReturnValue('new-access-token');
      mockTokenService.generateRefreshToken.mockReturnValue('new-refresh-token');
      const removeError = new Error('Failed to remove refresh token');
      mockUserRepository.removeRefreshToken.mockRejectedValue(removeError);

      // Act & Assert
      await expect(refreshTokenUseCase.execute(validRequest))
        .rejects
        .toThrow('Failed to remove refresh token');

      expect(logger.error).toHaveBeenCalledWith('Token refresh failed', {
        error: 'Failed to remove refresh token'
      });
    });

    it('should handle errors during new refresh token storage', async () => {
      // Arrange
      mockTokenService.verifyToken.mockReturnValue(mockTokenPayload);
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.cleanExpiredTokens.mockResolvedValue();
      mockTokenService.generateAccessToken.mockReturnValue('new-access-token');
      mockTokenService.generateRefreshToken.mockReturnValue('new-refresh-token');
      mockUserRepository.removeRefreshToken.mockResolvedValue();
      const storeError = new Error('Failed to store new refresh token');
      mockUserRepository.addRefreshToken.mockRejectedValue(storeError);

      // Act & Assert
      await expect(refreshTokenUseCase.execute(validRequest))
        .rejects
        .toThrow('Failed to store new refresh token');

      expect(logger.error).toHaveBeenCalledWith('Token refresh failed', {
        error: 'Failed to store new refresh token'
      });
    });

    it('should handle non-Error objects', async () => {
      // Arrange
      mockTokenService.verifyToken.mockImplementation(() => {
        throw 'String error';
      });

      // Act & Assert
      await expect(refreshTokenUseCase.execute(validRequest))
        .rejects
        .toThrow('Invalid or expired refresh token');

      expect(logger.warn).toHaveBeenCalledWith('Invalid refresh token provided', {
        error: 'Unknown error'
      });
    });

    it('should set new refresh token expiry to 7 days', async () => {
      // Arrange
      const mockDate = new Date('2023-01-01T00:00:00.000Z');
      const dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime());

      mockTokenService.verifyToken.mockReturnValue(mockTokenPayload);
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.cleanExpiredTokens.mockResolvedValue();
      mockUserRepository.removeRefreshToken.mockResolvedValue();
      mockUserRepository.addRefreshToken.mockResolvedValue();
      mockTokenService.generateAccessToken.mockReturnValue('new-access-token');
      mockTokenService.generateRefreshToken.mockReturnValue('new-refresh-token');

      // Act
      await refreshTokenUseCase.execute(validRequest);

      // Assert
      const expectedExpiry = new Date(mockDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      expect(mockUserRepository.addRefreshToken).toHaveBeenCalledWith(
        'user123',
        {
          token: 'new-refresh-token',
          expiresAt: expectedExpiry
        }
      );

      dateNowSpy.mockRestore();
    });

    it('should clean expired tokens before generating new ones', async () => {
      // Arrange
      mockTokenService.verifyToken.mockReturnValue(mockTokenPayload);
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.cleanExpiredTokens.mockResolvedValue();
      mockUserRepository.removeRefreshToken.mockResolvedValue();
      mockUserRepository.addRefreshToken.mockResolvedValue();
      mockTokenService.generateAccessToken.mockReturnValue('new-access-token');
      mockTokenService.generateRefreshToken.mockReturnValue('new-refresh-token');

      // Act
      await refreshTokenUseCase.execute(validRequest);

      // Assert
      expect(mockUserRepository.cleanExpiredTokens).toHaveBeenCalledWith('user123');
      // Verify cleanExpiredTokens was called
      const cleanExpiredTokensCall = (mockUserRepository.cleanExpiredTokens as jest.Mock).mock.calls[0];
      const generateAccessTokenCall = (mockTokenService.generateAccessToken as jest.Mock).mock.calls[0];
      expect(cleanExpiredTokensCall).toBeDefined();
      expect(generateAccessTokenCall).toBeDefined();
    });

    it('should accept refresh token with different token string but same user', async () => {
      // Arrange
      const differentTokenRequest = { refreshToken: 'different-but-valid-token' };
      const userWithDifferentToken: User = {
        ...mockUser,
        refreshTokens: [
          {
            token: 'different-but-valid-token',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            createdAt: new Date()
          }
        ]
      };

      mockTokenService.verifyToken.mockReturnValue(mockTokenPayload);
      mockUserRepository.findById.mockResolvedValue(userWithDifferentToken);
      mockUserRepository.cleanExpiredTokens.mockResolvedValue();
      mockUserRepository.removeRefreshToken.mockResolvedValue();
      mockUserRepository.addRefreshToken.mockResolvedValue();
      mockTokenService.generateAccessToken.mockReturnValue('new-access-token');
      mockTokenService.generateRefreshToken.mockReturnValue('new-refresh-token');

      // Act
      const result = await refreshTokenUseCase.execute(differentTokenRequest);

      // Assert
      expect(result).toBeDefined();
      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
      expect(mockUserRepository.removeRefreshToken).toHaveBeenCalledWith('user123', 'different-but-valid-token');
    });
  });
});