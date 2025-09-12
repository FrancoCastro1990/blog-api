import { Router } from 'express';
import { PostsController } from '../controllers/postsController';
import { ApplicationServices } from '../../../application/services';

/**
 * Creates and configures the posts routes
 * @param applicationServices - The application services instance
 * @returns Configured router with posts endpoints
 */
export const createPostsRoutes = (applicationServices: ApplicationServices): Router => {
  const router = Router();
  const postsController = new PostsController(applicationServices);

  /**
   * @route   POST /api/posts
   * @desc    Create a new post
   * @access  Public
   * @body    { title: string, content: string, author?: string }
   */
  router.post('/', postsController.createPost);

  /**
   * @route   GET /api/posts
   * @desc    Get all posts
   * @access  Public
   */
  router.get('/', postsController.getAllPosts);

  return router;
};