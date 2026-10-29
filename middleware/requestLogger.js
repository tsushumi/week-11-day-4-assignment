import { randomUUID } from 'node:crypto';
import * as Sentry from '@sentry/node';
import logger from '../lib/logger.js';

const SLOW_REQUEST_MS = 1000;

/**
 * Logs every HTTP request once it finishes, with a request ID that is also returned to the
 * client (X-Request-Id header) and attached to Sentry events, so a user-reported ID can be
 * matched to logs and to an error in Sentry.
 *
 * Levels: 5xx -> error, 4xx or slower than 1s -> warn, otherwise info.
 * Health checks run every few minutes from monitors, so they log at debug to avoid noise.
 */
export function requestLogger(req, res, next) {
  const requestId = randomUUID();
  const start = process.hrtime.bigint();

  // Attach the requestId for use in other middleware and routes.
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  Sentry.getIsolationScope().setTag('request_id', requestId);

  res.on('finish', () => {
    const responseTimeMs = Number(process.hrtime.bigint() - start) / 1e6;
    const logData = {
      requestId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      responseTime: `${Math.round(responseTimeMs)}ms`,
    };

    if (res.statusCode >= 500) {
      logger.error(logData, 'Request failed');
    } else if (responseTimeMs > SLOW_REQUEST_MS) {
      logger.warn(logData, 'Slow request detected');
    } else if (res.statusCode >= 400) {
      logger.warn(logData, 'Request rejected');
    } else if (req.path === '/api/health') {
      logger.debug(logData, 'Health check');
    } else {
      logger.info(logData, 'Request completed');
    }
  });

  next();
}
