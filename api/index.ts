// Vercel serverless function entry point
let cached: any;

export default async function handler(req: any, res: any) {
  if (!cached) {
    const m = await import('../dist/server.cjs');
    cached = (m && (m.default || m)) || null;
  }
  if (!cached || typeof cached !== 'function') {
    return res.status(500).json({ error: 'SERVER_MODULE_LOAD_FAILED', hint: 'dist/server.cjs did not export a request handler' });
  }
  return cached(req, res);
}
