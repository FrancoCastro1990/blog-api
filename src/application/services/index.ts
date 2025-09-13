import { PostRepository } from '@domain/repositories/PostRepository';
import { CreatePost } from '@application/usecases/CreatePost';
import { GetAllPosts } from '@application/usecases/GetAllPosts';
import { GetPostById } from '@application/usecases/GetPostById';
import { UpdatePost } from '@application/usecases/UpdatePost';
import { DeletePost } from '@application/usecases/DeletePost';

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

  /**
   * Creates and returns the GetPostById use case
   */
  getPostById(): GetPostById {
    return new GetPostById(this.postRepository);
  }

  /**
   * Creates and returns the UpdatePost use case
   */
  updatePost(): UpdatePost {
    return new UpdatePost(this.postRepository);
  }

  /**
   * Creates and returns the DeletePost use case
   */
  deletePost(): DeletePost {
    return new DeletePost(this.postRepository);
  }
}

/**
 * Factory function to create application services
 */
export const createApplicationServices = (postRepository: PostRepository): ApplicationServices => {
  return new ApplicationServices(postRepository);
};