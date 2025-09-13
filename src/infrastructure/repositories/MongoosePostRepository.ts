import { Post } from '@domain/entities/Post';
import { PostRepository } from '@domain/repositories/PostRepository';
import { MongoosePostModel, MongoosePostDocument } from '@infrastructure/database/mongoosePostModel';

/**
 * MongoosePostRepository implements the PostRepository port using Mongoose ODM.
 * This is an adapter that translates domain operations to MongoDB operations.
 */
export class MongoosePostRepository implements PostRepository {
  /**
   * Creates a new post in MongoDB
   * @param post - The post entity to create
   * @returns Promise resolving to the created post
   */
  async create(post: Post): Promise<Post> {
    try {
      // Don't include the id in the data sent to MongoDB, let MongoDB generate the _id
      const { id, ...postData } = post;
      const mongoosePost = new MongoosePostModel(postData);
      const savedPost = await mongoosePost.save();
      return this.mapDocumentToEntity(savedPost);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create post: ${error.message}`);
      }
      throw new Error('Failed to create post: Unknown error');
    }
  }

  /**
   * Retrieves all posts from MongoDB
   * @returns Promise resolving to an array of all posts
   */
  async getAll(): Promise<Post[]> {
    try {
      const posts = await MongoosePostModel.find().sort({ createdAt: -1 }).exec();
      return posts.map(post => this.mapDocumentToEntity(post));
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to retrieve posts: ${error.message}`);
      }
      throw new Error('Failed to retrieve posts: Unknown error');
    }
  }

  /**
   * Finds a post by its unique identifier
   * @param id - The unique identifier of the post
   * @returns Promise resolving to the post if found, null otherwise
   */
  async findById(id: string): Promise<Post | null> {
    try {
      // Use MongoDB's _id field to search since that's what we store
      const post = await MongoosePostModel.findById(id).exec();
      return post ? this.mapDocumentToEntity(post) : null;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to find post by id: ${error.message}`);
      }
      throw new Error('Failed to find post by id: Unknown error');
    }
  }

  /**
   * Updates an existing post in MongoDB
   * @param id - The unique identifier of the post to update
   * @param updateData - Partial post data with fields to update
   * @returns Promise resolving to the updated post if found, null otherwise
   */
  async update(id: string, updateData: Partial<Omit<Post, 'id' | 'createdAt'>>): Promise<Post | null> {
    try {
      // Add updatedAt timestamp to the update data
      const dataWithTimestamp = {
        ...updateData,
        updatedAt: new Date().toISOString(),
      };

      const updatedPost = await MongoosePostModel.findByIdAndUpdate(
        id,
        dataWithTimestamp,
        { new: true, runValidators: true }
      ).exec();

      return updatedPost ? this.mapDocumentToEntity(updatedPost) : null;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to update post: ${error.message}`);
      }
      throw new Error('Failed to update post: Unknown error');
    }
  }

  /**
   * Deletes a post from MongoDB
   * @param id - The unique identifier of the post to delete
   * @returns Promise resolving to true if the post was deleted, false if not found
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await MongoosePostModel.findByIdAndDelete(id).exec();
      return result !== null;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to delete post: ${error.message}`);
      }
      throw new Error('Failed to delete post: Unknown error');
    }
  }

  /**
   * Maps a Mongoose document to a domain entity
   * @param document - The Mongoose document
   * @returns The domain Post entity
   */
  private mapDocumentToEntity(document: MongoosePostDocument): Post {
    return {
      id: (document as any)._id.toString(), // Map MongoDB _id to domain id
      title: document.title,
      content: document.content,
      author: document.author,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };
  }
}