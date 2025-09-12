import { config } from '../src/config';

// Global test setup
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
});

afterAll(async () => {
  // Clean up after all tests
});

beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  jest.resetAllMocks();
});

afterEach(() => {
  // Additional cleanup after each test
  jest.restoreAllMocks();
});

// Global test configuration
jest.setTimeout(30000);