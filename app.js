import express from 'express';
import * as Sentry from '@sentry/node';
import authRoutes from './routes/auth.js';
import debugRoutes from './routes/debug.js';
import cors from './middleware/cors.js';
import { requestLogger } from './middleware/requestLogger.js';
import logger from './lib/logger.js';
import { version } from './lib/version.js';
import { getStatus } from './lib/status.js';

const app = express();

// First, so every request (even ones rejected by later middleware) gets an ID and a log line.
app.use(requestLogger);
app.use(cors);
app.use(express.json());

// Health check for uptime monitors and the scheduled workflow: unauthenticated and fast
// (no database or external calls). Express answers HEAD requests with this handler too,
// which is what UptimeRobot's free plan sends.
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version,
  });
});

// Status of each service, for the status page (frontend/status.html).
app.get('/api/status', async (_req, res, next) => {
  try {
    res.json(await getStatus());
  } catch (err) {
    next(err);
  }
});

app.get('/', (_req, res) => {
  res.json({ message: 'GitHub Actions basics API' });
});

app.use('/api/auth', authRoutes);

// Sentry test routes: never available in production, and off unless explicitly enabled.
if (process.env.ENABLE_DEBUG_ROUTES === 'true' && process.env.NODE_ENV !== 'production') {
  logger.warn('Sentry debug routes are enabled (/api/debug-sentry*). Do not enable in production.');
  app.use('/api', debugRoutes);
}

// 404 for anything that did not match a route.
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Sentry error handler: after all routes, BEFORE our own error handler.
Sentry.setupExpressErrorHandler(app);

// Our error handler. Sentry has already captured 5xx errors and set res.sentry to the event ID.
app.use((err, req, res, _next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  // Client errors raised by middleware (e.g. 413 payload too large) keep their own status.
  if (err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ error: err.message });
  }

  logger.error({ err, requestId: req.requestId, errorId: res.sentry }, 'Unhandled error');
  return res.status(500).json({
    error: 'Internal server error',
    errorId: res.sentry,
    requestId: req.requestId,
  });
});

export default app;
