// Vercel serverless function entry point
let app: any;

export default async function handler(req: any, res: any) {
  if (!app) {
    const mod = await import('../dist/server.cjs');
    app = (mod && (mod.default || mod)) || null;
  }
  if (typeof app === 'function') {
    return app(req, res);
  }
  return res.status(500).json({ error: 'SERVER_MODULE_LOAD_FAILED' });
}
