import { RequestListener } from 'http';

async function loadApp(): Promise<RequestListener<any, any> | null> {
  try {
    const mod = await import('./dist/server.cjs');
    const candidate = (mod as any).default ?? (mod as any);
    if (typeof candidate === 'function') {
      return candidate;
    }
    console.error('Server bundle export is not a function. Module keys:', typeof mod === 'object' ? Object.keys(mod) : 'n/a');
    return null;
  } catch (e) {
    console.error('Failed to load server bundle:', e);
    return null;
  }
}

export default async function handler(req: any, res: any) {
  const app = await loadApp();
  if (!app) {
    return res.status(500).json({ error: 'SERVER_MODULE_LOAD_FAILED' });
  }
  try {
    return app(req, res);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown runtime error';
    return res.status(500).json({ error: 'APP_RUNTIME_ERROR', message });
  }
}