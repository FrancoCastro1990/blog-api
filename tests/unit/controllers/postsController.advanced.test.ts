import request from 'supertest';
import { createExpressApp } from '../../../src/infrastructure/web/expressApp';
import { ApplicationServices } from '../../../src/application/services';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { mongooseConnection } from '../../../src/infrastructure/database/mongooseConnection';
import { MongoosePostRepository } from '../../../src/infrastructure/repositories/MongoosePostRepository';

let mongoServer: MongoMemoryServer;
let app: any;

beforeAll(async () => {
  // Setup MongoDB Memory Server
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connect directly with mongoose for tests
  await mongoose.connect(mongoUri);
  
  // Create application services
  const postRepository = new MongoosePostRepository();
  const applicationServices = new ApplicationServices(postRepository);
  
  // Create Express app
  app = createExpressApp(applicationServices);
});

afterAll(async () => {
  // Cleanup
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

afterEach(async () => {
  // Clean collections after each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe('PostsController - Advanced Error Scenarios', () => {
  describe('POST /api/posts - Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      // Act & Assert
      const response = await request(app)
        .post('/api/posts')
        .set('Content-Type', 'application/json')
        .send('{"title": "Test", "content": "Test content"'); // Malformed JSON

      expect(response.status).toBe(500); // Express error handler catches JSON parse errors
    });

    it('should handle extremely long titles', async () => {
      // Arrange
      const longTitle = 'a'.repeat(10000);

      // Act
      const response = await request(app)
        .post('/api/posts')
        .send({
          title: longTitle,
          content: 'Test content'
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle extremely long content', async () => {
      // Arrange
      const longContent = 'a'.repeat(50000);

      // Act
      const response = await request(app)
        .post('/api/posts')
        .send({
          title: 'Test title',
          content: longContent
        });

      // Assert - No validation limit on content, so it should succeed
      expect(response.status).toBe(201);
    });

    it('should handle special characters in title and content', async () => {
      // Arrange
      const specialCharsData = {
        title: '🚀 Test Title with Émojis & Special Chârs',
        content: 'Content with special characters: áéíóú ñ ç ü @#$%^&*()[]{}|\\:";\'<>?,./'
      };

      // Act
      const response = await request(app)
        .post('/api/posts')
        .send(specialCharsData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.title).toBe(specialCharsData.title);
      expect(response.body.content).toBe(specialCharsData.content);
    });

    it('should handle numeric values as strings', async () => {
      // Act
      const response = await request(app)
        .post('/api/posts')
        .send({
          title: 123456,
          content: 789.123
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should handle null values explicitly', async () => {
      // Act
      const response = await request(app)
        .post('/api/posts')
        .send({
          title: null,
          content: null
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should handle undefined values in request', async () => {
      // Act
      const response = await request(app)
        .post('/api/posts')
        .send({
          title: undefined,
          content: 'Valid content'
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should handle array values instead of strings', async () => {
      // Act
      const response = await request(app)
        .post('/api/posts')
        .send({
          title: ['not', 'a', 'string'],
          content: ['also', 'not', 'a', 'string']
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should handle boolean values instead of strings', async () => {
      // Act
      const response = await request(app)
        .post('/api/posts')
        .send({
          title: true,
          content: false
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/posts - Error Handling', () => {
    it('should handle requests with invalid query parameters', async () => {
      // Act
      const response = await request(app)
        .get('/api/posts')
        .query({ 
          limit: 'not-a-number',
          offset: 'also-not-a-number' 
        });

      // Assert
      expect(response.status).toBe(200); // Should ignore invalid query params
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should handle requests with SQL injection attempts in query', async () => {
      // Act
      const response = await request(app)
        .get('/api/posts')
        .query({ 
          search: "'; DROP TABLE posts; --",
          filter: "1=1 OR 1=1"
        });

      // Assert
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should handle extremely large query parameter values', async () => {
      // Arrange
      const largeQueryValue = 'x'.repeat(10000);

      // Act
      const response = await request(app)
        .get('/api/posts')
        .query({ someParam: largeQueryValue });

      // Assert
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should handle requests with special characters in query parameters', async () => {
      // Act
      const response = await request(app)
        .get('/api/posts')
        .query({ 
          search: '🔍 special chars: áéíóú & @#$%^&*()',
          category: 'test/category-with-slashes'
        });

      // Assert
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Request Headers and Content-Type Handling', () => {
    it('should handle requests with missing Content-Type header', async () => {
      // Act
      const response = await request(app)
        .post('/api/posts')
        .send('title=Test&content=Test content'); // Form data format

      // Assert - Express interprets this as valid form data and creates the post
      expect(response.status).toBe(201);
    });

    it('should handle requests with incorrect Content-Type', async () => {
      // Act
      const response = await request(app)
        .post('/api/posts')
        .set('Content-Type', 'text/plain')
        .send('This is plain text, not JSON');

      // Assert
      expect([400, 415]).toContain(response.status);
    });

    it('should handle requests with custom headers', async () => {
      // Act
      const response = await request(app)
        .post('/api/posts')
        .set('X-Custom-Header', 'custom-value')
        .set('Authorization', 'Bearer fake-token')
        .send({
          title: 'Test title',
          content: 'Test content'
        });

      // Assert - Should process normally (headers don't affect validation)
      expect(response.status).toBe(201);
    });
  });

  describe('HTTP Method Edge Cases', () => {
    it('should handle PATCH requests to POST endpoint', async () => {
      // Act
      const response = await request(app)
        .patch('/api/posts')
        .send({
          title: 'Test title',
          content: 'Test content'
        });

      // Assert
      expect(response.status).toBe(404); // Method not allowed
    });

    it('should handle PUT requests to POST endpoint', async () => {
      // Act
      const response = await request(app)
        .put('/api/posts')
        .send({
          title: 'Test title',
          content: 'Test content'
        });

      // Assert
      expect(response.status).toBe(404); // Method not allowed
    });

    it('should handle DELETE requests to GET endpoint', async () => {
      // Act
      const response = await request(app)
        .delete('/api/posts');

      // Assert
      expect(response.status).toBe(404); // Method not allowed
    });
  });
});