export default async function handler(req: any, res: any) {
  let app: any = null;
  try {
    const mod = await import('./dist/server.cjs');
    const candidate = (mod as any).default ?? (mod as any);
    let appCandidate: any = candidate;
    if (typeof appCandidate !== 'function' && typeof candidate === 'object') {
      const nestedKeys = Object.keys(candidate ?? {});
      if ('default' in candidate && typeof candidate.default !== 'undefined') {
        appCandidate = candidate.default;
      } else if (nestedKeys.includes('module') && candidate.module?.exports) {
        appCandidate = candidate.module.exports;
      } else if (nestedKeys.includes('exports')) {
        appCandidate = candidate.exports;
      }
    }
    app = appCandidate;
  } catch (e) {
    console.error('Failed to load server bundle:', e);
  }
  if (!app || typeof app !== 'function') {
    const modDetail: any = await import('./dist/server.cjs').catch(() => null);
    console.error('Handler runtime module shape:', {
      hasDefault: !!modDetail?.default,
      typeofDefault: typeof modDetail?.default,
      defaultNested: modDetail?.default && typeof modDetail.default === 'object' ? Object.keys(modDetail.default) : [],
      keys: typeof modDetail === 'object' ? Object.keys(modDetail ?? {}) : [],
    });
    return res.status(500).json({
      error: 'SERVER_MODULE_LOAD_FAILED',
      detail: typeof modDetail === 'object' ? {
        hasDefault: !!modDetail.default,
        typeofDefault: typeof modDetail.default,
        defaultNested: modDetail?.default && typeof modDetail.default === 'object' ? Object.keys(modDetail.default) : [],
        keys: Object.keys(modDetail ?? {}),
      } : { raw: typeof modDetail },
    });
  }
  try {
    return app(req, res);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown runtime error';
    return res.status(500).json({ error: 'APP_RUNTIME_ERROR', message });
  }
}
