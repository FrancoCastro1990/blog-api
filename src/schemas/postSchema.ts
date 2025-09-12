import { z } from "zod";

/**
 * Zod schema for creating a new post
 * Validates the input data before processing
 */
export const createPostSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters")
    .trim(),
  content: z
    .string()
    .min(1, "Content is required")
    .trim(),
  author: z
    .string()
    .max(100, "Author name must be less than 100 characters")
    .trim()
    .optional(),
});

/**
 * Type inference from the Zod schema
 */
export type CreatePostInput = z.infer<typeof createPostSchema>;

/**
 * Schema for validating post ID parameters
 */
export const postIdSchema = z.object({
  id: z
    .string()
    .uuid("Invalid post ID format")
});

/**
 * Type inference for post ID validation
 */
export type PostIdInput = z.infer<typeof postIdSchema>;