const mod = require('./dist/server.cjs');
const app = mod && typeof mod === 'object' && 'default' in mod ? mod.default : mod;

export default function handler(req, res) {
  try {
    if (typeof app !== 'function') {
      return res.status(500).json({ error: 'SERVER_MODULE_LOAD_FAILED' });
    }
    return app(req, res);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown runtime error';
    return res.status(500).json({ error: 'APP_RUNTIME_ERROR', message });
  }
}