import { Request, Response } from 'express';
import { AuthController } from '../../../../src/infrastructure/web/controllers/AuthController';
import { LoginUser, RefreshToken } from '../../../../src/application/usecases/auth';
import { User, Permission } from '../../../../src/domain/entities/User';
import { TokenType } from '../../../../src/domain/entities/Token';
import { logger } from '../../../../src/utils/logger';

// Mock the logger
jest.mock('../../../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

describe('AuthController', () => {
  let authController: AuthController;
  let mockLoginUser: jest.Mocked<LoginUser>;
  let mockRefreshToken: jest.Mocked<RefreshToken>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  const mockUser: User = {
    id: 'user123',
    email: 'test@example.com',
    passwordHash: 'hashedPassword',
    permissions: [Permission.READ_POSTS],
    refreshTokens: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockLoginResult = {
    user: mockUser,
    accessToken: 'access-token-123',
    refreshToken: 'refresh-token-123',
    expiresIn: 900 // 15 minutes
  };

  const mockRefreshResult = {
    user: mockUser,
    accessToken: 'new-access-token-123',
    refreshToken: 'new-refresh-token-123',
    expiresIn: 900
  };

  beforeEach(() => {
    mockLoginUser = {
      execute: jest.fn()
    } as any;

    mockRefreshToken = {
      execute: jest.fn()
    } as any;

    authController = new AuthController(mockLoginUser, mockRefreshToken);

    mockRequest = {
      body: {},
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Test User Agent')
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      // Arrange
      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123'
      };
      mockLoginUser.execute.mockResolvedValue(mockLoginResult);

      // Act
      await authController.login(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockLoginUser.execute).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Login successful',
        data: mockLoginResult
      });
      expect(logger.info).toHaveBeenCalledWith('Login successful', {
        userId: mockUser.id,
        email: mockUser.email,
        ip: '127.0.0.1',
        userAgent: 'Test User Agent'
      });
    });

    it('should return 400 when email is missing', async () => {
      // Arrange
      mockRequest.body = {
        password: 'password123'
      };

      // Act
      await authController.login(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockLoginUser.execute).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation error',
        message: 'Email and password are required',
        details: {
          email: 'Email is required',
          password: undefined
        }
      });
    });

    it('should return 400 when password is missing', async () => {
      // Arrange
      mockRequest.body = {
        email: 'test@example.com'
      };

      // Act
      await authController.login(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation error',
        message: 'Email and password are required',
        details: {
          email: undefined,
          password: 'Password is required'
        }
      });
    });

    it('should return 400 when both email and password are missing', async () => {
      // Arrange
      mockRequest.body = {};

      // Act
      await authController.login(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation error',
        message: 'Email and password are required',
        details: {
          email: 'Email is required',
          password: 'Password is required'
        }
      });
    });

    it('should return 401 for invalid credentials', async () => {
      // Arrange
      mockRequest.body = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };
      mockLoginUser.execute.mockRejectedValue(new Error('Invalid email or password'));

      // Act
      await authController.login(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authentication failed',
        message: 'Invalid email or password'
      });
      expect(logger.error).toHaveBeenCalledWith('Login failed', {
        email: 'test@example.com',
        ip: '127.0.0.1',
        userAgent: 'Test User Agent',
        error: 'Invalid email or password'
      });
    });

    it('should return 400 for validation errors', async () => {
      // Arrange
      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123'
      };
      mockLoginUser.execute.mockRejectedValue(new Error('Email format is invalid'));

      // Act
      await authController.login(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation error',
        message: 'Email format is invalid'
      });
    });

    it('should return 500 for unknown errors', async () => {
      // Arrange
      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123'
      };
      mockLoginUser.execute.mockRejectedValue(new Error('Database connection failed'));

      // Act
      await authController.login(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Login service temporarily unavailable'
      });
    });

    it('should handle non-Error objects', async () => {
      // Arrange
      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123'
      };
      mockLoginUser.execute.mockRejectedValue('String error');

      // Act
      await authController.login(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(logger.error).toHaveBeenCalledWith('Login failed', {
        email: 'test@example.com',
        ip: '127.0.0.1',
        userAgent: 'Test User Agent',
        error: 'Unknown error'
      });
    });
  });

  describe('refresh', () => {
    it('should refresh token successfully', async () => {
      // Arrange
      mockRequest.body = {
        refreshToken: 'refresh-token-123'
      };
      mockRefreshToken.execute.mockResolvedValue(mockRefreshResult);

      // Act
      await authController.refresh(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockRefreshToken.execute).toHaveBeenCalledWith({
        refreshToken: 'refresh-token-123'
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Token refreshed successfully',
        data: mockRefreshResult
      });
      expect(logger.info).toHaveBeenCalledWith('Token refresh successful', {
        userId: mockUser.id,
        email: mockUser.email,
        ip: '127.0.0.1',
        userAgent: 'Test User Agent'
      });
    });

    it('should return 400 when refresh token is missing', async () => {
      // Arrange
      mockRequest.body = {};

      // Act
      await authController.refresh(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockRefreshToken.execute).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation error',
        message: 'Refresh token is required'
      });
    });

    it('should return 401 for invalid refresh token', async () => {
      // Arrange
      mockRequest.body = {
        refreshToken: 'invalid-token'
      };
      mockRefreshToken.execute.mockRejectedValue(new Error('Invalid or expired refresh token'));

      // Act
      await authController.refresh(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authentication failed',
        message: 'Invalid or expired refresh token'
      });
    });

    it('should return 401 for user not found error', async () => {
      // Arrange
      mockRequest.body = {
        refreshToken: 'valid-token'
      };
      mockRefreshToken.execute.mockRejectedValue(new Error('User not found'));

      // Act
      await authController.refresh(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authentication failed',
        message: 'Invalid or expired refresh token'
      });
    });

    it('should return 400 for validation errors', async () => {
      // Arrange
      mockRequest.body = {
        refreshToken: 'token'
      };
      mockRefreshToken.execute.mockRejectedValue(new Error('Token is required'));

      // Act
      await authController.refresh(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation error',
        message: 'Token is required'
      });
    });

    it('should return 500 for unknown errors', async () => {
      // Arrange
      mockRequest.body = {
        refreshToken: 'refresh-token-123'
      };
      mockRefreshToken.execute.mockRejectedValue(new Error('Database connection failed'));

      // Act
      await authController.refresh(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Token refresh service temporarily unavailable'
      });
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      // Arrange
      mockRequest.body = {};
      mockRequest.user = mockUser;

      // Act
      await authController.logout(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logout successful'
      });
      expect(logger.info).toHaveBeenCalledWith('User logged out', {
        userId: mockUser.id,
        email: mockUser.email,
        ip: '127.0.0.1',
        userAgent: 'Test User Agent'
      });
    });

    it('should logout user with refresh token', async () => {
      // Arrange
      mockRequest.body = {
        refreshToken: 'refresh-token-123'
      };
      mockRequest.user = mockUser;

      // Act
      await authController.logout(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logout successful'
      });
      expect(logger.info).toHaveBeenCalledWith('Logout requested with refresh token', {
        userId: mockUser.id,
        email: mockUser.email,
        ip: '127.0.0.1'
      });
    });

    it('should return 401 when user not authenticated', async () => {
      // Arrange
      mockRequest.body = {};
      mockRequest.user = undefined;

      // Act
      await authController.logout(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        message: 'Must be authenticated to logout'
      });
    });

    it('should handle errors during logout', async () => {
      // Arrange
      mockRequest.body = {};
      mockRequest.user = mockUser;
      const mockGet = jest.fn().mockImplementation(() => {
        throw new Error('Network error');
      });
      mockRequest.get = mockGet;

      // Act
      await authController.logout(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Logout service temporarily unavailable'
      });
      expect(logger.error).toHaveBeenCalledWith('Logout failed', {
        userId: mockUser.id,
        ip: '127.0.0.1',
        error: 'Network error'
      });
    });
  });

  describe('me', () => {
    const mockTokenPayload = {
      userId: mockUser.id,
      email: mockUser.email,
      permissions: mockUser.permissions,
      type: TokenType.ACCESS,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900
    };

    it('should return user information successfully', async () => {
      // Arrange
      mockRequest.user = mockUser;
      mockRequest.token = mockTokenPayload;

      // Act
      await authController.me(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'User information retrieved',
        data: {
          user: {
            id: mockUser.id,
            email: mockUser.email,
            permissions: mockUser.permissions
          },
          token: {
            type: mockTokenPayload.type,
            expiresAt: new Date(mockTokenPayload.exp * 1000),
            issuedAt: new Date(mockTokenPayload.iat * 1000)
          }
        }
      });
      expect(logger.debug).toHaveBeenCalledWith('User info requested', {
        userId: mockUser.id,
        email: mockUser.email,
        ip: '127.0.0.1'
      });
    });

    it('should return 401 when user not provided', async () => {
      // Arrange
      mockRequest.user = undefined;
      mockRequest.token = mockTokenPayload;

      // Act
      await authController.me(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        message: 'Valid authentication token required'
      });
    });

    it('should return 401 when token not provided', async () => {
      // Arrange
      mockRequest.user = mockUser;
      mockRequest.token = undefined;

      // Act
      await authController.me(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        message: 'Valid authentication token required'
      });
    });

    it('should handle errors when getting user info', async () => {
      // Arrange
      mockRequest.user = mockUser;
      mockRequest.token = mockTokenPayload;
      
      // Mock logger.debug to throw an error
      const originalDebug = logger.debug;
      (logger.debug as jest.Mock).mockImplementation(() => {
        throw new Error('Server error');
      });

      // Act
      await authController.me(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'User info service temporarily unavailable'
      });
      expect(logger.error).toHaveBeenCalledWith('Get user info failed', {
        userId: mockUser.id,
        ip: '127.0.0.1',
        error: 'Server error'
      });

      // Restore original logger
      logger.debug = originalDebug;
    });
  });
});