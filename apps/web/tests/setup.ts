/**
 * Test setup file
 * Runs before all tests
 */

// Set test environment variables
// Use type assertion to bypass readonly check in test environment
(process.env as any).NODE_ENV = "test";
process.env.QR_SECRET = "test-secret-key-for-qr-code-signing-validation-min-32-chars";
process.env.NEXTAUTH_SECRET = "test-nextauth-secret-key-minimum-32-characters-long";
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || "postgresql://test:test@localhost:5432/test";

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

