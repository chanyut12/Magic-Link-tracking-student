/* eslint-disable no-console */
const baseUrl = process.env.SMOKE_BASE_URL || 'http://localhost:3000';

async function check(name, path, opts, evaluate) {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, opts);
  const ok = await evaluate(res);
  if (!ok) {
    throw new Error(`${name} failed: ${res.status} ${res.statusText}`);
  }
  console.log(`OK: ${name} (${res.status})`);
}

async function run() {
  console.log(`Running smoke checks against ${baseUrl}`);

  await check(
    'healthz',
    '/healthz',
    { method: 'GET' },
    async (res) => res.status === 200
  );

  await check(
    'expired-page',
    '/expired',
    { method: 'GET' },
    async (res) => res.status === 200
  );

  await check(
    'admin-gate',
    '/',
    { method: 'GET', redirect: 'manual' },
    async (res) => res.status === 302 || res.status === 200
  );
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
