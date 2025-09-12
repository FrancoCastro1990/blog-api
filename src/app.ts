import { Express } from 'express';
import { mongooseConnection } from './infrastructure/database/mongooseConnection';
import { MongoosePostRepository } from './infrastructure/repositories/MongoosePostRepository';
import { createApplicationServices } from './application/services';
import { createExpressApp } from './infrastructure/web/expressApp';
import { logger } from './utils/logger';

// Auth dependencies
import { MongooseUserRepository } from './infrastructure/repositories/MongooseUserRepository';
import { PasswordService, TokenService } from './domain/services';
import { LoginUser, RefreshToken, ValidateToken } from './application/usecases/auth';
import { AuthController } from './infrastructure/web/controllers';
import { AuthMiddleware } from './infrastructure/web/middleware';

/**
 * Application class responsible for bootstrapping the entire application
 * Following Hexagonal Architecture principles with authentication
 */
export class App {
  private express: Express | null = null;

  /**
   * Initializes the application with all its dependencies
   */
  async initialize(): Promise<Express> {
    try {
      logger.info('Initializing application...');

      // 1. Connect to database (Infrastructure)
      await mongooseConnection.connect();

      // 2. Create repository adapters (Infrastructure -> Domain ports)
      const postRepository = new MongoosePostRepository();
      const userRepository = new MongooseUserRepository();

      // 3. Create application services (Application layer)
      const applicationServices = createApplicationServices(postRepository);

      // 4. Create auth services (Auth layer)
      const passwordService = new PasswordService();
      const tokenService = new TokenService();

      // 5. Create auth use cases
      const loginUser = new LoginUser(userRepository, passwordService, tokenService);
      const refreshToken = new RefreshToken(userRepository, tokenService);
      const validateToken = new ValidateToken(userRepository, tokenService);

      // 6. Create auth controller and middleware
      const authController = new AuthController(loginUser, refreshToken);
      const authMiddleware = new AuthMiddleware(validateToken);

      // 7. Create Express app with dependency injection (Infrastructure)
      this.express = createExpressApp({
        applicationServices,
        authController,
        authMiddleware
      });

      logger.info('Application initialized successfully');
      return this.express;

    } catch (error) {
      logger.error('Failed to initialize application', error);
      throw error;
    }
  }

  /**
   * Gracefully shuts down the application
   */
  async shutdown(): Promise<void> {
    try {
      logger.info('Shutting down application...');

      // Close database connection
      await mongooseConnection.disconnect();

      logger.info('Application shut down successfully');
    } catch (error) {
      logger.error('Error during application shutdown', error);
      throw error;
    }
  }

  /**
   * Gets the Express application instance
   */
  getExpressApp(): Express {
    if (!this.express) {
      throw new Error('Application not initialized. Call initialize() first.');
    }
    return this.express;
  }
}