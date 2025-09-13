import { Router } from 'express';
import { PostsController } from '@infrastructure/web/controllers/postsController';
import { ApplicationServices } from '@application/services';
import { AuthMiddleware } from '@infrastructure/web/middleware';

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
   * @access  Public - No authentication required
   */
  router.get('/', 
    postsController.getAllPosts
  );

  /**
   * @route   GET /api/posts/:id
   * @desc    Get a specific post by ID
   * @access  Public - No authentication required
   * @param   id - MongoDB ObjectId of the post
   */
  router.get('/:id', 
    postsController.getPostById
  );

  /**
   * @route   PUT /api/posts/:id
   * @desc    Update an existing post
   * @access  Protected - Requires UPDATE_POSTS permission
   * @param   id - MongoDB ObjectId of the post
   * @body    { title?: string, content?: string, author?: string }
   */
  router.put('/:id', 
    authMiddleware.requireUpdateAccess(),
    postsController.updatePost
  );

  /**
   * @route   DELETE /api/posts/:id
   * @desc    Delete a post
   * @access  Protected - Requires DELETE_POSTS permission
   * @param   id - MongoDB ObjectId of the post
   */
  router.delete('/:id', 
    authMiddleware.requireDeleteAccess(),
    postsController.deletePost
  );

  return router;
};