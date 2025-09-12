import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { ApplicationServices } from '../../../application/services';
import { createPostSchema } from '../../../schemas/postSchema';
import { logger } from '../../../utils/logger';

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
      const message = process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'Internal server error';
      
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