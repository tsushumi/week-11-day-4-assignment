import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from '../../scripts/build.js';

let outDir;

beforeEach(() => {
  outDir = join(mkdtempSync(join(tmpdir(), 'build-test-')), 'dist');
});

afterEach(() => {
  rmSync(join(outDir, '..'), { recursive: true, force: true });
});

describe('frontend build', () => {
  it('copies the frontend and writes config.js with build-time settings', () => {
    const config = build({
      outDir,
      env: { API_URL: 'https://api.example.app/', GITHUB_SHA: 'abcdef1234567890' },
      now: new Date('2026-10-27T12:00:00Z'),
    });

    expect(existsSync(join(outDir, 'index.html'))).toBe(true);
    expect(config).toEqual({
      apiUrl: 'https://api.example.app',
      builtAt: '2026-10-27T12:00:00.000Z',
      commit: 'abcdef1',
    });
    expect(readFileSync(join(outDir, 'config.js'), 'utf8')).toContain('"apiUrl":"https://api.example.app"');
  });

  it('prefers the Vercel commit SHA and tolerates missing env vars', () => {
    const withVercel = build({ outDir, env: { VERCEL_GIT_COMMIT_SHA: '1234567890', GITHUB_SHA: 'zzzzzzzz' } });
    expect(withVercel.commit).toBe('1234567');

    const bare = build({ outDir, env: {} });
    expect(bare.apiUrl).toBe('');
    expect(bare.commit).toBe('');
  });
});
