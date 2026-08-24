import '@testing-library/jest-dom/vitest';

// Every test suite runs in mock mode. This is not a convenience — it is the
// contract that lets a contributor run `npm test` with no API key and no bill.
process.env.AI_MODE ??= 'mock';
process.env.DB_MODE ??= 'memory';
process.env.AUTH_MODE ??= 'dev';
process.env.SESSION_SECRET ??= 'test-session-secret-value-not-used-in-production';
