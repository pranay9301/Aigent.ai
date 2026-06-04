import app from '../server';

export default async function handler(req: any, res: any) {
  try {
    if (!app) {
      return res.status(500).json({ error: 'SERVER_MODULE_LOAD_FAILED', source: 'server.ts' });
    }
    return app(req, res);
  } catch (err) {
    return res.status(500).json({ error: 'APP_RUNTIME_ERROR', message: (err && err.message) || 'Unknown error' });
  }
}
