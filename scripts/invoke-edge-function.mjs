/**
 * Invoke a Supabase Edge Function using secrets from .env.local.
 *
 * Usage: node scripts/invoke-edge-function.mjs sync-news
 *        node scripts/invoke-edge-function.mjs sync-fixtures mode=live
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnv() {
  const path = resolve(root, '.env.local');
  const env = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

const fn = process.argv[2];
if (!fn) {
  console.error('Usage: node scripts/invoke-edge-function.mjs <function-name>');
  process.exit(1);
}

const fileEnv = loadEnv();
const url = fileEnv.SUPABASE_URL || fileEnv.VITE_SUPABASE_URL;
const key = fileEnv.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error(
    'Missing SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY in .env.local',
  );
  process.exit(1);
}

const query = process.argv[3] ? `?${process.argv[3]}` : '';
const endpoint = `${url.replace(/\/$/, '')}/functions/v1/${fn}${query}`;
const res = await fetch(endpoint, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  },
  body: '{}',
});

const body = await res.text();
if (!res.ok) {
  console.error(body || res.statusText);
  process.exit(1);
}

console.log(body);
