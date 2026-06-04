export default async function handler(req: any, res: any) {
  let app: any = null;
  try {
    const mod = await import('./dist/server.cjs');
    const candidate = (mod as any).default ?? (mod as any);
    app = candidate;
    if (typeof app !== 'function' && typeof candidate === 'object' && 'default' in candidate) {
      app = candidate.default;
    }
  } catch (e) {
    console.error('Failed to load server bundle:', e);
  }
  if (!app || typeof app !== 'function') {
    const mod: any = await import('./dist/server.cjs').catch(() => null);
    console.error('Handler runtime module shape:', {
      hasDefault: !!mod?.default,
      typeofDefault: typeof mod?.default,
      keys: typeof mod === 'object' ? Object.keys(mod ?? {}) : [],
    });
    return res.status(500).json({
      error: 'SERVER_MODULE_LOAD_FAILED',
      detail: typeof mod === 'object' ? {
        hasDefault: !!mod.default,
        typeofDefault: typeof mod.default,
        keys: Object.keys(mod ?? {}),
      } : { raw: typeof mod },
    });
  }
  try {
    return app(req, res);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown runtime error';
    return res.status(500).json({ error: 'APP_RUNTIME_ERROR', message });
  }
}
