# Monitoring Setup

Error tracking (Sentry), uptime monitoring (UptimeRobot), structured logging (Pino) and a status page.

## Environment variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `SENTRY_DSN` | local `.env`, backend host | Sentry project key. Empty = Sentry disabled |
| `ENABLE_DEBUG_ROUTES` | local `.env` only | Turns on the 3 Sentry test routes. Ignored when `NODE_ENV=production` |
| `LOG_LEVEL` | optional | `debug` in development, `info` in production, `silent` in tests |
| `FRONTEND_URL` | backend host | Lets `/api/status` check the frontend |
| `API_URL` | Vercel | Lets the frontend (and status page) find the API |

Copy `.env.example` to `.env` for local development. `.env` is loaded automatically (`dotenv`) and is git-ignored.

## 1. Sentry error tracking

### Set up
1. Sign up at sentry.io (free Developer plan) and create a project: **Node.js > Express**.
2. Copy the DSN (Project Settings > Client Keys) into `.env` as `SENTRY_DSN=...`.
3. Start the server with the debug routes on:
   ```bash
   ENABLE_DEBUG_ROUTES=true npm run dev     # or: ENABLE_DEBUG_ROUTES=true npm start
   ```
   (or put `ENABLE_DEBUG_ROUTES=true` in `.env`)

### Trigger the 3 error types
```bash
curl http://localhost:3000/api/debug-sentry          # 1. unhandled exception
curl http://localhost:3000/api/debug-sentry-capture  # 2. manual Sentry.captureException
curl http://localhost:3000/api/debug-sentry-custom   # 3. custom error with tags, user, extra
```
Each answers HTTP 500 with an `eventId` you can search for in Sentry. Events appear within a few seconds.

### How it is wired
- `instrument.js` initialises Sentry. It must run **before Express is loaded**, so `npm start` uses `node --import ./instrument.js server.js`. Without `--import`, Sentry prints "express is not instrumented" and Express tracing is lost (errors are still captured). `server.js` also imports it as a fallback.
- `app.js` calls `Sentry.setupExpressErrorHandler(app)` after the routes and **before** the custom error handler, which returns `{ error, errorId, requestId }`.
- Every request gets a `request_id` tag, so a user-reported ID (the `X-Request-Id` response header) finds both the log lines and the Sentry event.
- The debug routes (`routes/debug.js`) are only mounted when `ENABLE_DEBUG_ROUTES=true` **and** `NODE_ENV` is not `production`, so they cannot reach production by accident.

## 2. UptimeRobot

`GET /api/health` (also answers `HEAD`, which UptimeRobot's free plan sends) is unauthenticated and does no database or network work:

```json
{ "status": "ok", "timestamp": "2026-10-28T20:00:00.000Z", "uptime": 123.4, "version": "1.0.0" }
```

Create two monitors at uptimerobot.com (free plan, 5-minute interval, your email as alert contact):

| Monitor | Type | Friendly name | URL |
| --- | --- | --- | --- |
| 1 | HTTP(s) | `YOUR-PROJECT API` | `https://YOUR-API-HOST/api/health` |
| 2 | HTTP(s) | `YOUR-PROJECT Frontend` | `https://YOUR-APP.vercel.app` |

Test alerting: edit monitor 1's URL to `https://this-does-not-exist.example.com`, wait up to 5 minutes for the "down" email, then restore the URL for the "up" email.


## 3. Structured logging (Pino)

- `lib/logger.js`: Pino logger. Colourised `pino-pretty` output in development, raw JSON in production, silent in tests. Passwords, tokens and authorization headers are redacted.
- `middleware/requestLogger.js`: one log line per request with `requestId`, `method`, `url`, `status`, `responseTime`.

| Situation | Level |
| --- | --- |
| Server started, user registered, request completed | `info` |
| Invalid input / 4xx response, request slower than 1s | `warn` |
| 5xx response, unhandled error | `error` |
| Health checks from monitors | `debug` (hidden in production) |

Always pass data first and a message second: `logger.info({ userId, email }, 'User registered successfully')`.
ESLint's `no-console` rule is an error for backend code, so `console.log` cannot creep back in.

Try both formats:
```bash
npm run dev                                   # pretty, coloured
NODE_ENV=production JWT_SECRET=x npm start    # raw JSON lines
```

## 4. Status page (bonus)

- `GET /api/status` returns `{ overall, services: [{ name, status, detail? }], lastChecked }` for **API Server**, **Database** and **Frontend**. Statuses: `operational`, `degraded`, `down`, `unknown`. Results are cached for 15 seconds, and each check has a 3-second timeout.
- `frontend/status.html` shows each service as a coloured circle plus a text label and refreshes every 30 seconds. It is deployed with the frontend at `https://YOUR-APP.vercel.app/status.html`.
- This project has no external database (users live in memory), so the "Database" check verifies the in-memory store. Replace `checkDatabase()` in `lib/status.js` with a real query (for example Prisma `SELECT 1`) if you add one.
- Set `FRONTEND_URL` on the backend host, otherwise the Frontend row shows "Not monitored".

## Evidence (screenshots)

1. Sentry Issues list with all 3 errors: `![Sentry issues](docs/screenshots/1-sentry-issues.png)`
2. One error detail with the full stack trace: `![Sentry stack trace](docs/screenshots/2-sentry-stacktrace.png)`
3. The custom error showing tags `error_type: payment_failure`, `provider: mpesa`: `![Sentry tags](docs/screenshots/3-sentry-tags.png)`
4. UptimeRobot dashboard with both monitors Up: `![UptimeRobot](docs/screenshots/4-uptimerobot.png)`
5. The "down" alert email: `![Down alert](docs/screenshots/5-down-email.png)`
6. Terminal showing colourised Pino logs: `![Pino logs](docs/screenshots/6-pino-logs.png)`
7. Status page: `![Status page](docs/screenshots/7-status-page.png)`
