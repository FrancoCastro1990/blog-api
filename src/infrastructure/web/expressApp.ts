import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { ApplicationServices } from '@application/services';
import { createPostsRoutes } from '@infrastructure/web/routes/postsRoutes';
import { createAuthRoutes } from '@infrastructure/web/routes';
import { AuthMiddleware } from '@infrastructure/web/middleware';
import { AuthController } from '@infrastructure/web/controllers';
import { logger } from '@utils/logger';

/**
 * Configuration for Express app dependencies
 */
export interface ExpressAppConfig {
  applicationServices: ApplicationServices;
  authController: AuthController;
  authMiddleware: AuthMiddleware;
}

/**
 * Creates and configures the Express application
 * @param config - Configuration with all required dependencies
 * @returns Configured Express app
 */
export const createExpressApp = (config: ExpressAppConfig): Express => {
  const { applicationServices, authController, authMiddleware } = config;
  const app = express();

  // DEBUG: Middleware para ver si el request entra al pipeline
  app.use((req, res, next) => {
    console.log('DEBUG: Request received:', req.method, req.url);
    next();
  });

  // Middleware
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
      ? false // Configure specific origins in production
      : true, // Allow all origins in development
    credentials: true,
  }));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request logging middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    logger.info(`${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    next();
  });

  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // API routes
  app.use('/api/auth', createAuthRoutes(authController, authMiddleware));
  app.use('/api/posts', createPostsRoutes(applicationServices, authMiddleware));

  // Root endpoint
  app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
      message: 'Blog Posts API with Authentication',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        auth: {
          login: 'POST /api/auth/login',
          refresh: 'POST /api/auth/refresh',
          logout: 'POST /api/auth/logout',
          me: 'GET /api/auth/me'
        },
        posts: {
          create: 'POST /api/posts (requires CREATE_POSTS permission)',
          getAll: 'GET /api/posts (public access)'
        },
      },
    });
  });

  // 404 handler
  app.use((req: Request, res: Response) => {
    logger.warn(`404 - Route not found: ${req.method} ${req.path}`);
    res.status(404).json({
      error: 'Route not found',
      message: `Cannot ${req.method} ${req.path}`,
    });
  });

  // Global error handler
  app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error('Unhandled error', error);
    
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    });
  });

  return app;
};