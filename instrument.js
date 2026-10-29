// Must be the FIRST import in server.js so Sentry can instrument Express before it is loaded.
import dotenv from 'dotenv';
import * as Sentry from '@sentry/node';

// Load .env (SENTRY_DSN etc.) before Sentry reads the environment. Variables already set by
// the host (Railway, Render, Vercel) are never overridden.
dotenv.config({ quiet: true });

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  release: process.env.SENTRY_RELEASE || process.env.RAILWAY_GIT_COMMIT_SHA || process.env.RENDER_GIT_COMMIT,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  // Without a DSN the SDK does nothing; in tests we never send events.
  enabled: process.env.NODE_ENV !== 'test' && Boolean(process.env.SENTRY_DSN),
});
