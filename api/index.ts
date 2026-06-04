import app from './dist/server.cjs';

export default function handler(req: any, res: any) {
  if (!app) {
    return res.status(500).json({ error: 'SERVER_MODULE_LOAD_FAILED', source: 'dist/server.cjs' });
  }
  try {
    return app(req, res);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown runtime error';
    return res.status(500).json({ error: 'APP_RUNTIME_ERROR', message });
  }
}
