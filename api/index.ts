let cachedApp: any = null;
let loadError: string | null = null;

function loadServer() {
  if (cachedApp) return cachedApp;
  try {
    const mod = require('../dist/server.cjs');
    cachedApp = mod && (mod.default || mod);
  } catch (err) {
    loadError = err instanceof Error ? err.message : 'Unknown require failure';
  }
  return cachedApp;
}

export default function handler(req: any, res: any) {
  const app = loadServer();
  if (!app) {
    const source = loadError || 'Unknown';
    return res.status(500).json({ error: 'SERVER_MODULE_LOAD_FAILED', source, reason: 'dist/server.cjs failed to load' });
  }
  try {
    return app(req, res);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown runtime error';
    return res.status(500).json({ error: 'APP_RUNTIME_ERROR', message });
  }
}
