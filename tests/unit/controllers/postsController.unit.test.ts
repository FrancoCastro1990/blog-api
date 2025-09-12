import { Request, Response } from 'express';
import { PostsController } from '../../../src/infrastructure/web/controllers/postsController';
import { ApplicationServices } from '../../../src/application/services';
import { ZodError } from 'zod';

// Mock de response para tests
const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  return res;
};

describe('PostsController Unit Tests', () => {
  let postsController: PostsController;
  let mockApplicationServices: jest.Mocked<ApplicationServices>;
  let mockCreatePostUseCase: any;
  let mockGetAllPostsUseCase: any;

  beforeEach(() => {
    // Mock use cases
    mockCreatePostUseCase = {
      execute: jest.fn()
    };
    
    mockGetAllPostsUseCase = {
      execute: jest.fn()
    };

    // Mock application services
    mockApplicationServices = {
      createPost: jest.fn().mockReturnValue(mockCreatePostUseCase),
      getAllPosts: jest.fn().mockReturnValue(mockGetAllPostsUseCase)
    } as any;

    // Create controller instance
    postsController = new PostsController(mockApplicationServices);
  });

  describe('createPost', () => {
    it('should create a post successfully', async () => {
      // Arrange
      const req = {
        body: {
          title: 'Test Title',
          content: 'Test Content',
          author: 'Test Author'
        }
      } as Request;

      const res = createMockResponse() as Response;

      const mockCreatedPost = {
        id: '123',
        title: 'Test Title',
        content: 'Test Content',
        author: 'Test Author',
        createdAt: new Date().toISOString(),
        updatedAt: null
      };

      mockCreatePostUseCase.execute.mockResolvedValue(mockCreatedPost);

      // Act
      await postsController.createPost(req, res);

      // Assert
      expect(mockApplicationServices.createPost).toHaveBeenCalled();
      expect(mockCreatePostUseCase.execute).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockCreatedPost);
    });

    it('should handle validation errors', async () => {
      // Arrange
      const req = {
        body: {
          title: '', // Invalid empty title
          content: 'Test Content'
        }
      } as Request;

      const res = createMockResponse() as Response;

      // Act
      await postsController.createPost(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation failed',
          details: expect.any(Array)
        })
      );
    });

    it('should handle use case errors', async () => {
      // Arrange
      const req = {
        body: {
          title: 'Valid Title',
          content: 'Valid Content'
        }
      } as Request;

      const res = createMockResponse() as Response;

      mockCreatePostUseCase.execute.mockRejectedValue(new Error('Database error'));

      // Act
      await postsController.createPost(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Database error'
        })
      );
    });
  });

  describe('getAllPosts', () => {
    it('should get all posts successfully', async () => {
      // Arrange
      const req = {} as Request;
      const res = createMockResponse() as Response;

      const mockPosts = [
        {
          id: '1',
          title: 'Post 1',
          content: 'Content 1',
          createdAt: new Date().toISOString(),
          updatedAt: null
        },
        {
          id: '2',
          title: 'Post 2',
          content: 'Content 2',
          createdAt: new Date().toISOString(),
          updatedAt: null
        }
      ];

      mockGetAllPostsUseCase.execute.mockResolvedValue(mockPosts);

      // Act
      await postsController.getAllPosts(req, res);

      // Assert
      expect(mockApplicationServices.getAllPosts).toHaveBeenCalled();
      expect(mockGetAllPostsUseCase.execute).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockPosts);
    });

    it('should handle use case errors', async () => {
      // Arrange
      const req = {} as Request;
      const res = createMockResponse() as Response;

      mockGetAllPostsUseCase.execute.mockRejectedValue(new Error('Database connection failed'));

      // Act
      await postsController.getAllPosts(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Database connection failed'
        })
      );
    });

    it('should return empty array when no posts exist', async () => {
      // Arrange
      const req = {} as Request;
      const res = createMockResponse() as Response;

      mockGetAllPostsUseCase.execute.mockResolvedValue([]);

      // Act
      await postsController.getAllPosts(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });
  });
});