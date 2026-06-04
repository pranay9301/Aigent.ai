import app from '../dist/server.cjs';

export default async function handler(req: any, res: any) {
  if (!app || typeof app !== 'function') {
    return res.status(500).json({ error: 'SERVER_MODULE_LOAD_FAILED', hint: 'Request handler import failed' });
  }
  return app(req, res);
}
