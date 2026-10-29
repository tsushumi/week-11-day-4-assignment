/**
 * Minimal CORS middleware so the Vercel frontend can call the Railway API.
 * CORS_ORIGIN is a comma-separated allow list (default "*").
 * Vercel preview URLs change per branch, so "*" is the practical default for this demo;
 * lock it down to your production URL for a real app.
 */
export default function cors(req, res, next) {
  const allowed = (process.env.CORS_ORIGIN || '*')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const origin = req.headers.origin;

  if (allowed.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (origin && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  return next();
}
