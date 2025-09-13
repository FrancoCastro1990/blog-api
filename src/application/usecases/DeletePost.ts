import { PostRepository } from '@domain/repositories/PostRepository';

/**
 * DeletePost use case handles the business logic for deleting blog posts.
 * This class is part of the application layer and orchestrates domain logic.
 */
export class DeletePost {
  constructor(private readonly postRepository: PostRepository) {}

  /**
   * Executes the delete post use case
   * @param id - The unique identifier of the post to delete
   * @returns Promise resolving to true if the post was deleted, false if not found
   * @throws Error if the operation fails or validation fails
   */
  async execute(id: string): Promise<boolean> {
    // Validate that id is provided
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new Error('Post ID is required and must be a valid string');
    }

    // Delete the post using the repository
    return await this.postRepository.delete(id.trim());
  }
}