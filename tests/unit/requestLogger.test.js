import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../../lib/logger.js', () => ({
  default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const { default: logger } = await import('../../lib/logger.js');
const { requestLogger } = await import('../../middleware/requestLogger.js');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function buildApp() {
  const app = express();
  app.use(requestLogger);
  app.get('/ok', (_req, res) => res.json({ ok: true }));
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.get('/bad', (_req, res) => res.status(400).json({ error: 'nope' }));
  app.get('/boom', (_req, res) => res.status(500).json({ error: 'boom' }));
  return app;
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('requestLogger', () => {
  it('logs successful requests at info with structured fields', async () => {
    await request(buildApp()).get('/ok').expect(200);

    expect(logger.info).toHaveBeenCalledTimes(1);
    const [data, message] = logger.info.mock.calls[0];
    expect(message).toBe('Request completed');
    expect(data).toMatchObject({ method: 'GET', url: '/ok', status: 200 });
    expect(data.requestId).toMatch(UUID);
    expect(data.responseTime).toMatch(/^\d+ms$/);
  });

  it('returns the request ID in the X-Request-Id header, matching the log line', async () => {
    const res = await request(buildApp()).get('/ok');
    const [data] = logger.info.mock.calls[0];
    expect(res.headers['x-request-id']).toBe(data.requestId);
  });

  it('gives every request its own ID', async () => {
    const app = buildApp();
    const a = await request(app).get('/ok');
    const b = await request(app).get('/ok');
    expect(a.headers['x-request-id']).not.toBe(b.headers['x-request-id']);
  });

  it('logs 4xx responses at warn', async () => {
    await request(buildApp()).get('/bad').expect(400);
    expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }), 'Request rejected');
    expect(logger.info).not.toHaveBeenCalled();
  });

  it('logs 5xx responses at error', async () => {
    await request(buildApp()).get('/boom').expect(500);
    expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ status: 500 }), 'Request failed');
  });

  it('logs slow requests (over 1s) at warn', async () => {
    // First hrtime call is the start, the second is the finish 1.5s later.
    vi.spyOn(process.hrtime, 'bigint').mockReturnValueOnce(0n).mockReturnValueOnce(1_500_000_000n);
    await request(buildApp()).get('/ok').expect(200);

    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ status: 200, responseTime: '1500ms' }),
      'Slow request detected',
    );
  });

  it('logs health checks at debug so monitors do not flood the logs', async () => {
    await request(buildApp()).get('/api/health').expect(200);
    expect(logger.debug).toHaveBeenCalledWith(expect.objectContaining({ url: '/api/health' }), 'Health check');
    expect(logger.info).not.toHaveBeenCalled();
  });
});
