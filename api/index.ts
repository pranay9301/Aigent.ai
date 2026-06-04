const serverPath = './dist/server.cjs';

function loadServer() {
  let mod: any;
  try {
    mod = require(serverPath);
  } catch {
    return null;
  }
  return mod && (mod.default || mod);
}

let app: any = null;
try {
  app = loadServer();
} catch {
  app = null;
}

export default function handler(req: any, res: any) {
  if (!app) {
    return res.status(500).json({ error: 'SERVER_MODULE_LOAD_FAILED', source: 'dist/server.cjs' });
  }
  return app(req, res);
}
