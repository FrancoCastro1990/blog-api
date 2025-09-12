/**
 * Post entity representing the core business model for blog posts.
 * This entity is framework-agnostic and contains only business logic.
 */
export interface Post {
  id: string;            // UUID v4 generated in backend
  title: string;
  content: string;
  author?: string | null;
  createdAt: string;     // ISO date string
  updatedAt?: string | null;
}

/**
 * Data required to create a new post (without generated fields)
 */
export interface CreatePostData {
  title: string;
  content: string;
  author?: string;
}