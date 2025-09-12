import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { ApplicationServices } from '../../application/services';
import { createPostsRoutes } from './routes/postsRoutes';
import { logger } from '../../utils/logger';

/**
 * Creates and configures the Express application
 * @param applicationServices - The application services instance
 * @returns Configured Express app
 */
export const createExpressApp = (applicationServices: ApplicationServices): Express => {
  const app = express();

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
  app.use('/api/posts', createPostsRoutes(applicationServices));

  // Root endpoint
  app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
      message: 'Blog Posts API',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        posts: '/api/posts',
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