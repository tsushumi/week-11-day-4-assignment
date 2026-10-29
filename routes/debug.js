import { Router } from 'express';
import * as Sentry from '@sentry/node';

// Test-only routes that trigger the 3 Sentry error types. app.js mounts them ONLY when
// ENABLE_DEBUG_ROUTES=true and NODE_ENV is not "production", so they cannot ship by accident.
const router = Router();

// Error type 1: unhandled exception, caught by Sentry's Express error handler.
router.get('/debug-sentry', () => {
  throw new Error('Sentry test: unhandled exception');
});

// Error type 2: manual captureException inside a try/catch.
router.get('/debug-sentry-capture', (_req, res) => {
  try {
    JSON.parse('invalid json{{{');
  } catch (error) {
    const eventId = Sentry.captureException(error);
    res.status(500).json({ error: 'Captured and reported to Sentry', eventId });
  }
});

// Error type 3: custom error with tags, user and extra context.
router.get('/debug-sentry-custom', (_req, res) => {
  const eventId = Sentry.withScope((scope) => {
    scope.setTag('error_type', 'payment_failure');
    scope.setTag('provider', 'mpesa');
    scope.setUser({ id: 'test-user-123', email: 'test@example.com' });
    scope.setExtra('amount', 5000);
    scope.setExtra('currency', 'KES');
    return Sentry.captureException(new Error('Sentry test: M-Pesa payment failed'));
  });
  res.status(500).json({ error: 'Custom error reported to Sentry with tags', eventId });
});

export default router;
