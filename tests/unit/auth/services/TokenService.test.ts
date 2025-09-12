import { User, Permission } from '../../../../src/auth/entities';
import { TokenType } from '../../../../src/auth/entities/Token';
import jwt from 'jsonwebtoken';
import { TokenService } from '../../../../src/auth/services';

describe('TokenService', () => {
  let tokenService: TokenService;
  const mockSecret = 'test-jwt-secret';

  beforeEach(() => {
    tokenService = new TokenService(mockSecret);
    // Mock environment variable
    process.env.AUTH_JWT_SECRET = mockSecret;
  });

  afterEach(() => {
    delete process.env.AUTH_JWT_SECRET;
  });

  describe('generateAccessToken', () => {
    it('should generate valid access token for user', () => {
      // Arrange
      const user: User = {
        id: 'user123',
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
        permissions: [Permission.READ_POSTS],
        refreshTokens: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Act
      const token = tokenService.generateAccessToken(user);

      // Assert
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      // Verify token structure
      const decoded = jwt.verify(token, mockSecret) as any;
      expect(decoded.userId).toBe(user.id);
      expect(decoded.email).toBe(user.email);
      expect(decoded.permissions).toEqual([Permission.READ_POSTS]);
      expect(decoded.type).toBe(TokenType.ACCESS);
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });

    it('should generate access token with admin permissions', () => {
      // Arrange
      const adminUser: User = {
        id: 'admin123',
        email: 'admin@example.com',
        passwordHash: 'hashedPassword',
        permissions: [Permission.READ_POSTS, Permission.CREATE_POSTS, Permission.ADMIN],
        refreshTokens: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Act
      const token = tokenService.generateAccessToken(adminUser);

      // Assert
      const decoded = jwt.verify(token, mockSecret) as any;
      expect(decoded.permissions).toEqual([
        Permission.READ_POSTS, 
        Permission.CREATE_POSTS, 
        Permission.ADMIN
      ]);
    });

    it('should set correct expiration time', () => {
      // Arrange
      const user: User = {
        id: 'user123',
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
        permissions: [Permission.READ_POSTS],
        refreshTokens: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const beforeGeneration = Math.floor(Date.now() / 1000);

      // Act
      const token = tokenService.generateAccessToken(user);

      // Assert
      const decoded = jwt.verify(token, mockSecret) as any;
      const expectedExpiry = beforeGeneration + (15 * 60); // 15 minutes
      expect(decoded.exp).toBeGreaterThanOrEqual(expectedExpiry - 5); // Allow 5 seconds tolerance
      expect(decoded.exp).toBeLessThanOrEqual(expectedExpiry + 5);
    });
  });

  describe('generateAdminToken', () => {
    it('should generate admin token with extended expiration', () => {
      // Arrange
      const adminUser: User = {
        id: 'admin123',
        email: 'admin@example.com',
        passwordHash: 'hashedPassword',
        permissions: [Permission.ADMIN],
        refreshTokens: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const beforeGeneration = Math.floor(Date.now() / 1000);

      // Act
      const token = tokenService.generateAdminToken(adminUser);

      // Assert
      expect(token).toBeDefined();
      const decoded = jwt.verify(token, mockSecret) as any;
      expect(decoded.type).toBe(TokenType.ADMIN);
      
      const expectedExpiry = beforeGeneration + (60 * 60); // 1 hour
      expect(decoded.exp).toBeGreaterThanOrEqual(expectedExpiry - 5);
      expect(decoded.exp).toBeLessThanOrEqual(expectedExpiry + 5);
    });

    it('should throw error for non-admin user', () => {
      // Arrange
      const regularUser: User = {
        id: 'user123',
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
        permissions: [Permission.READ_POSTS],
        refreshTokens: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Act & Assert
      expect(() => tokenService.generateAdminToken(regularUser))
        .toThrow('User does not have admin permissions');
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate refresh token with long expiration', () => {
      // Arrange
      const user: User = {
        id: 'user123',
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
        permissions: [Permission.READ_POSTS],
        refreshTokens: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const beforeGeneration = Math.floor(Date.now() / 1000);

      // Act
      const token = tokenService.generateRefreshToken(user);

      // Assert
      expect(token).toBeDefined();
      const decoded = jwt.verify(token, mockSecret) as any;
      expect(decoded.type).toBe(TokenType.REFRESH);
      expect(decoded.userId).toBe(user.id);
      
      const expectedExpiry = beforeGeneration + (7 * 24 * 60 * 60); // 7 days
      expect(decoded.exp).toBeGreaterThanOrEqual(expectedExpiry - 5);
      expect(decoded.exp).toBeLessThanOrEqual(expectedExpiry + 5);
    });
  });

  describe('verifyToken', () => {
    it('should verify valid access token', () => {
      // Arrange
      const user: User = {
        id: 'user123',
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
        permissions: [Permission.READ_POSTS],
        refreshTokens: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const token = tokenService.generateAccessToken(user);

      // Act
      const payload = tokenService.verifyToken(token);

      // Assert
      expect(payload).toBeDefined();
      expect(payload.userId).toBe(user.id);
      expect(payload.email).toBe(user.email);
      expect(payload.permissions).toEqual([Permission.READ_POSTS]);
      expect(payload.type).toBe(TokenType.ACCESS);
    });

    it('should throw error for invalid token', () => {
      // Arrange
      const invalidToken = 'invalid.jwt.token';

      // Act & Assert
      expect(() => tokenService.verifyToken(invalidToken))
        .toThrow();
    });

    it('should throw error for expired token', () => {
      // Arrange
      const expiredToken = jwt.sign(
        { userId: 'user123', exp: Math.floor(Date.now() / 1000) - 3600 }, // 1 hour ago
        mockSecret
      );

      // Act & Assert
      expect(() => tokenService.verifyToken(expiredToken))
        .toThrow();
    });

    it('should throw error for token with wrong secret', () => {
      // Arrange
      const tokenWithWrongSecret = jwt.sign(
        { userId: 'user123' },
        'wrong-secret'
      );

      // Act & Assert
      expect(() => tokenService.verifyToken(tokenWithWrongSecret))
        .toThrow();
    });
  });

  describe('hasPermission', () => {
    it('should return true when user has required permission', () => {
      // Arrange
      const payload = {
        userId: 'user123',
        email: 'test@example.com',
        permissions: [Permission.READ_POSTS, Permission.CREATE_POSTS],
        type: TokenType.ACCESS,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900
      };

      // Act & Assert
      expect(tokenService.hasPermission(payload, Permission.READ_POSTS)).toBe(true);
      expect(tokenService.hasPermission(payload, Permission.CREATE_POSTS)).toBe(true);
    });

    it('should return false when user lacks required permission', () => {
      // Arrange
      const payload = {
        userId: 'user123',
        email: 'test@example.com',
        permissions: [Permission.READ_POSTS],
        type: TokenType.ACCESS,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900
      };

      // Act & Assert
      expect(tokenService.hasPermission(payload, Permission.CREATE_POSTS)).toBe(false);
      expect(tokenService.hasPermission(payload, Permission.ADMIN)).toBe(false);
    });

    it('should return true for admin permission when user is admin', () => {
      // Arrange
      const payload = {
        userId: 'admin123',
        email: 'admin@example.com',
        permissions: [Permission.READ_POSTS, Permission.CREATE_POSTS, Permission.ADMIN],
        type: TokenType.ADMIN,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      // Act & Assert
      expect(tokenService.hasPermission(payload, Permission.ADMIN)).toBe(true);
    });
  });

  describe('isTokenType', () => {
    it('should return true when token type matches', () => {
      // Arrange
      const payload = {
        userId: 'user123',
        email: 'test@example.com',
        permissions: [Permission.READ_POSTS],
        type: TokenType.ACCESS,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900
      };

      // Act & Assert
      expect(tokenService.isTokenType(payload, TokenType.ACCESS)).toBe(true);
      expect(tokenService.isTokenType(payload, TokenType.REFRESH)).toBe(false);
      expect(tokenService.isTokenType(payload, TokenType.ADMIN)).toBe(false);
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer header', () => {
      // Arrange
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature';
      const authHeader = `Bearer ${token}`;

      // Act
      const extracted = tokenService.extractTokenFromHeader(authHeader);

      // Assert
      expect(extracted).toBe(token);
    });

    it('should return null for undefined header', () => {
      // Act
      const extracted = tokenService.extractTokenFromHeader(undefined);

      // Assert
      expect(extracted).toBeNull();
    });

    it('should return null for malformed header', () => {
      // Arrange
      const malformedHeaders = [
        'InvalidFormat token',
        'Bearer',
        'Bearer token extra',
        'token-without-bearer',
        '',
        'Basic token'
      ];

      // Act & Assert
      malformedHeaders.forEach(header => {
        expect(tokenService.extractTokenFromHeader(header)).toBeNull();
      });
    });
  });

  describe('verifyToken - detailed error cases', () => {
    it('should handle JsonWebTokenError specifically', () => {
      // Arrange
      const malformedToken = 'not.a.valid.jwt.token.structure';

      // Act & Assert
      expect(() => tokenService.verifyToken(malformedToken))
        .toThrow('Invalid token:');
    });

    it('should handle TokenExpiredError specifically', () => {
      // Arrange
      const expiredToken = jwt.sign(
        { 
          userId: 'user123',
          email: 'test@example.com',
          permissions: [Permission.READ_POSTS],
          type: TokenType.ACCESS,
          exp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
        },
        mockSecret
      );

      // Act & Assert
      expect(() => tokenService.verifyToken(expiredToken))
        .toThrow('Token has expired');
    });

    it('should handle NotBeforeError specifically', () => {
      // Arrange
      const notYetValidToken = jwt.sign(
        { 
          userId: 'user123',
          email: 'test@example.com',
          permissions: [Permission.READ_POSTS],
          type: TokenType.ACCESS,
          nbf: Math.floor(Date.now() / 1000) + 3600 // Valid 1 hour from now
        },
        mockSecret
      );

      // Act & Assert
      expect(() => tokenService.verifyToken(notYetValidToken))
        .toThrow('Token not active yet');
    });

    it('should handle unknown error types', () => {
      // Arrange - This is harder to test directly, but we can mock jwt.verify to throw unknown error
      const originalVerify = jwt.verify;
      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        throw new Error('Unknown custom error');
      });

      // Act & Assert
      expect(() => tokenService.verifyToken('any-token'))
        .toThrow('Token verification failed: Unknown custom error');

      // Cleanup
      jwt.verify = originalVerify;
    });

    it('should handle non-Error objects in verification', () => {
      // Arrange
      const originalVerify = jwt.verify;
      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        throw 'String error instead of Error object';
      });

      // Act & Assert
      expect(() => tokenService.verifyToken('any-token'))
        .toThrow('Token verification failed: Unknown error');

      // Cleanup
      jwt.verify = originalVerify;
    });
  });

  describe('constructor edge cases', () => {
    it('should use provided JWT secret', () => {
      // Arrange
      const customSecret = 'custom-secret-123';
      
      // Act
      const service = new TokenService(customSecret);
      
      // Assert - Generate and verify a token to ensure the custom secret is used
      const user: User = {
        id: 'user123',
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
        permissions: [Permission.READ_POSTS],
        refreshTokens: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const token = service.generateAccessToken(user);
      const decoded = service.verifyToken(token);
      expect(decoded.userId).toBe('user123');
    });

    it('should use environment variable when no secret provided', () => {
      // Arrange
      process.env.AUTH_JWT_SECRET = 'env-secret-123';
      
      // Act
      const service = new TokenService();
      
      // Assert
      const user: User = {
        id: 'user123',
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
        permissions: [Permission.READ_POSTS],
        refreshTokens: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const token = service.generateAccessToken(user);
      const decoded = service.verifyToken(token);
      expect(decoded.userId).toBe('user123');
      
      // Cleanup
      delete process.env.AUTH_JWT_SECRET;
    });

    it('should throw error for empty string secret', () => {
      // Act & Assert
      expect(() => new TokenService(''))
        .toThrow('JWT secret not configured');
    });

    it('should throw error for whitespace-only secret', () => {
      // Act & Assert
      expect(() => new TokenService('   '))
        .toThrow('JWT secret not configured');
    });

  });

  describe('edge cases', () => {
    it('should handle user with no permissions', () => {
      // Arrange
      const user: User = {
        id: 'user123',
        email: 'test@example.com',
        passwordHash: 'hashedPassword',
        permissions: [],
        refreshTokens: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Act
      const token = tokenService.generateAccessToken(user);

      // Assert
      const decoded = jwt.verify(token, mockSecret) as any;
      expect(decoded.permissions).toEqual([]);
    });
  });
});