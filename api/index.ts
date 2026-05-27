// Vercel serverless function entry point
// Dynamic import handles the CJS output from esbuild in an ESM project
let app: any;

export default async function handler(req: any, res: any) {
  if (!app) {
    app = (await import('../dist/server.cjs')).default;
  }
  return app(req, res);
}