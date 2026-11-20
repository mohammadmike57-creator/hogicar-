import { defineConfig } from 'vitest/config';

// Website tests: plain logic in a browser-like environment (jsdom). Run with "npm test".
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
    restoreMocks: true,
  },
});
