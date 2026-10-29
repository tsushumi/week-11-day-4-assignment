import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../app.js';
import { resetUsers } from '../../routes/auth.js';

beforeEach(() => {
  resetUsers();
});

describe('GET /api/health', () => {
  it('should return status ok with 200', async () => {
    const response = await request(app).get('/api/health').expect(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
  });
});

describe('POST /api/auth/register', () => {
  it('should register a user and return the expected response shape', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User', email: 'Test@Example.com', password: 'password123' });

    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({ name: 'Test User', email: 'test@example.com' });
    expect(response.body.user).toHaveProperty('id');
    expect(response.body.user).not.toHaveProperty('password');
    expect(response.body.user).not.toHaveProperty('passwordHash');
    expect(typeof response.body.token).toBe('string');
  });

  it('should reject registration without required fields', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com' });
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });
});

describe('unknown routes', () => {
  it('should return 404 for a non-existent route', async () => {
    const response = await request(app).get('/api/does-not-exist');
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
  });
});
