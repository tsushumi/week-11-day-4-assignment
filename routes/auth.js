import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { randomBytes, scryptSync } from 'node:crypto';
import { isValidEmail, generateRef } from '../utils/helpers.js';
import logger from '../lib/logger.js';

const router = Router();

// In-memory store: keeps tests independent of any database or external service.
const users = new Map();

export function resetUsers() {
  users.clear();
}

/** Used by the status page as the "database" connectivity check. */
export function isUserStoreAvailable() {
  return users instanceof Map;
}

function getJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
  return 'dev-only-secret';
}

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 32).toString('hex');
  return `${salt}:${hash}`;
}

router.post('/register', (req, res) => {
  // Express 5 leaves req.body undefined when no body is sent.
  const { name, email, password } = req.body ?? {};

  if (!name || !email || !password) {
    logger.warn({ requestId: req.requestId, missing: ['name', 'email', 'password'].filter((f) => !req.body?.[f]) }, 'Registration rejected: missing fields');
    return res.status(400).json({ error: 'name, email and password are required' });
  }
  if (!isValidEmail(email)) {
    logger.warn({ requestId: req.requestId }, 'Registration rejected: invalid email');
    return res.status(400).json({ error: 'A valid email is required' });
  }
  if (typeof password !== 'string' || password.length < 8) {
    logger.warn({ requestId: req.requestId }, 'Registration rejected: password too short');
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const key = email.toLowerCase();
  if (users.has(key)) {
    logger.warn({ requestId: req.requestId, email: key }, 'Registration rejected: email already registered');
    return res.status(409).json({ error: 'Email is already registered' });
  }

  const user = { id: generateRef('USR'), name: String(name), email: key };
  users.set(key, { ...user, passwordHash: hashPassword(password) });

  const token = jwt.sign({ sub: user.id, email: user.email }, getJwtSecret(), {
    expiresIn: '1h',
  });

  logger.info({ requestId: req.requestId, userId: user.id, email: user.email }, 'User registered successfully');
  return res.status(201).json({ user, token });
});

export default router;
