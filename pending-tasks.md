# Pending Tasks — Aigent.ai

Resolved PayPal mismatch across server, config, and tests, and one fallback route behavior:
- Removed PayPal routes/SDK usage from `server.ts`.
- Updated `/api/config` to omit PayPal fields while still reporting `paypalConfigured`.
- Updated tests to reflect actual deployed endpoints and removed PayPal-specific test cases.
- `GET *` now returns 404 when no static file exists instead of crashing.

Verified locally:
- Build passes.
- Vitest suite reflects current server route shape after PayPal removal.

Deployed via Vercel after GitHub push.
