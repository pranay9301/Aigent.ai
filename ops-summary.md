# Operational Summary — Aigent.ai

Date: 2026-06-03

## Billing
- Razorpay checkout verified for Scale ($69) and Enterprise ($299) in paise.
- Frontend sends `planName` to `/api/razorpay/create-order`; server derives amount.
- Verify-payment now persists amount and improves Razorpay error handling.
- PayPal removed from Billing page UI.

## Health
- `/api/health` returns 200 with service statuses (Gemini, Razorpay, Firebase, email, cache).
- `/api/health/smoke` checks config, Razorpay create-order, and AI heartbeat.
- Serverless safety guard prevents `app.listen` on Vercel.

## Deploy
- Unified deploy flow on `/api/deploy/ai`.
- Vercel project: `pranay-hobby-projects/aigent-ai`.
- Production: https://aigent-ai.vercel.app
- Build uses Vite + esbuild bundle to `dist/server.cjs`.

## Transactions
- Firestore `transactions` rules fixed to allow writes; subcollection write blocker removed.
- isValidUser subscription enum normalized to used values.
- Razorpay webhook stores payment event metadata.

## Repo state
- `server.ts` restored to HEAD, guarded for serverless/test, and deployed.
- Latest commit: 8588db4.
