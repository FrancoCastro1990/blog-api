import { Post } from '../../domain/entities/Post';
import { PostRepository } from '../../domain/repositories/PostRepository';

/**
 * GetAllPosts use case handles the business logic for retrieving all blog posts.
 * This class is part of the application layer and orchestrates domain logic.
 */
export class GetAllPosts {
  constructor(private readonly postRepository: PostRepository) {}

  /**
   * Executes the get all posts use case
   * @returns Promise resolving to an array of all posts
   */
  async execute(): Promise<Post[]> {
    // Retrieve all posts from the repository
    const posts = await this.postRepository.getAll();
    
    // Sort posts by creation date (newest first)
    return posts.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
}