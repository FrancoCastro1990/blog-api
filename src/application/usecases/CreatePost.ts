import { v4 as uuidv4 } from 'uuid';
import { Post, CreatePostData } from '../../domain/entities/Post';
import { PostRepository } from '../../domain/repositories/PostRepository';

/**
 * CreatePost use case handles the business logic for creating new blog posts.
 * This class is part of the application layer and orchestrates domain logic.
 */
export class CreatePost {
  constructor(private readonly postRepository: PostRepository) {}

  /**
   * Executes the create post use case
   * @param postData - The data required to create a new post
   * @returns Promise resolving to the created post
   */
  async execute(postData: CreatePostData): Promise<Post> {
    // Generate unique ID for the post
    const id = uuidv4();
    
    // Create timestamp
    const createdAt = new Date().toISOString();
    
    // Build the complete post entity
    const post: Post = {
      id,
      title: postData.title,
      content: postData.content,
      author: postData.author || null,
      createdAt,
      updatedAt: null,
    };

    // Persist the post using the repository
    return await this.postRepository.create(post);
  }
}