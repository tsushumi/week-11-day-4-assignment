import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { readFileSync } from 'node:fs';
import app from '../../app.js';
import { getStatus, resetStatusCache } from '../../lib/status.js';

const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));

beforeEach(() => {
  resetStatusCache();
  vi.stubEnv('FRONTEND_URL', '');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('GET /api/health', () => {
  it('returns status, ISO timestamp, uptime and the package.json version', async () => {
    const res = await request(app).get('/api/health').expect(200);

    expect(res.body.status).toBe('ok');
    expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
    expect(typeof res.body.uptime).toBe('number');
    expect(res.body.version).toBe(pkg.version);
  });

  it('works without authentication and for HEAD requests (what UptimeRobot sends)', async () => {
    await request(app).get('/api/health').expect(200);
    const head = await request(app).head('/api/health');
    expect(head.status).toBe(200);
  });
});

describe('GET /api/status', () => {
  it('marks the frontend as not monitored when FRONTEND_URL is unset', async () => {
    const res = await request(app).get('/api/status').expect(200);

    expect(res.body.services.map((s) => s.name)).toEqual(['API Server', 'Database', 'Frontend']);
    expect(res.body.services.find((s) => s.name === 'Frontend').status).toBe('unknown');
    expect(res.body.overall).toBe('Some Services Not Monitored');
    expect(new Date(res.body.lastChecked).toISOString()).toBe(res.body.lastChecked);
  });

  it('reports All Systems Operational when every check passes', async () => {
    vi.stubEnv('FRONTEND_URL', 'https://app.example.com');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    const res = await request(app).get('/api/status').expect(200);

    expect(res.body.overall).toBe('All Systems Operational');
    expect(res.body.services.every((s) => s.status === 'operational')).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith('https://app.example.com', expect.objectContaining({ method: 'HEAD' }));
  });

  it('reports a partial outage when the frontend is unreachable', async () => {
    vi.stubEnv('FRONTEND_URL', 'https://app.example.com');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    const res = await request(app).get('/api/status').expect(200);

    expect(res.body.services.find((s) => s.name === 'Frontend').status).toBe('down');
    expect(res.body.overall).toBe('Partial Outage');
  });

  it('reports degraded when the frontend answers with an error status', async () => {
    vi.stubEnv('FRONTEND_URL', 'https://app.example.com');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));

    const res = await request(app).get('/api/status').expect(200);

    const frontend = res.body.services.find((s) => s.name === 'Frontend');
    expect(frontend).toMatchObject({ status: 'degraded', detail: 'HTTP 503' });
  });
});

describe('status caching', () => {
  it('reuses results for 15 seconds, then checks again', async () => {
    vi.stubEnv('FRONTEND_URL', 'https://app.example.com');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    const t0 = 1_000_000;
    await getStatus(t0);
    await getStatus(t0 + 5_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await getStatus(t0 + 16_000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
