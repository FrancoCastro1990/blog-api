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
    .min(1, "Post ID is required")
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid MongoDB ObjectId format")
});

/**
 * Type inference for post ID validation
 */
export type PostIdInput = z.infer<typeof postIdSchema>;

/**
 * Zod schema for updating an existing post
 * All fields are optional since updates can be partial
 */
export const updatePostSchema = z.object({
  title: z
    .string()
    .min(1, "Title cannot be empty")
    .max(200, "Title must be less than 200 characters")
    .trim()
    .optional(),
  content: z
    .string()
    .min(1, "Content cannot be empty")
    .trim()
    .optional(),
  author: z
    .string()
    .max(100, "Author name must be less than 100 characters")
    .trim()
    .nullable()
    .optional(),
}).refine((data) => {
  // At least one field must be provided
  return Object.keys(data).length > 0 && Object.values(data).some(value => value !== undefined);
}, {
  message: "At least one field must be provided for update"
});

/**
 * Type inference from the update post schema
 */
export type UpdatePostInput = z.infer<typeof updatePostSchema>;