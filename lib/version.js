import { readFileSync } from 'node:fs';

// Read from package.json instead of process.env.npm_package_version: that variable only exists
// when started through `npm start`, and is missing under `node server.js` (Railway, Render).
function readVersion() {
  try {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    return pkg.version || '1.0.0';
  } catch {
    return '1.0.0';
  }
}

export const version = readVersion();
