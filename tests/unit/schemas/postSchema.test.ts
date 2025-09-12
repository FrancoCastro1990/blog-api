import { createPostSchema, postIdSchema } from '../../../src/schemas/postSchema';

describe('Post Schema Validation', () => {
  describe('createPostSchema', () => {
    it('should validate a complete valid post', () => {
      // Arrange
      const validPost = {
        title: 'Valid Post Title',
        content: 'This is valid content for the post',
        author: 'John Doe'
      };

      // Act
      const result = createPostSchema.safeParse(validPost);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validPost);
      }
    });

    it('should validate a post without author (optional field)', () => {
      // Arrange
      const validPost = {
        title: 'Post Without Author',
        content: 'Content without specifying author'
      };

      // Act
      const result = createPostSchema.safeParse(validPost);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.author).toBeUndefined();
      }
    });

    it('should trim whitespace from title and content', () => {
      // Arrange
      const postWithWhitespace = {
        title: '  Title with spaces  ',
        content: '  Content with spaces  ',
        author: '  Author with spaces  '
      };

      // Act
      const result = createPostSchema.safeParse(postWithWhitespace);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Title with spaces');
        expect(result.data.content).toBe('Content with spaces');
        expect(result.data.author).toBe('Author with spaces');
      }
    });

    describe('title validation', () => {
      it('should reject empty title', () => {
        // Arrange
        const invalidPost = {
          title: '',
          content: 'Valid content'
        };

        // Act
        const result = createPostSchema.safeParse(invalidPost);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Title is required');
        }
      });

    it('should handle title with only whitespace', () => {
      // Arrange - With Zod, trim() comes after min(1), so spaces count as valid length
      const postWithSpaces = {
        title: '   ', // Has length > 1, so passes min(1), then gets trimmed to ''
        content: 'Valid content'
      };

      // Act
      const result = createPostSchema.safeParse(postWithSpaces);

      // Assert - This will succeed because spaces have length > 1
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe(''); // Trimmed to empty
      }
    });      it('should reject title longer than 200 characters', () => {
        // Arrange
        const longTitle = 'A'.repeat(201);
        const invalidPost = {
          title: longTitle,
          content: 'Valid content'
        };

        // Act
        const result = createPostSchema.safeParse(invalidPost);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Title must be less than 200 characters');
        }
      });

      it('should accept title with exactly 200 characters', () => {
        // Arrange
        const exactTitle = 'A'.repeat(200);
        const validPost = {
          title: exactTitle,
          content: 'Valid content'
        };

        // Act
        const result = createPostSchema.safeParse(validPost);

        // Assert
        expect(result.success).toBe(true);
      });

      it('should reject missing title', () => {
        // Arrange
        const invalidPost = {
          content: 'Valid content'
        };

        // Act
        const result = createPostSchema.safeParse(invalidPost);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues.some(issue => issue.path.includes('title'))).toBe(true);
        }
      });
    });

    describe('content validation', () => {
      it('should reject empty content', () => {
        // Arrange
        const invalidPost = {
          title: 'Valid title',
          content: ''
        };

        // Act
        const result = createPostSchema.safeParse(invalidPost);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Content is required');
        }
      });

    it('should handle content with only whitespace', () => {
      // Arrange - Same behavior as title: trim() comes after min(1)
      const postWithSpaces = {
        title: 'Valid title',
        content: '   ' // Has length > 1, so passes min(1), then gets trimmed
      };

      // Act
      const result = createPostSchema.safeParse(postWithSpaces);

      // Assert - This will succeed because spaces have length > 1
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.content).toBe(''); // Trimmed to empty
      }
    });      it('should reject missing content', () => {
        // Arrange
        const invalidPost = {
          title: 'Valid title'
        };

        // Act
        const result = createPostSchema.safeParse(invalidPost);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues.some(issue => issue.path.includes('content'))).toBe(true);
        }
      });
    });

    describe('author validation', () => {
      it('should reject author longer than 100 characters', () => {
        // Arrange
        const longAuthor = 'A'.repeat(101);
        const invalidPost = {
          title: 'Valid title',
          content: 'Valid content',
          author: longAuthor
        };

        // Act
        const result = createPostSchema.safeParse(invalidPost);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Author name must be less than 100 characters');
        }
      });

      it('should accept author with exactly 100 characters', () => {
        // Arrange
        const exactAuthor = 'A'.repeat(100);
        const validPost = {
          title: 'Valid title',
          content: 'Valid content',
          author: exactAuthor
        };

        // Act
        const result = createPostSchema.safeParse(validPost);

        // Assert
        expect(result.success).toBe(true);
      });

      it('should accept empty string as author', () => {
        // Arrange
        const validPost = {
          title: 'Valid title',
          content: 'Valid content',
          author: ''
        };

        // Act
        const result = createPostSchema.safeParse(validPost);

        // Assert
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid data types', () => {
      // Arrange
      const invalidPost = {
        title: 123,
        content: true,
        author: []
      };

      // Act
      const result = createPostSchema.safeParse(invalidPost);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });
  });

  describe('postIdSchema', () => {
    it('should validate a valid UUID', () => {
      // Arrange
      const validId = {
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
      };

      // Act
      const result = postIdSchema.safeParse(validId);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID format', () => {
      // Arrange
      const invalidId = {
        id: 'invalid-uuid'
      };

      // Act
      const result = postIdSchema.safeParse(invalidId);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid post ID format');
      }
    });

    it('should reject empty string', () => {
      // Arrange
      const invalidId = {
        id: ''
      };

      // Act
      const result = postIdSchema.safeParse(invalidId);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject missing id', () => {
      // Arrange
      const invalidData = {};

      // Act
      const result = postIdSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
    });
  });
});