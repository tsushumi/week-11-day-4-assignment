import './instrument.js';
import * as Sentry from '@sentry/node';
import app from './app.js';
import logger from './lib/logger.js';

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  logger.info(
    { port: Number(PORT), env: process.env.NODE_ENV || 'development', sentryEnabled: Boolean(process.env.SENTRY_DSN) },
    'Server started',
  );
});

// Railway/Render send SIGTERM on every deploy: finish in-flight requests, flush pending
// Sentry events, then exit, instead of dropping them.
async function shutdown(signal) {
  logger.info({ signal }, 'Shutting down');
  server.close(async () => {
    await Sentry.close(2000);
    process.exit(0);
  });
  // Force exit if connections refuse to close.
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
