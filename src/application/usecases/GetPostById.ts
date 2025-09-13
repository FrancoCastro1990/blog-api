import { Post } from '@domain/entities/Post';
import { PostRepository } from '@domain/repositories/PostRepository';

/**
 * GetPostById use case handles the business logic for retrieving a specific blog post by ID.
 * This class is part of the application layer and orchestrates domain logic.
 */
export class GetPostById {
  constructor(private readonly postRepository: PostRepository) {}

  /**
   * Executes the get post by id use case
   * @param id - The unique identifier of the post to retrieve
   * @returns Promise resolving to the post if found, null otherwise
   * @throws Error if the operation fails
   */
  async execute(id: string): Promise<Post | null> {
    // Validate that id is provided
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new Error('Post ID is required and must be a valid string');
    }

    // Retrieve the post from the repository
    return await this.postRepository.findById(id.trim());
  }
}