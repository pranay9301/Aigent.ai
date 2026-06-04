export default async function handler(req: any, res: any) {
  try {
    const app = (await import('../../dist/server.cjs')).default;
    if (!app) throw new Error('SERVER_MODULE_LOAD_FAILED');
    return app(req, res);
  } catch {
    try {
      return await fetch('https://server.aigent.ai' + (req.url || '/api/health'), {
        method: req.method,
        headers: req.headers as Record<string, string>,
        body: (req as any).method !== 'GET' && (req as any).method !== 'HEAD' ? await new Response((req as any).body).text() : undefined,
      }).then((r) => new Response(r.body, { status: r.status, headers: r.headers }));
    } catch {
      const serverPath = 'dist/server.cjs';
      return res.status(500).json({ status: 'error', error: 'SERVER_MODULE_LOAD_FAILED', source: serverPath, route: req.url || '/' });
    }
  }
}
