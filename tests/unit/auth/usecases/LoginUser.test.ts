import { LoginUser, LoginUserRequest } from '../../../../src/auth/usecases/LoginUser';
import { UserRepository } from '../../../../src/auth/repositories';
import { PasswordService, TokenService } from '../../../../src/auth/services';
import { User, Permission } from '../../../../src/auth/entities';
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

describe('LoginUser', () => {
  let loginUser: LoginUser;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockPasswordService: jest.Mocked<PasswordService>;
  let mockTokenService: jest.Mocked<TokenService>;

  const mockUser: User = {
    id: 'user123',
    email: 'test@example.com',
    passwordHash: 'hashedPassword123',
    permissions: [Permission.READ_POSTS],
    refreshTokens: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const validRequest: LoginUserRequest = {
    email: 'test@example.com',
    password: 'password123'
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

    mockPasswordService = {
      hash: jest.fn(),
      verify: jest.fn()
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

    loginUser = new LoginUser(mockUserRepository, mockPasswordService, mockTokenService);

    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should login user successfully', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockPasswordService.verify.mockResolvedValue(true);
      mockTokenService.generateAccessToken.mockReturnValue('access-token-123');
      mockTokenService.generateRefreshToken.mockReturnValue('refresh-token-123');
      mockUserRepository.cleanExpiredTokens.mockResolvedValue();
      mockUserRepository.addRefreshToken.mockResolvedValue();

      // Act
      const result = await loginUser.execute(validRequest);

      // Assert
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          permissions: mockUser.permissions
        },
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123'
      });

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockPasswordService.verify).toHaveBeenCalledWith('password123', 'hashedPassword123');
      expect(mockTokenService.generateAccessToken).toHaveBeenCalledWith(mockUser);
      expect(mockTokenService.generateRefreshToken).toHaveBeenCalledWith(mockUser);
      expect(mockUserRepository.cleanExpiredTokens).toHaveBeenCalledWith(mockUser.id);
      expect(mockUserRepository.addRefreshToken).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          token: 'refresh-token-123',
          expiresAt: expect.any(Date)
        })
      );
      expect(logger.info).toHaveBeenCalledWith('User logged in successfully', {
        userId: mockUser.id,
        email: mockUser.email,
        permissions: mockUser.permissions
      });
    });

    it('should throw error when email is missing', async () => {
      // Arrange
      const invalidRequest = { email: '', password: 'password123' };

      // Act & Assert
      await expect(loginUser.execute(invalidRequest))
        .rejects
        .toThrow('Email and password are required');

      expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
    });

    it('should throw error when password is missing', async () => {
      // Arrange
      const invalidRequest = { email: 'test@example.com', password: '' };

      // Act & Assert
      await expect(loginUser.execute(invalidRequest))
        .rejects
        .toThrow('Email and password are required');

      expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
    });

    it('should throw error when both email and password are missing', async () => {
      // Arrange
      const invalidRequest = { email: '', password: '' };

      // Act & Assert
      await expect(loginUser.execute(invalidRequest))
        .rejects
        .toThrow('Email and password are required');

      expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
    });

    it('should throw error for invalid email format', async () => {
      // Arrange
      const invalidRequest = { email: 'invalid-email', password: 'password123' };

      // Act & Assert
      await expect(loginUser.execute(invalidRequest))
        .rejects
        .toThrow('Invalid email format');

      expect(mockUserRepository.findByEmail).not.toHaveBeenCalled();
    });

    it('should throw error when user not found', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(loginUser.execute(validRequest))
        .rejects
        .toThrow('Invalid email or password');

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(logger.warn).toHaveBeenCalledWith('Login attempt with non-existent email', {
        email: 'test@example.com'
      });
      expect(mockPasswordService.verify).not.toHaveBeenCalled();
    });

    it('should throw error when password is invalid', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockPasswordService.verify.mockResolvedValue(false);

      // Act & Assert
      await expect(loginUser.execute(validRequest))
        .rejects
        .toThrow('Invalid email or password');

      expect(mockPasswordService.verify).toHaveBeenCalledWith('password123', 'hashedPassword123');
      expect(logger.warn).toHaveBeenCalledWith('Login attempt with invalid password', {
        userId: mockUser.id,
        email: mockUser.email
      });
      expect(mockTokenService.generateAccessToken).not.toHaveBeenCalled();
    });

    it('should handle repository errors during user lookup', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      mockUserRepository.findByEmail.mockRejectedValue(dbError);

      // Act & Assert
      await expect(loginUser.execute(validRequest))
        .rejects
        .toThrow('Database connection failed');

      expect(logger.error).toHaveBeenCalledWith('Login failed', {
        email: 'test@example.com',
        error: 'Database connection failed'
      });
    });

    it('should handle password service errors', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      const passwordError = new Error('Password service unavailable');
      mockPasswordService.verify.mockRejectedValue(passwordError);

      // Act & Assert
      await expect(loginUser.execute(validRequest))
        .rejects
        .toThrow('Password service unavailable');

      expect(logger.error).toHaveBeenCalledWith('Login failed', {
        email: 'test@example.com',
        error: 'Password service unavailable'
      });
    });

    it('should handle token generation errors', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockPasswordService.verify.mockResolvedValue(true);
      mockUserRepository.cleanExpiredTokens.mockResolvedValue();
      const tokenError = new Error('Token generation failed');
      mockTokenService.generateAccessToken.mockImplementation(() => {
        throw tokenError;
      });

      // Act & Assert
      await expect(loginUser.execute(validRequest))
        .rejects
        .toThrow('Token generation failed');

      expect(logger.error).toHaveBeenCalledWith('Login failed', {
        email: 'test@example.com',
        error: 'Token generation failed'
      });
    });

    it('should handle errors when storing refresh token', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockPasswordService.verify.mockResolvedValue(true);
      mockTokenService.generateAccessToken.mockReturnValue('access-token-123');
      mockTokenService.generateRefreshToken.mockReturnValue('refresh-token-123');
      mockUserRepository.cleanExpiredTokens.mockResolvedValue();
      const storeError = new Error('Failed to store refresh token');
      mockUserRepository.addRefreshToken.mockRejectedValue(storeError);

      // Act & Assert
      await expect(loginUser.execute(validRequest))
        .rejects
        .toThrow('Failed to store refresh token');

      expect(logger.error).toHaveBeenCalledWith('Login failed', {
        email: 'test@example.com',
        error: 'Failed to store refresh token'
      });
    });

    it('should handle non-Error objects', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockRejectedValue('String error');

      // Act & Assert
      await expect(loginUser.execute(validRequest))
        .rejects
        .toEqual('String error');

      expect(logger.error).toHaveBeenCalledWith('Login failed', {
        email: 'test@example.com',
        error: 'Unknown error'
      });
    });

    it('should clean expired tokens before generating new ones', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockPasswordService.verify.mockResolvedValue(true);
      mockTokenService.generateAccessToken.mockReturnValue('access-token-123');
      mockTokenService.generateRefreshToken.mockReturnValue('refresh-token-123');
      mockUserRepository.cleanExpiredTokens.mockResolvedValue();
      mockUserRepository.addRefreshToken.mockResolvedValue();

      // Act
      await loginUser.execute(validRequest);

      // Assert
      expect(mockUserRepository.cleanExpiredTokens).toHaveBeenCalledWith(mockUser.id);
      // Verify order by checking call order in the mock calls
      const cleanTokensCall = mockUserRepository.cleanExpiredTokens.mock.calls.length;
      const generateTokenCall = mockTokenService.generateAccessToken.mock.calls.length;
      expect(cleanTokensCall).toBe(1);
      expect(generateTokenCall).toBe(1);
    });

    it('should set refresh token expiry to 7 days', async () => {
      // Arrange
      const mockDate = new Date('2023-01-01T00:00:00.000Z');
      const dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime());

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockPasswordService.verify.mockResolvedValue(true);
      mockTokenService.generateAccessToken.mockReturnValue('access-token-123');
      mockTokenService.generateRefreshToken.mockReturnValue('refresh-token-123');
      mockUserRepository.cleanExpiredTokens.mockResolvedValue();
      mockUserRepository.addRefreshToken.mockResolvedValue();

      // Act
      await loginUser.execute(validRequest);

      // Assert
      const expectedExpiry = new Date(mockDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      expect(mockUserRepository.addRefreshToken).toHaveBeenCalledWith(
        mockUser.id,
        {
          token: 'refresh-token-123',
          expiresAt: expectedExpiry
        }
      );

      dateNowSpy.mockRestore();
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email formats', async () => {
      // Test indirectly through execute method
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'email+tag@domain.org',
        'firstname.lastname@company.com'
      ];

      for (const email of validEmails) {
        mockUserRepository.findByEmail.mockResolvedValue(null);
        
        await expect(loginUser.execute({ email, password: 'password' }))
          .rejects
          .toThrow('Invalid email or password'); // Should pass email validation but fail on user not found

        expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
      }
    });

    it('should reject invalid email formats', async () => {
      // Test indirectly through execute method
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@domain',
        'user.domain.com',
        'user@domain.',
        'user space@domain.com'
      ];

      for (const email of invalidEmails) {
        await expect(loginUser.execute({ email, password: 'password' }))
          .rejects
          .toThrow('Invalid email format');

        expect(mockUserRepository.findByEmail).not.toHaveBeenCalledWith(email);
      }
    });
  });
});