import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      // server.js only calls app.listen() and instrument.js only initialises Sentry; frontend/ is browser code; dist/ is build output.
      exclude: ['node_modules/', 'tests/', '*.config.js', 'server.js', 'instrument.js', 'frontend/', 'dist/'],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
    },
  },
});
