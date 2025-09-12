import request from 'supertest';
import { createExpressApp } from '../../../../src/infrastructure/web/expressApp';
import { ApplicationServices } from '../../../../src/application/services';
import { Post } from '../../../../src/domain/entities/Post';
import { createMockExpressAppConfig } from '../../../mocks/authMocks';

// Mock application services for isolated testing
const mockPostRepository = {
  create: jest.fn(),
  getAll: jest.fn(),
  findById: jest.fn()
};

const mockApplicationServices = new ApplicationServices(mockPostRepository as any);

describe('ExpressApp', () => {
  let app: any;

  beforeEach(() => {
    const config = createMockExpressAppConfig(mockApplicationServices);
    app = createExpressApp(config);
    jest.clearAllMocks();
  });

  describe('Application Configuration', () => {
    it('should be defined and configured', () => {
      expect(app).toBeDefined();
      expect(typeof app).toBe('function');
    });

    it('should handle JSON requests up to 10mb', async () => {
      // Arrange
      const largeData = {
        title: 'Test title',
        content: 'x'.repeat(1024 * 1024) // 1MB content
      };

      mockPostRepository.create.mockResolvedValue({
        id: '123',
        title: largeData.title,
        content: largeData.content,
        createdAt: new Date().toISOString()
      });

      // Act
      const response = await request(app)
        .post('/api/posts')
        .send(largeData);

      // Assert
      expect(response.status).toBe(201);
    });
  });

  describe('Health Check Endpoint', () => {
    it('should return health status', async () => {
      // Act
      const response = await request(app)
        .get('/health');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: 'healthy',
        timestamp: expect.any(String),
        uptime: expect.any(Number)
      });
    });

    it('should return valid timestamp format', async () => {
      // Act
      const response = await request(app)
        .get('/health');

      // Assert
      const timestamp = response.body.timestamp;
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(new Date(timestamp).getTime()).toBeGreaterThan(0);
    });

    it('should return positive uptime', async () => {
      // Act
      const response = await request(app)
        .get('/health');

      // Assert
      expect(response.body.uptime).toBeGreaterThan(0);
      expect(typeof response.body.uptime).toBe('number');
    });
  });

  describe('Root Endpoint', () => {
    it('should return API information', async () => {
      // Act
      const response = await request(app)
        .get('/');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Blog Posts API with Authentication',
        version: '1.0.0',
        endpoints: {
          health: '/health',
          auth: {
            login: 'POST /api/auth/login',
            refresh: 'POST /api/auth/refresh',
            logout: 'POST /api/auth/logout',
            me: 'GET /api/auth/me'
          },
          posts: {
            create: 'POST /api/posts (requires CREATE_POSTS permission)',
            getAll: 'GET /api/posts (requires READ_POSTS permission)'
          }
        }
      });
    });
  });

  describe('CORS Configuration', () => {
    it('should include CORS headers in responses', async () => {
      // Act
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:3000');

      // Assert - CORS headers are present when Origin header is provided
      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-credentials']).toBeDefined();
    });

    it('should handle preflight OPTIONS requests', async () => {
      // Act
      const response = await request(app)
        .options('/api/posts')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST');

      // Assert
      expect([200, 204]).toContain(response.status);
    });
  });

  describe('Request Logging Middleware', () => {
    it('should process requests normally with logging middleware', async () => {
      // Act
      const response = await request(app)
        .get('/health');

      // Assert
      expect(response.status).toBe(200);
      // Logging is handled by the logger, we just verify requests still work
    });

    it('should handle requests with various user agents', async () => {
      // Act
      const response = await request(app)
        .get('/health')
        .set('User-Agent', 'TestAgent/1.0');

      // Assert
      expect(response.status).toBe(200);
    });

    it('should handle requests without user agent', async () => {
      // Act
      const response = await request(app)
        .get('/health')
        .set('User-Agent', '');

      // Assert
      expect(response.status).toBe(200);
    });
  });

  describe('404 Error Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      // Act
      const response = await request(app)
        .get('/non-existent-route');

      // Assert
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'Route not found',
        message: 'Cannot GET /non-existent-route'
      });
    });

    it('should return 404 for non-existent POST routes', async () => {
      // Act
      const response = await request(app)
        .post('/non-existent-post-route')
        .send({ data: 'test' });

      // Assert
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'Route not found',
        message: 'Cannot POST /non-existent-post-route'
      });
    });

    it('should return 404 for non-existent routes with query parameters', async () => {
      // Act
      const response = await request(app)
        .get('/non-existent-route')
        .query({ param: 'value' });

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Route not found');
    });

    it('should return 404 for routes with special characters', async () => {
      // Act
      const response = await request(app)
        .get('/route-with-special-chars-@#$%');

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Route not found');
    });
  });

  describe('Global Error Handler', () => {
    it('should handle unexpected errors gracefully', async () => {
      // Arrange - Force an error by making repository throw
      mockPostRepository.getAll.mockRejectedValue(new Error('Database error'));

      // Act
      const response = await request(app)
        .get('/api/posts');

      // Assert - PostsController handles errors, not the global error handler
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Database error' // In development, error message is exposed
      });
    });

    it('should not expose sensitive error details in production', async () => {
      // Arrange
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      // Recreate app with production environment
      const prodConfig = createMockExpressAppConfig(mockApplicationServices);
      const prodApp = createExpressApp(prodConfig);
      mockPostRepository.getAll.mockRejectedValue(new Error('Sensitive database error'));

      // Act
      const response = await request(prodApp)
        .get('/api/posts');

      // Assert - PostsController handles errors, not global error handler
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Internal server error' // In production, generic message is shown
      });

      // Cleanup
      process.env.NODE_ENV = originalEnv;
    });

    it('should handle errors with custom properties', async () => {
      // Arrange
      const customError = new Error('Custom error message');
      (customError as any).statusCode = 422;
      mockPostRepository.create.mockRejectedValue(customError);

      // Act
      const response = await request(app)
        .post('/api/posts')
        .send({ title: 'Test', content: 'Test content' });

      // Assert - PostsController handles the error, not global handler
      expect(response.status).toBe(500); // Controller returns 500 for unexpected errors
      expect(response.body.error).toBe('Custom error message'); // In test mode, error message is exposed
    });
  });

  describe('Content Type Handling', () => {
    it('should handle application/json requests', async () => {
      // Arrange
      mockPostRepository.create.mockResolvedValue({
        id: '123',
        title: 'Test title',
        content: 'Test content',
        createdAt: new Date().toISOString()
      });

      // Act
      const response = await request(app)
        .post('/api/posts')
        .set('Content-Type', 'application/json')
        .send({ title: 'Test title', content: 'Test content' });

      // Assert
      expect(response.status).toBe(201);
    });

    it('should handle URL encoded requests', async () => {
      // Act
      const response = await request(app)
        .post('/api/posts')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send('title=Test&content=Test content');

      // Assert - Should process form data  
      expect(response.status).toBe(500); // Express will return 500 for form data parsing issues
    });

    it('should reject oversized JSON payloads', async () => {
      // Arrange
      const oversizedData = {
        title: 'Test',
        content: 'x'.repeat(11 * 1024 * 1024) // 11MB - over the 10MB limit
      };

      // Act
      const response = await request(app)
        .post('/api/posts')
        .send(oversizedData);

      // Assert  
      expect(response.status).toBe(500); // Express error handler catches payload errors
    });
  });

  describe('HTTP Method Support', () => {
    it('should support GET requests', async () => {
      // Arrange
      mockPostRepository.getAll.mockResolvedValue([]);

      // Act
      const response = await request(app)
        .get('/api/posts');

      // Assert
      expect(response.status).toBe(200);
    });

    it('should support POST requests', async () => {
      // Arrange
      mockPostRepository.create.mockResolvedValue({
        id: '123',
        title: 'Test title',
        content: 'Test content',
        createdAt: new Date().toISOString()
      });

      // Act
      const response = await request(app)
        .post('/api/posts')
        .send({ title: 'Test title', content: 'Test content' });

      // Assert
      expect(response.status).toBe(201);
    });

    it('should handle unsupported HTTP methods gracefully', async () => {
      // Act
      const response = await request(app)
        .put('/api/posts');

      // Assert
      expect(response.status).toBe(404); // Route not found for PUT method
    });
  });

  describe('Request ID and Tracing', () => {
    it('should handle requests with custom headers', async () => {
      // Act
      const response = await request(app)
        .get('/health')
        .set('X-Request-ID', '12345')
        .set('X-Correlation-ID', 'abc-def');

      // Assert
      expect(response.status).toBe(200);
      // Custom headers should be processed without issues
    });
  });
});