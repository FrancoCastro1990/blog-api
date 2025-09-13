import { Post } from "@domain/entities/Post";

/**
 * PostRepository port (interface) defines the contract for data persistence.
 * This is part of the domain layer and is framework-agnostic.
 * Concrete implementations will be provided by the infrastructure layer.
 */
export interface PostRepository {
  /**
   * Creates a new post in the repository
   * @param post - The post entity to create
   * @returns Promise resolving to the created post
   */
  create(post: Post): Promise<Post>;

  /**
   * Retrieves all posts from the repository
   * @returns Promise resolving to an array of all posts
   */
  getAll(): Promise<Post[]>;

  /**
   * Finds a post by its unique identifier
   * @param id - The unique identifier of the post
   * @returns Promise resolving to the post if found, null otherwise
   */
  findById(id: string): Promise<Post | null>;

  /**
   * Updates an existing post in the repository
   * @param id - The unique identifier of the post to update
   * @param updateData - Partial post data with fields to update
   * @returns Promise resolving to the updated post if found, null otherwise
   */
  update(id: string, updateData: Partial<Omit<Post, 'id' | 'createdAt'>>): Promise<Post | null>;

  /**
   * Deletes a post from the repository
   * @param id - The unique identifier of the post to delete
   * @returns Promise resolving to true if the post was deleted, false if not found
   */
  delete(id: string): Promise<boolean>;
}