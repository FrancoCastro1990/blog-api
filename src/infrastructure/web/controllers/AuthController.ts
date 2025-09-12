import { Request, Response } from 'express';
import { LoginUser, RefreshToken } from '@application/usecases/auth';
import { logger } from '@utils/logger';

export class AuthController {
  constructor(
    private loginUser: LoginUser,
    private refreshToken: RefreshToken
  ) {}

  /**
   * POST /auth/login
   * Authenticate user with email and password
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Basic validation
      if (!email || !password) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Email and password are required',
          details: {
            email: !email ? 'Email is required' : undefined,
            password: !password ? 'Password is required' : undefined
          }
        });
        return;
      }

      // Execute login use case
      const result = await this.loginUser.execute({ email, password });

      logger.info('Login successful', {
        userId: result.user.id,
        email: result.user.email,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Return authentication response
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.error('Login failed', {
        email: req.body.email,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        error: errorMessage
      });

      // Handle specific errors
      if (errorMessage.includes('Invalid email or password')) {
        res.status(401).json({
          error: 'Authentication failed',
          message: 'Invalid email or password'
        });
        return;
      }

      if (errorMessage.includes('required') || errorMessage.includes('format')) {
        res.status(400).json({
          error: 'Validation error',
          message: errorMessage
        });
        return;
      }

      // Generic server error
      res.status(500).json({
        error: 'Internal server error',
        message: 'Login service temporarily unavailable'
      });
    }
  }

  /**
   * POST /auth/refresh
   * Refresh access token using refresh token
   */
  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      // Basic validation
      if (!refreshToken) {
        res.status(400).json({
          error: 'Validation error',
          message: 'Refresh token is required'
        });
        return;
      }

      // Execute refresh token use case
      const result = await this.refreshToken.execute({ refreshToken });

      logger.info('Token refresh successful', {
        userId: result.user.id,
        email: result.user.email,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Return new tokens
      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: result
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.error('Token refresh failed', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        error: errorMessage
      });

      // Handle specific errors
      if (errorMessage.includes('Invalid or expired refresh token') ||
          errorMessage.includes('User not found')) {
        res.status(401).json({
          error: 'Authentication failed',
          message: 'Invalid or expired refresh token'
        });
        return;
      }

      if (errorMessage.includes('required')) {
        res.status(400).json({
          error: 'Validation error',
          message: errorMessage
        });
        return;
      }

      // Generic server error
      res.status(500).json({
        error: 'Internal server error',
        message: 'Token refresh service temporarily unavailable'
      });
    }
  }

  /**
   * POST /auth/logout
   * Logout user by invalidating refresh token
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const user = req.user; // From auth middleware

      if (!user) {
        res.status(401).json({
          error: 'Authentication required',
          message: 'Must be authenticated to logout'
        });
        return;
      }

      // If refresh token provided, remove it
      if (refreshToken) {
        // Note: This would require a new use case LogoutUser
        // For now, we'll just log the action
        logger.info('Logout requested with refresh token', {
          userId: user.id,
          email: user.email,
          ip: req.ip
        });
      }

      logger.info('User logged out', {
        userId: user.id,
        email: user.email,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.error('Logout failed', {
        userId: req.user?.id,
        ip: req.ip,
        error: errorMessage
      });

      res.status(500).json({
        error: 'Internal server error',
        message: 'Logout service temporarily unavailable'
      });
    }
  }

  /**
   * GET /auth/me
   * Get current user information
   */
  async me(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user;
      const token = req.token;

      if (!user || !token) {
        res.status(401).json({
          error: 'Authentication required',
          message: 'Valid authentication token required'
        });
        return;
      }

      logger.debug('User info requested', {
        userId: user.id,
        email: user.email,
        ip: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'User information retrieved',
        data: {
          user: {
            id: user.id,
            email: user.email,
            permissions: user.permissions
          },
          token: {
            type: token.type,
            expiresAt: new Date(token.exp * 1000), // Convert Unix timestamp to Date
            issuedAt: new Date(token.iat * 1000)
          }
        }
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      logger.error('Get user info failed', {
        userId: req.user?.id,
        ip: req.ip,
        error: errorMessage
      });

      res.status(500).json({
        error: 'Internal server error',
        message: 'User info service temporarily unavailable'
      });
    }
  }
}