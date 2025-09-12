import request from 'supertest';
import { createExpressApp } from '../src/infrastructure/web/expressApp';
import { ApplicationServices } from '../src/application/services';
import { createMockExpressAppConfig } from './mocks/authMocks';

// Mock repository simple - sin MongoDB
const mockPostRepository = {
  create: jest.fn().mockResolvedValue({
    id: '123',
    title: 'Test',
    content: 'Test content',
    createdAt: new Date().toISOString()
  }),
  getAll: jest.fn().mockResolvedValue([]),
  findById: jest.fn()
};

describe('Simple Test Debug', () => {
  let app: any;

  beforeAll(() => {
    const applicationServices = new ApplicationServices(mockPostRepository as any);
    const config = createMockExpressAppConfig(applicationServices);
    app = createExpressApp(config);
  });

  it('should respond to health check', async () => {
    console.log('Starting health test...');
    const response = await request(app).get('/health');
    console.log('Health response:', response.status);
    expect(response.status).toBe(200);
  });

  it('should respond to root endpoint', async () => {
    console.log('Starting root test...');  
    const response = await request(app).get('/');
    console.log('Root response:', response.status);
    expect(response.status).toBe(200);
  });
});