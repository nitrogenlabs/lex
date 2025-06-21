/**
 * Jest setup file
 * This file is processed by Jest, not TypeScript
 */
jest.mock('url', () => ({
  URL: jest.fn(() => ({ pathname: './' }))
}));
