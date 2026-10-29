import { describe, it, expect, afterEach, vi } from 'vitest';
import request from 'supertest';
import app from '../../app.js';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('CORS', () => {
  it('allows any origin by default', async () => {
    const res = await request(app).get('/api/health').set('Origin', 'https://app.vercel.app');
    expect(res.headers['access-control-allow-origin']).toBe('*');
  });

  it('answers preflight requests with 204', async () => {
    const res = await request(app)
      .options('/api/auth/register')
      .set('Origin', 'https://app.vercel.app')
      .set('Access-Control-Request-Method', 'POST');
    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-methods']).toContain('POST');
  });

  it('echoes only allow-listed origins when CORS_ORIGIN is set', async () => {
    vi.stubEnv('CORS_ORIGIN', 'https://app.vercel.app, https://other.example');

    const allowed = await request(app).get('/api/health').set('Origin', 'https://app.vercel.app');
    expect(allowed.headers['access-control-allow-origin']).toBe('https://app.vercel.app');
    expect(allowed.headers.vary).toMatch(/Origin/);

    const blocked = await request(app).get('/api/health').set('Origin', 'https://evil.example');
    expect(blocked.headers['access-control-allow-origin']).toBeUndefined();
  });
});
