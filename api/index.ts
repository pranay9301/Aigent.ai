// @ts-ignore
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  let serverMod: any = null;
  try {
    serverMod = require('./dist/server.cjs');
  } catch (e) {
    console.error('Failed to require server bundle:', e);
  }
  const mod = serverMod && (serverMod.default || serverMod);
  if (!mod) {
    return res.status(500).json({ error: 'SERVER_MODULE_LOAD_FAILED', detail: { type: typeof serverMod, keys: Object.keys(serverMod || {}) } });
  }
  const app: any = typeof mod === 'function' ? mod : (mod.handle || mod.request || mod);
  if (!app || (typeof app !== 'function' && typeof app.handle !== 'function')) {
    return res.status(500).json({ error: 'SERVER_MODULE_LOAD_FAILED', detail: { type: typeof mod, keys: Object.keys(mod || {}) } });
  }
  try {
    if (typeof app === 'function') return app(req, res);
    return app.handle(req, res);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown runtime error';
    return res.status(500).json({ error: 'APP_RUNTIME_ERROR', message });
  }
}