// @ts-ignore
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const serverMod: any = require('./dist/server.cjs');
    const app = serverMod && (serverMod.default || serverMod);
    if (typeof app !== 'function') {
      return res.status(500).json({ error: 'BUNDLE_HANDLER_INVALID', detail: typeof app });
    }
    return app(req, res);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown runtime error';
    console.error('Vercel handler failed:', err);
    return res.status(500).json({ error: 'APP_RUNTIME_ERROR', message });
  }
}
