import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

async function loadLogger() {
  vi.resetModules();
  return (await import('../../lib/logger.js')).default;
}

beforeEach(() => {
  vi.stubEnv('LOG_LEVEL', '');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('logger', () => {
  it('is silent in tests so output stays clean', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    const logger = await loadLogger();
    expect(logger.level).toBe('silent');
  });

  it('defaults to info in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const logger = await loadLogger();
    expect(logger.level).toBe('info');
  });

  it('lets LOG_LEVEL override the default', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('LOG_LEVEL', 'warn');
    const logger = await loadLogger();
    expect(logger.level).toBe('warn');
  });

  it('exposes the standard level methods', async () => {
    const logger = await loadLogger();
    for (const method of ['debug', 'info', 'warn', 'error']) {
      expect(typeof logger[method]).toBe('function');
    }
  });
});
