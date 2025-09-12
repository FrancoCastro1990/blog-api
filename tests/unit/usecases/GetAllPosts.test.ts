import { GetAllPosts } from '../../../src/application/usecases/GetAllPosts';
import { PostRepository } from '../../../src/domain/repositories/PostRepository';
import { Post } from '../../../src/domain/entities/Post';

// Mock del repositorio
const mockPostRepository: jest.Mocked<PostRepository> = {
  create: jest.fn(),
  getAll: jest.fn(),
  findById: jest.fn(),
};

describe('GetAllPosts Use Case', () => {
  let getAllPosts: GetAllPosts;
  
  beforeEach(() => {
    getAllPosts = new GetAllPosts(mockPostRepository);
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return all posts', async () => {
      // Arrange
      const mockPosts: Post[] = [
        {
          id: '1',
          title: 'First Post',
          content: 'Content of first post',
          author: 'Author 1',
          createdAt: '2025-09-12T10:00:00.000Z',
          updatedAt: null
        },
        {
          id: '2',
          title: 'Second Post',
          content: 'Content of second post',
          author: 'Author 2',
          createdAt: '2025-09-12T09:00:00.000Z',
          updatedAt: null
        }
      ];

      mockPostRepository.getAll.mockResolvedValue(mockPosts);

      // Act
      const result = await getAllPosts.execute();

      // Assert
      expect(mockPostRepository.getAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockPosts);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no posts exist', async () => {
      // Arrange
      mockPostRepository.getAll.mockResolvedValue([]);

      // Act
      const result = await getAllPosts.execute();

      // Assert
      expect(mockPostRepository.getAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle repository errors', async () => {
      // Arrange
      const repositoryError = new Error('Database connection failed');
      mockPostRepository.getAll.mockRejectedValue(repositoryError);

      // Act & Assert
      await expect(getAllPosts.execute()).rejects.toThrow('Database connection failed');
      expect(mockPostRepository.getAll).toHaveBeenCalledTimes(1);
    });

    it('should maintain order of posts as returned by repository', async () => {
      // Arrange
      const mockPosts: Post[] = [
        {
          id: '3',
          title: 'Latest Post',
          content: 'Latest content',
          author: 'Author',
          createdAt: '2025-09-12T12:00:00.000Z',
          updatedAt: null
        },
        {
          id: '1',
          title: 'Oldest Post',
          content: 'Oldest content',
          author: 'Author',
          createdAt: '2025-09-12T08:00:00.000Z',
          updatedAt: null
        }
      ];

      mockPostRepository.getAll.mockResolvedValue(mockPosts);

      // Act
      const result = await getAllPosts.execute();

      // Assert
      expect(result[0]).toEqual(mockPosts[0]);
      expect(result[1]).toEqual(mockPosts[1]);
      expect(result[0].id).toBe('3');
      expect(result[1].id).toBe('1');
    });
  });
});