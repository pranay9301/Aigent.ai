# Operational Summary — Aigent.ai

Date: 2026-06-04

## Billing
- Razorpay checkout verified for Scale ($69) and Enterprise ($299) in paise.
- Frontend sends `planName` to `/api/razorpay/create-order`; server derives amount.
- Verify-payment persists amount and improves Razorpay error handling.
- PayPal removed from Billing page UI.
- Firestore transactions write restrictions removed; subscription enum normalized.

## Health
- `/api/health` returns 200 with service statuses (Gemini, Razorpay, PayPal, Firebase, email, cache).
- `/api/health/smoke` checks config, Razorpay create-order, and AI heartbeat.
- Serverless safety guard prevents `app.listen` on Vercel; handler proxies to bundled Express app.
- Production health verified after Vercel redeploy.

## Deploy
- Unified deploy flow on `/api/deploy/ai` (deprecated in favor of Vercel integration / local build pipeline).
- Vercel project: `pranay-hobby-projects/aigent-ai`.
- Production: https://aigent-ai.vercel.app
- Build uses Vite + esbuild bundle to `dist/server.cjs`, copied to `api/dist/server.cjs` for serverless resolution.

## Transactions
- Firestore `transactions` rules fixed to allow writes; subcollection write blocker removed.
- isValidUser subscription enum normalized to used values.
- Razorpay webhook stores payment event metadata.

## Vercel API Fixes
- Identified production runtime failure: `FUNCTION_INVOCATION_FAILED` on `/api/*` due to module export mismatch between bundled `dist/server.cjs` and Vercel `api/index.ts`.
- Implemented dynamic import + runtime shape detection; handler resolves `default` export safely.
- Deployed fix: `/api/health` returns `{"status":"ok"}` on production.

## Repo state
- Latest commit: 6c1ac4e.
- `api/index.ts` updated with safer server bundle resolution.
- `.gitignore` includes `.vercel/` removed to preserve project config.
