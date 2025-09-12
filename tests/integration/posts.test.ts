import request from 'supertest';
import { Express } from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createExpressApp } from '../../src/infrastructure/web/expressApp';
import { ApplicationServices } from '../../src/application/services';
import { MongoosePostRepository } from '../../src/infrastructure/repositories/MongoosePostRepository';

describe('Posts API Integration Tests', () => {
  let app: Express;
  let mongoServer: MongoMemoryServer;
  let applicationServices: ApplicationServices;

  beforeAll(async () => {
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Connect to test database
    await mongoose.connect(mongoUri);

    // Create application services
    const postRepository = new MongoosePostRepository();
    applicationServices = new ApplicationServices(postRepository);

    // Create Express app
    app = createExpressApp(applicationServices);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clean database before each test
    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }
  });

  describe('POST /api/posts', () => {
    it('should create a new post with all fields', async () => {
      // Arrange
      const newPost = {
        title: 'Integration Test Post',
        content: 'This is a test post created during integration testing',
        author: 'Test Author'
      };

      // Act
      const response = await request(app)
        .post('/api/posts')
        .send(newPost)
        .expect(201);

      // Assert
      expect(response.body).toMatchObject({
        title: newPost.title,
        content: newPost.content,
        author: newPost.author,
        updatedAt: null
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
      expect(typeof response.body.id).toBe('string');
      expect(response.body.id).toHaveLength(24); // MongoDB ObjectId length
    });

    it('should create a post without author', async () => {
      // Arrange
      const newPost = {
        title: 'Post Without Author',
        content: 'This post has no author specified'
      };

      // Act
      const response = await request(app)
        .post('/api/posts')
        .send(newPost)
        .expect(201);

      // Assert
      expect(response.body).toMatchObject({
        title: newPost.title,
        content: newPost.content,
        author: null,
        updatedAt: null
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
    });

    it('should return 400 for invalid data', async () => {
      // Arrange
      const invalidPost = {
        title: '', // Empty title should fail validation
        content: 'Valid content'
      };

      // Act
      const response = await request(app)
        .post('/api/posts')
        .send(invalidPost)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('details');
      expect(response.body.error).toBe('Validation failed');
      expect(Array.isArray(response.body.details)).toBe(true);
    });

    it('should return 400 for missing required fields', async () => {
      // Arrange
      const invalidPost = {
        title: 'Valid title'
        // Missing content
      };

      // Act
      const response = await request(app)
        .post('/api/posts')
        .send(invalidPost)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 for title too long', async () => {
      // Arrange
      const invalidPost = {
        title: 'A'.repeat(201), // Exceeds 200 character limit
        content: 'Valid content'
      };

      // Act
      const response = await request(app)
        .post('/api/posts')
        .send(invalidPost)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Validation failed');
    });

    it('should return 400 for author name too long', async () => {
      // Arrange
      const invalidPost = {
        title: 'Valid title',
        content: 'Valid content',
        author: 'A'.repeat(101) // Exceeds 100 character limit
      };

      // Act
      const response = await request(app)
        .post('/api/posts')
        .send(invalidPost)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle malformed JSON', async () => {
      // Act
      const response = await request(app)
        .post('/api/posts')
        .set('Content-Type', 'application/json')
        .send('{"title": "test", invalid json}')
        .expect(500); // Express returns 500 for JSON parse errors

      // Assert
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/posts', () => {
    it('should return empty array when no posts exist', async () => {
      // Act
      const response = await request(app)
        .get('/api/posts')
        .expect(200);

      // Assert
      expect(response.body).toEqual([]);
    });

    it('should return all posts', async () => {
      // Arrange - Create test posts
      const post1 = {
        title: 'First Post',
        content: 'Content of first post',
        author: 'Author 1'
      };
      const post2 = {
        title: 'Second Post',
        content: 'Content of second post',
        author: 'Author 2'
      };

      await request(app).post('/api/posts').send(post1);
      await request(app).post('/api/posts').send(post2);

      // Act
      const response = await request(app)
        .get('/api/posts')
        .expect(200);

      // Assert
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      
      // Should contain both posts
      const titles = response.body.map((post: any) => post.title);
      expect(titles).toContain('First Post');
      expect(titles).toContain('Second Post');
      
      // Each post should have required fields
      response.body.forEach((post: any) => {
        expect(post).toHaveProperty('id');
        expect(post).toHaveProperty('title');
        expect(post).toHaveProperty('content');
        expect(post).toHaveProperty('author');
        expect(post).toHaveProperty('createdAt');
        expect(post).toHaveProperty('updatedAt');
      });
    });

    it('should return posts sorted by creation date (newest first)', async () => {
      // Arrange - Create posts with different timestamps
      const firstPost = {
        title: 'First Post',
        content: 'First content'
      };
      const secondPost = {
        title: 'Second Post',
        content: 'Second content'
      };

      const response1 = await request(app).post('/api/posts').send(firstPost);
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      const response2 = await request(app).post('/api/posts').send(secondPost);

      // Act
      const response = await request(app)
        .get('/api/posts')
        .expect(200);

      // Assert
      expect(response.body).toHaveLength(2);
      // Newer post should be first (descending order)
      expect(response.body[0].createdAt >= response.body[1].createdAt).toBe(true);
    });

    it('should handle database connection errors gracefully', async () => {
      // This is harder to test with MongoMemoryServer, but we can test the error handling path
      // by disconnecting from the database temporarily
      await mongoose.disconnect();

      // Act
      const response = await request(app)
        .get('/api/posts')
        .expect(500);

      // Assert
      expect(response.body).toHaveProperty('error');

      // Reconnect for cleanup
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);
    });
  });

  describe('API Error Handling', () => {
    it('should return 404 for unknown endpoints', async () => {
      // Act
      const response = await request(app)
        .get('/api/unknown')
        .expect(404);

      // Assert
      expect(response.body).toHaveProperty('error');
    });

    it('should handle unsupported HTTP methods', async () => {
      // Act
      const response = await request(app)
        .delete('/api/posts')
        .expect(404); // Express returns 404 for unsupported methods on existing routes

      // Could also be 405 Method Not Allowed depending on implementation
    });

    it('should return proper content type for JSON responses', async () => {
      // Act
      const response = await request(app)
        .get('/api/posts')
        .expect(200);

      // Assert
      expect(response.headers['content-type']).toMatch(/application\/json/);
    });
  });

  describe('Request/Response Integration', () => {
    it('should handle concurrent requests properly', async () => {
      // Arrange
      const posts = [
        { title: 'Post 1', content: 'Content 1' },
        { title: 'Post 2', content: 'Content 2' },
        { title: 'Post 3', content: 'Content 3' }
      ];

      // Act - Send concurrent requests
      const promises = posts.map(post => 
        request(app).post('/api/posts').send(post)
      );
      const responses = await Promise.all(promises);

      // Assert - All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
      });

      // Verify all posts were created
      const getAllResponse = await request(app).get('/api/posts');
      expect(getAllResponse.body).toHaveLength(3);
    });

    it('should maintain data integrity across operations', async () => {
      // Arrange & Act - Create a post
      const newPost = {
        title: 'Data Integrity Test',
        content: 'Testing data consistency',
        author: 'Test Author'
      };

      const createResponse = await request(app)
        .post('/api/posts')
        .send(newPost);

      // Get all posts
      const getAllResponse = await request(app)
        .get('/api/posts');

      // Assert - Data should be consistent
      expect(createResponse.body.id).toBeDefined();
      expect(getAllResponse.body).toHaveLength(1);
      expect(getAllResponse.body[0]).toEqual(createResponse.body);
    });
  });
});