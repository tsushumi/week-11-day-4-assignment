import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import { resetUsers } from '../../routes/auth.js';

const valid = { name: 'Jane', email: 'jane@example.com', password: 'password123' };

beforeEach(() => {
  resetUsers();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('POST /api/auth/register (validation)', () => {
  it('rejects an empty request with no body', async () => {
    const res = await request(app).post('/api/auth/register');
    expect(res.status).toBe(400);
  });

  it('rejects an invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...valid, email: 'nope' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  it('rejects a short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...valid, password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/password/i);
  });

  it('rejects malformed JSON with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send('{"email": ');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Invalid JSON body');
  });

  it('returns 409 for a duplicate email', async () => {
    await request(app).post('/api/auth/register').send(valid).expect(201);
    const res = await request(app).post('/api/auth/register').send(valid);
    expect(res.status).toBe(409);
  });
});

describe('JWT secret handling', () => {
  it('signs with JWT_SECRET when provided', async () => {
    vi.stubEnv('JWT_SECRET', 'ci-test-secret');
    const res = await request(app).post('/api/auth/register').send(valid).expect(201);
    const payload = JSON.parse(Buffer.from(res.body.token.split('.')[1], 'base64url'));
    expect(payload.email).toBe('jane@example.com');
  });

  it('refuses to run in production without JWT_SECRET', async () => {
    vi.stubEnv('JWT_SECRET', '');
    vi.stubEnv('NODE_ENV', 'production');
    const res = await request(app).post('/api/auth/register').send(valid);
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'Internal server error');
  });
});

describe('root route', () => {
  it('returns the welcome message', async () => {
    const res = await request(app).get('/').expect(200);
    expect(res.body).toHaveProperty('message');
  });
});
