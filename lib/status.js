import { isUserStoreAvailable } from '../routes/auth.js';

const CACHE_TTL_MS = 15_000;
const CHECK_TIMEOUT_MS = 3000;

let cache = null;

export function resetStatusCache() {
  cache = null;
}

// The API process answering this request is itself proof the API server is up.
async function checkApi() {
  return { name: 'API Server', status: 'operational' };
}

// This project has no external database: users live in an in-memory store. Swap this for a
// real query (e.g. Prisma `$queryRaw\`SELECT 1\``) if you add one.
async function checkDatabase() {
  try {
    return isUserStoreAvailable()
      ? { name: 'Database', status: 'operational', detail: 'in-memory store (no external database)' }
      : { name: 'Database', status: 'degraded', detail: 'store unavailable' };
  } catch {
    return { name: 'Database', status: 'degraded', detail: 'store check failed' };
  }
}

async function checkFrontend() {
  const url = process.env.FRONTEND_URL;
  if (!url) {
    return { name: 'Frontend', status: 'unknown', detail: 'FRONTEND_URL is not set' };
  }
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(CHECK_TIMEOUT_MS) });
    return res.ok
      ? { name: 'Frontend', status: 'operational' }
      : { name: 'Frontend', status: 'degraded', detail: `HTTP ${res.status}` };
  } catch {
    return { name: 'Frontend', status: 'down', detail: 'unreachable' };
  }
}

function summarize(services) {
  if (services.every((s) => s.status === 'operational')) return 'All Systems Operational';
  if (services.some((s) => s.status === 'degraded' || s.status === 'down')) return 'Partial Outage';
  return 'Some Services Not Monitored';
}

/**
 * Status of every service. Results are cached for 15 seconds so a busy status page cannot
 * hammer the frontend with outbound requests.
 */
export async function getStatus(now = Date.now()) {
  if (cache && now - cache.at < CACHE_TTL_MS) return cache.value;

  const services = await Promise.all([checkApi(), checkDatabase(), checkFrontend()]);
  const value = {
    overall: summarize(services),
    services,
    lastChecked: new Date(now).toISOString(),
  };
  cache = { at: now, value };
  return value;
}
