import pino from 'pino';

const env = process.env.NODE_ENV;

// LOG_LEVEL wins; otherwise: silent in tests, info in production, debug in development.
const level = process.env.LOG_LEVEL || (env === 'test' ? 'silent' : env === 'production' ? 'info' : 'debug');

// Pretty output only in development. In production we emit raw JSON (one object per line)
// for log tools to parse; in tests we avoid pino-pretty's worker thread entirely.
const usePretty = env !== 'production' && env !== 'test';

const logger = pino({
  level,
  // ISO timestamps are readable in raw JSON logs too.
  timestamp: pino.stdTimeFunctions.isoTime,
  // Never write secrets to logs, even if someone logs a whole object by mistake.
  redact: {
    paths: ['password', '*.password', 'token', '*.token', 'authorization', '*.authorization', '*.headers.authorization'],
    censor: '[redacted]',
  },
  transport: usePretty
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

export default logger;
