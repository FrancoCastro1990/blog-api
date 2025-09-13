import { Post, UpdatePostData } from '@domain/entities/Post';
import { PostRepository } from '@domain/repositories/PostRepository';

/**
 * UpdatePost use case handles the business logic for updating existing blog posts.
 * This class is part of the application layer and orchestrates domain logic.
 */
export class UpdatePost {
  constructor(private readonly postRepository: PostRepository) {}

  /**
   * Executes the update post use case
   * @param id - The unique identifier of the post to update
   * @param updateData - The data to update in the post
   * @returns Promise resolving to the updated post if found, null if not found
   * @throws Error if the operation fails or validation fails
   */
  async execute(id: string, updateData: UpdatePostData): Promise<Post | null> {
    // Validate that id is provided
    if (!id || typeof id !== 'string' || id.trim() === '') {
      throw new Error('Post ID is required and must be a valid string');
    }

    // Validate that at least one field is being updated
    const fieldsToUpdate = Object.keys(updateData).filter(key => updateData[key as keyof UpdatePostData] !== undefined);
    if (fieldsToUpdate.length === 0) {
      throw new Error('At least one field must be provided for update');
    }

    // Clean the data - remove undefined values and trim strings
    const cleanedData: UpdatePostData = {};
    if (updateData.title !== undefined) {
      cleanedData.title = updateData.title.trim();
      if (cleanedData.title === '') {
        throw new Error('Title cannot be empty');
      }
    }
    if (updateData.content !== undefined) {
      cleanedData.content = updateData.content.trim();
      if (cleanedData.content === '') {
        throw new Error('Content cannot be empty');
      }
    }
    if (updateData.author !== undefined) {
      cleanedData.author = updateData.author === null ? null : updateData.author.trim();
    }

    // Update the post using the repository
    return await this.postRepository.update(id.trim(), cleanedData);
  }
}