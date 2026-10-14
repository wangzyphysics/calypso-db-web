import { spawn } from 'node:child_process';
import { readFile, writeFile, chmod } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const web = fileURLToPath(new URL('../', import.meta.url));
const lab = fileURLToPath(new URL('../../materials-backend-lab/', import.meta.url));
const children = new Set();
let stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill('SIGTERM');
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
function run(args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { cwd, stdio: 'inherit' });
    children.add(child);
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      children.delete(child);
      if (stopping || code === 0) resolve();
      else reject(new Error(`Local process stopped (${signal ?? code}).`));
    });
  });
}
async function configure(name, values) {
  const file = new URL('../' + name, import.meta.url);
  let previous = '';
  try { previous = await readFile(file, 'utf8'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  const initial = previous;
  for (const [key, value] of Object.entries(values)) {
    const line = `${key}=${value}`;
    const pattern = new RegExp(`^${key}=.*$`, 'm');
    previous = pattern.test(previous) ? previous.replace(pattern, line) : previous.trimEnd() + '\n' + line + '\n';
  }
  if (previous !== initial) {
    await writeFile(file, previous, { mode: 0o600 });
    await chmod(file, 0o600);
  }
}
async function probe(url) {
  try { return await fetch(url, { signal: AbortSignal.timeout(1500) }); }
  catch { return null; }
}
try {
  await configure('.env.local', {
    NEXT_PUBLIC_MATERIALS_API_BASE: '/api/materials',
    NEXT_PUBLIC_MATERIALS_PREVIEW_PATH: '/previews',
    NEXT_PUBLIC_AUTH_API_BASE: '/api/identity',
    NEXT_PUBLIC_CONTRIBUTIONS_API_BASE: '/api/contributions',
    NEXT_PUBLIC_ENABLE_LOCAL_ACCOUNTS: 'false',
    NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS: 'false',
  });
  await configure('.dev.vars', { CALYPSO_LOCAL_BACKEND_URL: 'http://127.0.0.1:8877' });
  await run(['scripts/local-postgres.mjs', 'start'], lab);
  await run(['--experimental-strip-types', 'scripts/platform-bootstrap.mjs'], lab);
  const running = await probe('http://127.0.0.1:8877/health');
  let api;
  if (running) {
    const health = await running.json().catch(() => null);
    if (health?.backend !== 'postgres' || health?.mode !== 'local') throw new Error('Port 8877 is occupied by a different service. Stop it before retrying.');
    console.log('Reusing the local PostgreSQL API on 8877.');
  } else {
    api = run(['--experimental-strip-types', 'src/platform/server.mjs'], lab);
    api.catch(() => stop());
    for (let attempt = 0; attempt < 40; attempt++) {
      const health = await probe('http://127.0.0.1:8877/health');
      if (health?.ok) break;
      if (stopping || attempt === 39) throw new Error('The local API did not start.');
      await new Promise(resolve => setTimeout(resolve, 250));
    }
  }
  const frontend = await probe('http://127.0.0.1:5173/api/identity/providers');
  if (frontend?.ok) {
    console.log('CALYPSO is already running at http://127.0.0.1:5173. Restart its dev process if configuration changed.');
    if (api) await api;
  } else if (frontend) {
    throw new Error('Port 5173 is occupied or its API configuration is stale. Stop that dev process and retry.');
  } else {
    console.log('Test account passwords: materials-backend-lab/.local/platform-test-accounts.json (private file).');
    await run(['scripts/run-framework.mjs', 'dev'], web);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally { stop(); }
