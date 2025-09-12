import { CreatePost } from '../../../src/application/usecases/CreatePost';
import { PostRepository } from '../../../src/domain/repositories/PostRepository';
import { Post, CreatePostData } from '../../../src/domain/entities/Post';

// Mock del repositorio
const mockPostRepository: jest.Mocked<PostRepository> = {
  create: jest.fn(),
  getAll: jest.fn(),
  findById: jest.fn(),
};

describe('CreatePost Use Case', () => {
  let createPost: CreatePost;
  
  beforeEach(() => {
    createPost = new CreatePost(mockPostRepository);
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should create a post with all fields', async () => {
      // Arrange
      const postData: CreatePostData = {
        title: 'Test Post',
        content: 'This is a test post content',
        author: 'Test Author'
      };

      const expectedPost: Post = {
        id: 'generated-id',
        title: postData.title,
        content: postData.content,
        author: postData.author,
        createdAt: '2025-09-12T10:00:00.000Z',
        updatedAt: null
      };

      mockPostRepository.create.mockResolvedValue(expectedPost);

      // Act
      const result = await createPost.execute(postData);

      // Assert
      expect(mockPostRepository.create).toHaveBeenCalledTimes(1);
      expect(mockPostRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '', // This will be overwritten by MongoDB
          title: postData.title,
          content: postData.content,
          author: postData.author,
          createdAt: expect.any(String),
          updatedAt: null
        })
      );
      expect(result).toEqual(expectedPost);
    });

    it('should create a post without author (optional field)', async () => {
      // Arrange
      const postData: CreatePostData = {
        title: 'Test Post Without Author',
        content: 'This is a test post without author'
      };

      const expectedPost: Post = {
        id: 'generated-id',
        title: postData.title,
        content: postData.content,
        author: null,
        createdAt: '2025-09-12T10:00:00.000Z',
        updatedAt: null
      };

      mockPostRepository.create.mockResolvedValue(expectedPost);

      // Act
      const result = await createPost.execute(postData);

      // Assert
      expect(mockPostRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          author: null
        })
      );
      expect(result.author).toBeNull();
    });

    it('should generate a timestamp for createdAt', async () => {
      // Arrange
      const postData: CreatePostData = {
        title: 'Test Post',
        content: 'Test content'
      };

      const expectedPost: Post = {
        id: 'generated-id',
        title: postData.title,
        content: postData.content,
        author: null,
        createdAt: '2025-09-12T10:00:00.000Z',
        updatedAt: null
      };

      mockPostRepository.create.mockResolvedValue(expectedPost);

      // Act
      const result = await createPost.execute(postData);

      // Assert
      const createdAtCall = mockPostRepository.create.mock.calls[0][0];
      expect(createdAtCall.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(new Date(createdAtCall.createdAt)).toBeInstanceOf(Date);
    });

    it('should handle repository errors', async () => {
      // Arrange
      const postData: CreatePostData = {
        title: 'Test Post',
        content: 'Test content'
      };

      const repositoryError = new Error('Database connection failed');
      mockPostRepository.create.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(createPost.execute(postData)).rejects.toThrow('Database connection failed');
      expect(mockPostRepository.create).toHaveBeenCalledTimes(1);
    });

    it('should set updatedAt to null for new posts', async () => {
      // Arrange
      const postData: CreatePostData = {
        title: 'New Post',
        content: 'New content'
      };

      const expectedPost: Post = {
        id: 'generated-id',
        title: postData.title,
        content: postData.content,
        author: null,
        createdAt: '2025-09-12T10:00:00.000Z',
        updatedAt: null
      };

      mockPostRepository.create.mockResolvedValue(expectedPost);

      // Act
      const result = await createPost.execute(postData);

      // Assert
      const createdPostCall = mockPostRepository.create.mock.calls[0][0];
      expect(createdPostCall.updatedAt).toBeNull();
      expect(result.updatedAt).toBeNull();
    });
  });
});