import { Request, Response, NextFunction } from 'express';
import { Permission } from '../../src/auth/entities';

/**
 * Mock AuthController for testing purposes
 */
export const createMockAuthController = () => {
  return {
    login: jest.fn().mockImplementation(async (req: Request, res: Response) => {
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: 'mock-user-id',
            email: 'test@example.com',
            permissions: ['read:posts', 'create:posts']
          },
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token'
        }
      });
    }),

    refresh: jest.fn().mockImplementation(async (req: Request, res: Response) => {
      res.status(200).json({
        success: true,
        message: 'Token refreshed',
        data: {
          accessToken: 'new-mock-access-token',
          refreshToken: 'new-mock-refresh-token'
        }
      });
    }),

    logout: jest.fn().mockImplementation(async (req: Request, res: Response) => {
      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    }),

    me: jest.fn().mockImplementation(async (req: Request, res: Response) => {
      res.status(200).json({
        success: true,
        data: {
          id: 'mock-user-id',
          email: 'test@example.com',
          permissions: ['read:posts', 'create:posts']
        }
      });
    })
  };
};

/**
 * Mock AuthMiddleware for testing purposes
 */
export const createMockAuthMiddleware = () => {
  const mockMiddleware = jest.fn().mockImplementation((req: Request, res: Response, next: NextFunction) => {
    // Mock successful authentication
    (req as any).user = {
      id: 'mock-user-id',
      email: 'test@example.com',
      permissions: ['read:posts', 'create:posts', 'admin']
    };
    next();
  });

  return {
    requireReadAccess: jest.fn().mockReturnValue(mockMiddleware),
    requireCreateAccess: jest.fn().mockReturnValue(mockMiddleware),
    requireAdminAccess: jest.fn().mockReturnValue(mockMiddleware),
    optional: jest.fn().mockReturnValue(mockMiddleware),
    custom: jest.fn().mockReturnValue(mockMiddleware)
  };
};

/**
 * Creates a complete mock ExpressAppConfig for testing
 */
export const createMockExpressAppConfig = (applicationServices: any) => {
  return {
    applicationServices,
    authController: createMockAuthController() as any,
    authMiddleware: createMockAuthMiddleware() as any
  };
};

/**
 * Mock user for testing
 */
export const mockUser = {
  id: 'mock-user-id',
  email: 'test@example.com',
  permissions: [Permission.READ_POSTS, Permission.CREATE_POSTS, Permission.ADMIN]
};

/**
 * Mock tokens for testing
 */
export const mockTokens = {
  accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-access-token',
  refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-refresh-token'
};