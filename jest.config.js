module.exports = {
  // Use ts-jest for TypeScript support
  preset: 'ts-jest',
  
  // Testing environment
  testEnvironment: 'node',
  
  // Root directory
  rootDir: '.',
  
  // Source directory
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  
  // Test match patterns
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/tests/**/*.spec.ts',
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.spec.ts'
  ],
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Transform files
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts', // Exclude server startup file
    '!src/app.ts',    // Exclude app configuration file
    '!src/**/index.ts' // Exclude barrel files
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  coverageThreshold: {
    global: {
      branches: 56,
      functions: 74,
      lines: 72,
      statements: 72
    }
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  // Clear mocks
  clearMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Test timeout
  testTimeout: 30000,
  
  // Run tests in sequence to avoid interference
  maxWorkers: 1,
  
  // Force exit
  forceExit: true
};