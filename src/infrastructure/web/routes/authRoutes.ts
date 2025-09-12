import { Router } from 'express';
import { AuthController } from '../controllers';
import { AuthMiddleware } from '../middleware';

export function createAuthRoutes(
  authController: AuthController, 
  authMiddleware: AuthMiddleware
): Router {
  const router = Router();

  // Public routes (no authentication required)
  router.post('/login', authController.login.bind(authController));
  router.post('/refresh', authController.refresh.bind(authController));

  // Protected routes (authentication required)
  router.post('/logout', 
    authMiddleware.optional(), // Optional because we handle missing auth in controller
    authController.logout.bind(authController)
  );

  router.get('/me', 
    authMiddleware.requireReadAccess(),
    authController.me.bind(authController)
  );

  return router;
}