import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../app.js';

describe('error handling', () => {
  it('keeps the 4xx status of middleware errors instead of turning them into 500s', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ name: 'x'.repeat(200_000) }));

    expect(res.status).toBe(413);
    expect(res.body).toHaveProperty('error');
  });

  it('adds an X-Request-Id header to every response, including 404s', async () => {
    const res = await request(app).get('/api/nothing-here').expect(404);
    expect(res.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
  });
});
