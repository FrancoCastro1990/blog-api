import { Router } from 'express';
import { PostsController } from '../controllers/postsController';
import { ApplicationServices } from '../../../application/services';
import { AuthMiddleware } from '../middleware';

/**
 * Creates and configures the posts routes with authentication
 * @param applicationServices - The application services instance
 * @param authMiddleware - The authentication middleware instance
 * @returns Configured router with posts endpoints
 */
export const createPostsRoutes = (
  applicationServices: ApplicationServices, 
  authMiddleware: AuthMiddleware
): Router => {
  const router = Router();
  const postsController = new PostsController(applicationServices);

  /**
   * @route   POST /api/posts
   * @desc    Create a new post
   * @access  Protected - Requires CREATE_POSTS permission
   * @body    { title: string, content: string, author?: string }
   */
  router.post('/', 
    authMiddleware.requireCreateAccess(),
    postsController.createPost
  );

  /**
   * @route   GET /api/posts
   * @desc    Get all posts
   * @access  Protected - Requires READ_POSTS permission
   */
  router.get('/', 
    authMiddleware.requireReadAccess(),
    postsController.getAllPosts
  );

  return router;
};