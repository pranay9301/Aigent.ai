let app: any = null;
try {
  const mod = require('./dist/server.cjs') as any;
  app = mod && typeof mod === 'object' && 'default' in mod ? mod.default : mod;
} catch (e) {
  console.error('Failed to load server bundle:', e);
}

export default function handler(req: any, res: any) {
  if (!app || typeof app !== 'function') {
    return res.status(500).json({ error: 'SERVER_MODULE_LOAD_FAILED' });
  }
  try {
    return app(req, res);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown runtime error';
    return res.status(500).json({ error: 'APP_RUNTIME_ERROR', message });
  }
}
