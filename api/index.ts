// @ts-ignore
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  let serverMod: any = null;
  try {
    serverMod = require('./dist/server.cjs');
  } catch (e) {
    console.error('Failed to require server bundle:', e);
  }
  const app: any = serverMod && (serverMod.default || serverMod);
  if (!app || typeof app !== 'function') {
    return res.status(500).json({
      error: 'SERVER_MODULE_LOAD_FAILED',
      detail: { type: typeof serverMod, keys: Object.keys(serverMod || {}) },
    });
  }
  return app(req, res);
}