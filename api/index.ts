// Vercel serverless entry: load the built Express bundle and wrap it
(async () => {
  try {
    const mod = await import('./dist/server.cjs');
    const app = mod && typeof mod === 'object' && 'default' in mod ? mod.default : mod;
    if (typeof app !== 'function') {
      console.error('Server bundle default export is not a function. Keys:', typeof mod === 'object' ? Object.keys(mod) : 'n/a');
    }
  } catch (e) {
    console.error('Failed to load server bundle:', e);
  }
})();

export default function handler(req: any, res: any) {
  // The bundled server controls its own Vercel/test lifecycle on require.
  // Here we proxy requests to the underlying Express app.
  try {
    const mod = require('./dist/server.cjs');
    const app = mod && typeof mod === 'object' && 'default' in mod ? mod.default : mod;
    if (typeof app === 'function') {
      return app(req, res);
    }
    return res.status(500).json({ error: 'SERVER_MODULE_LOAD_FAILED' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown runtime error';
    return res.status(500).json({ error: 'APP_RUNTIME_ERROR', message });
  }
}