import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(import.meta.url);
const root = resolve(dirname(here), '..');

/**
 * Static build: copies frontend/ to dist/ and writes dist/config.js with
 * build-time settings (API URL, build date, commit SHA).
 * Vercel exposes VERCEL_GIT_COMMIT_SHA; GitHub Actions exposes GITHUB_SHA.
 */
export function build({
  srcDir = join(root, 'frontend'),
  outDir = join(root, 'dist'),
  env = process.env,
  now = new Date(),
} = {}) {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  cpSync(srcDir, outDir, { recursive: true });

  const config = {
    apiUrl: (env.API_URL ?? '').trim().replace(/\/+$/, ''),
    builtAt: now.toISOString(),
    commit: (env.VERCEL_GIT_COMMIT_SHA ?? env.GITHUB_SHA ?? '').slice(0, 7),
  };
  writeFileSync(join(outDir, 'config.js'), `window.APP_CONFIG = ${JSON.stringify(config)};\n`);
  return config;
}

// Run when invoked as `node scripts/build.js` (npm run build), not when imported by tests.
if (process.argv[1] && resolve(process.argv[1]) === here) {
  const config = build();
  console.log(`Built frontend to dist/ (API_URL=${config.apiUrl || 'not set'}, ${config.builtAt})`);
}
