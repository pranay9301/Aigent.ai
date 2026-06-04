import app from '../server';

export default function handler(req: any, res: any) {
  if (!app) {
    return res.status(500).json({ error: 'SERVER_MODULE_LOAD_FAILED', source: 'server.ts' });
  }
  try {
    return app(req, res);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown runtime error';
    return res.status(500).json({ error: 'APP_RUNTIME_ERROR', message });
  }
}
