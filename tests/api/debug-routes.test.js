import { describe, it, expect, afterEach, vi } from 'vitest';
import request from 'supertest';

// app.js decides at import time whether to mount the Sentry test routes, so each case
// re-imports it with a different environment.
async function loadApp(env) {
  vi.resetModules();
  // The logger is re-created on import; keep it quiet even when NODE_ENV is "production".
  vi.stubEnv('LOG_LEVEL', 'silent');
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
  return (await import('../../app.js')).default;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Sentry debug routes', () => {
  it('are not mounted by default', async () => {
    const app = await loadApp({ ENABLE_DEBUG_ROUTES: '' });
    await request(app).get('/api/debug-sentry').expect(404);
  });

  it('are never mounted in production, even when the flag is set', async () => {
    const app = await loadApp({ ENABLE_DEBUG_ROUTES: 'true', NODE_ENV: 'production' });
    await request(app).get('/api/debug-sentry').expect(404);
    await request(app).get('/api/debug-sentry-capture').expect(404);
    await request(app).get('/api/debug-sentry-custom').expect(404);
  });

  it('unhandled exception route returns a 500 JSON error with a request ID', async () => {
    const app = await loadApp({ ENABLE_DEBUG_ROUTES: 'true' });
    const res = await request(app).get('/api/debug-sentry').expect(500);

    expect(res.body.error).toBe('Internal server error');
    expect(res.body.requestId).toBe(res.headers['x-request-id']);
  });

  it('manual capture route reports the parse error and responds 500', async () => {
    const app = await loadApp({ ENABLE_DEBUG_ROUTES: 'true' });
    const res = await request(app).get('/api/debug-sentry-capture').expect(500);
    expect(res.body.error).toBe('Captured and reported to Sentry');
  });

  it('custom route reports a tagged error and responds 500', async () => {
    const app = await loadApp({ ENABLE_DEBUG_ROUTES: 'true' });
    const res = await request(app).get('/api/debug-sentry-custom').expect(500);
    expect(res.body.error).toBe('Custom error reported to Sentry with tags');
  });
});
