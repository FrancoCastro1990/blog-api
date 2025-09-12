import { ValidateToken, ValidateTokenRequest } from '../../../../src/auth/usecases/ValidateToken';
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

describe('ValidateToken', () => {
  let validateTokenUseCase: ValidateToken;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockTokenService: jest.Mocked<TokenService>;

  const mockUser: User = {
    id: 'user123',
    email: 'test@example.com',
    passwordHash: 'hashedPassword123',
    permissions: [Permission.READ_POSTS, Permission.CREATE_POSTS],
    refreshTokens: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockAccessTokenPayload: TokenPayload = {
    userId: 'user123',
    email: 'test@example.com',
    permissions: [Permission.READ_POSTS, Permission.CREATE_POSTS],
    type: TokenType.ACCESS,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 // 1 hour
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

    validateTokenUseCase = new ValidateToken(mockUserRepository, mockTokenService);

    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should validate access token successfully without required permission', async () => {
      // Arrange
      const request: ValidateTokenRequest = {
        token: 'valid-access-token'
      };
      
      mockTokenService.verifyToken.mockReturnValue(mockAccessTokenPayload);
      mockUserRepository.findById.mockResolvedValue(mockUser);

      // Act
      const result = await validateTokenUseCase.execute(request);

      // Assert
      expect(result).toEqual({
        isValid: true,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          permissions: mockUser.permissions
        },
        payload: mockAccessTokenPayload
      });

      expect(mockTokenService.verifyToken).toHaveBeenCalledWith('valid-access-token');
      expect(mockUserRepository.findById).toHaveBeenCalledWith('user123');
    });

    it('should validate access token with required permission successfully', async () => {
      // Arrange
      const request: ValidateTokenRequest = {
        token: 'valid-access-token',
        requiredPermission: Permission.READ_POSTS
      };

      mockTokenService.verifyToken.mockReturnValue(mockAccessTokenPayload);
      mockTokenService.hasPermission.mockReturnValue(true);
      mockUserRepository.findById.mockResolvedValue(mockUser);

      // Act
      const result = await validateTokenUseCase.execute(request);

      // Assert
      expect(result.isValid).toBe(true);
      expect(mockTokenService.hasPermission).toHaveBeenCalledWith(
        mockAccessTokenPayload,
        Permission.READ_POSTS
      );
    });

    it('should fail when user not found', async () => {
      // Arrange
      const request: ValidateTokenRequest = {
        token: 'valid-access-token'
      };

      mockTokenService.verifyToken.mockReturnValue(mockAccessTokenPayload);
      mockUserRepository.findById.mockResolvedValue(null);

      // Act
      const result = await validateTokenUseCase.execute(request);

      // Assert
      expect(result).toEqual({
        isValid: false,
        error: 'User not found'
      });

      expect(logger.warn).toHaveBeenCalledWith('Token validation failed - user not found', {
        userId: 'user123'
      });
    });

    it('should fail when user lacks required permission', async () => {
      // Arrange
      const request: ValidateTokenRequest = {
        token: 'valid-access-token',
        requiredPermission: Permission.ADMIN
      };

      mockTokenService.verifyToken.mockReturnValue(mockAccessTokenPayload);
      mockTokenService.hasPermission.mockReturnValue(false);

      // Act
      const result = await validateTokenUseCase.execute(request);

      // Assert
      expect(result).toEqual({
        isValid: false,
        error: 'Permission admin required'
      });

      expect(logger.warn).toHaveBeenCalledWith('Token validation failed - insufficient permissions', {
        userId: mockAccessTokenPayload.userId,
        userPermissions: mockAccessTokenPayload.permissions,
        requiredPermission: Permission.ADMIN
      });
    });

    it('should handle invalid token', async () => {
      // Arrange
      const request: ValidateTokenRequest = {
        token: 'invalid-token'
      };

      mockTokenService.verifyToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act
      const result = await validateTokenUseCase.execute(request);

      // Assert
      expect(result).toEqual({
        isValid: false,
        error: 'Invalid or expired token'
      });

      expect(logger.warn).toHaveBeenCalledWith('Token validation failed - invalid token', {
        error: 'Invalid token'
      });
    });

    it('should handle repository errors during user lookup', async () => {
      // Arrange
      const request: ValidateTokenRequest = {
        token: 'valid-access-token'
      };

      mockTokenService.verifyToken.mockReturnValue(mockAccessTokenPayload);
      const dbError = new Error('Database connection failed');
      mockUserRepository.findById.mockRejectedValue(dbError);

      // Act
      const result = await validateTokenUseCase.execute(request);

      // Assert
      expect(result).toEqual({
        isValid: false,
        error: 'Token validation failed'
      });

      expect(logger.error).toHaveBeenCalledWith('Token validation error', {
        error: 'Database connection failed'
      });
    });

    it('should handle non-Error objects during token verification', async () => {
      // Arrange
      const request: ValidateTokenRequest = {
        token: 'problematic-token'
      };

      mockTokenService.verifyToken.mockImplementation(() => {
        throw 'String error';
      });

      // Act
      const result = await validateTokenUseCase.execute(request);

      // Assert
      expect(result).toEqual({
        isValid: false,
        error: 'Invalid or expired token'
      });

      expect(logger.warn).toHaveBeenCalledWith('Token validation failed - invalid token', {
        error: 'Unknown error'
      });
    });

    it('should handle empty token', async () => {
      // Arrange
      const request: ValidateTokenRequest = {
        token: ''
      };

      // Act
      const result = await validateTokenUseCase.execute(request);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Token is required');
    });

    it('should handle token type validation when required', async () => {
      // Arrange
      const request: ValidateTokenRequest = {
        token: 'valid-token',
        requiredTokenType: TokenType.REFRESH
      };

      const refreshTokenPayload: TokenPayload = {
        ...mockAccessTokenPayload,
        type: TokenType.REFRESH
      };

      // Create mock user with refresh token
      const mockUserWithRefreshToken: User = {
        ...mockUser,
        refreshTokens: [{
          token: 'valid-token',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          createdAt: new Date()
        }]
      };

      mockTokenService.verifyToken.mockReturnValue(refreshTokenPayload);
      mockTokenService.isTokenType.mockReturnValue(true);
      mockUserRepository.findById.mockResolvedValue(mockUserWithRefreshToken);

      // Act
      const result = await validateTokenUseCase.execute(request);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.payload?.type).toBe(TokenType.REFRESH);
    });

    it('should fail when token type is wrong', async () => {
      // Arrange
      const request: ValidateTokenRequest = {
        token: 'access-token',
        requiredTokenType: TokenType.REFRESH
      };

      mockTokenService.verifyToken.mockReturnValue(mockAccessTokenPayload); // Access token when refresh expected
      mockTokenService.isTokenType.mockReturnValue(false);
      mockUserRepository.findById.mockResolvedValue(mockUser);

      // Act
      const result = await validateTokenUseCase.execute(request);

      // Assert
      expect(result).toEqual({
        isValid: false,
        error: 'Token type refresh required'
      });

      expect(logger.warn).toHaveBeenCalledWith('Token validation failed - wrong token type', {
        userId: 'user123',
        tokenType: TokenType.ACCESS,
        requiredTokenType: TokenType.REFRESH
      });
    });
  });
});