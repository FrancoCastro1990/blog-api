import { PostRepository } from '../../domain/repositories/PostRepository';
import { CreatePost } from '../usecases/CreatePost';
import { GetAllPosts } from '../usecases/GetAllPosts';

/**
 * Application services factory
 * Provides centralized creation of use cases with their dependencies
 */
export class ApplicationServices {
  constructor(private readonly postRepository: PostRepository) {}

  /**
   * Creates and returns the CreatePost use case
   */
  createPost(): CreatePost {
    return new CreatePost(this.postRepository);
  }

  /**
   * Creates and returns the GetAllPosts use case
   */
  getAllPosts(): GetAllPosts {
    return new GetAllPosts(this.postRepository);
  }
}

/**
 * Factory function to create application services
 */
export const createApplicationServices = (postRepository: PostRepository): ApplicationServices => {
  return new ApplicationServices(postRepository);
};