import { spawn } from 'node:child_process';

const VERCEL_URL = process.argv[2] || 'https://aigent-ai.vercel.app/api/health';
const CHECK_INTERVAL_MS = 60_000;

async function checkHealth() {
  try {
    const res = await fetch(VERCEL_URL);
    const text = await res.text();
    if (res.ok && String(text).includes('"status":"ok"')) {
      return { ok: true };
    }
    return { ok: false, reason: text };
  } catch {
    return { ok: false, reason: 'fetch failed' };
  }
}

async function runDeploy() {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', ['scripts/deploy-to-vercel.js'], { cwd: process.cwd() });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('close', (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(stderr || stdout || String(code)));
    });
  });
}

async function verifyAndDeploy() {
  const result = await checkHealth();
  if (result.ok) {
    console.log(`[health-deploy] OK => ${new Date().toISOString()}`);
    return;
  }
  console.warn(`[health-deploy] DEGRADED => ${result.reason}`);
  try {
    console.log('[health-deploy] triggering deploy...');
    const out = await runDeploy();
    console.log('[health-deploy] deploy output:', String(out).slice(0, 1000));
  } catch (err) {
    console.error('[health-deploy] deploy failed:', err && String(err.message));
  }
}

verifyAndDeploy();
setInterval(verifyAndDeploy, CHECK_INTERVAL_MS);
