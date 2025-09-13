import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { ApplicationServices } from '@application/services';
import { createPostSchema, postIdSchema, updatePostSchema } from '@schemas/postSchema';
import { logger } from '@utils/logger';

/**
 * PostsController handles HTTP requests for post-related operations.
 * This is part of the infrastructure layer (web adapter).
 */
export class PostsController {
  constructor(private readonly applicationServices: ApplicationServices) {}

  /**
   * Creates a new post
   * POST /api/posts
   */
  createPost = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request body
      const validatedData = createPostSchema.parse(req.body);

      // Execute use case
      const createPostUseCase = this.applicationServices.createPost();
      const createdPost = await createPostUseCase.execute(validatedData);

      logger.info('Post created successfully', { postId: createdPost.id });

      // Return created post
      res.status(201).json(createdPost);
    } catch (error) {
      this.handleError(error, res, 'Failed to create post');
    }
  };

  /**
   * Retrieves all posts
   * GET /api/posts
   */
  getAllPosts = async (req: Request, res: Response): Promise<void> => {
    try {
      // Execute use case
      const getAllPostsUseCase = this.applicationServices.getAllPosts();
      const posts = await getAllPostsUseCase.execute();

      logger.info('Posts retrieved successfully', { count: posts.length });

      // Return posts
      res.status(200).json(posts);
    } catch (error) {
      this.handleError(error, res, 'Failed to retrieve posts');
    }
  };

  /**
   * Retrieves a specific post by ID
   * GET /api/posts/:id
   */
  getPostById = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate post ID parameter
      const { id } = postIdSchema.parse(req.params);

      // Execute use case
      const getPostByIdUseCase = this.applicationServices.getPostById();
      const post = await getPostByIdUseCase.execute(id);

      if (!post) {
        logger.warn('Post not found', { postId: id });
        res.status(404).json({
          error: 'Post not found',
        });
        return;
      }

      logger.info('Post retrieved successfully', { postId: id });

      // Return post
      res.status(200).json(post);
    } catch (error) {
      this.handleError(error, res, 'Failed to retrieve post');
    }
  };

  /**
   * Updates an existing post
   * PUT /api/posts/:id
   */
  updatePost = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate post ID parameter
      const { id } = postIdSchema.parse(req.params);

      // Validate request body
      const updateData = updatePostSchema.parse(req.body);

      // Execute use case
      const updatePostUseCase = this.applicationServices.updatePost();
      const updatedPost = await updatePostUseCase.execute(id, updateData);

      if (!updatedPost) {
        logger.warn('Post not found for update', { postId: id });
        res.status(404).json({
          error: 'Post not found',
        });
        return;
      }

      logger.info('Post updated successfully', { postId: id });

      // Return updated post
      res.status(200).json(updatedPost);
    } catch (error) {
      this.handleError(error, res, 'Failed to update post');
    }
  };

  /**
   * Deletes a post
   * DELETE /api/posts/:id
   */
  deletePost = async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate post ID parameter
      const { id } = postIdSchema.parse(req.params);

      // Execute use case
      const deletePostUseCase = this.applicationServices.deletePost();
      const deleted = await deletePostUseCase.execute(id);

      if (!deleted) {
        logger.warn('Post not found for deletion', { postId: id });
        res.status(404).json({
          error: 'Post not found',
        });
        return;
      }

      logger.info('Post deleted successfully', { postId: id });

      // Return success response
      res.status(204).send();
    } catch (error) {
      this.handleError(error, res, 'Failed to delete post');
    }
  };

  /**
   * Error handling helper
   */
  private handleError(error: unknown, res: Response, defaultMessage: string): void {
    if (error instanceof ZodError) {
      // Validation errors
      const validationErrors = error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      logger.warn('Validation error', { errors: validationErrors });
      
      res.status(400).json({
        error: 'Validation failed',
        details: validationErrors,
      });
      return;
    }

    if (error instanceof Error) {
      logger.error(defaultMessage, error);
      
      // Don't expose internal error details in production
      const message = process.env.NODE_ENV === 'production' 
        ? 'Internal server error'
        : error.message;
      
      res.status(500).json({
        error: message,
      });
      return;
    }

    logger.error('Unknown error occurred', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
}