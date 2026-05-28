# Aigent.ai — AI Business Engine

Full-stack AI business platform with multi-agent orchestration, payment processing, and CI/CD pipeline.

## Stack

- **Frontend**: React 19 + Vite + Tailwind CSS 4 + Framer Motion
- **Backend**: Express + TypeScript (tsx/esbuild)
- **AI**: Google Gemini 2.0 Flash
- **Database**: Firebase Firestore (Admin SDK + client SDK)
- **Payments**: PayPal + Razorpay
- **Email**: Resend
- **Hosting**: Vercel (serverless)
- **CI/CD**: GitHub Actions → Vercel

## Project Structure

```
├── api/index.ts          # Vercel serverless entry
├── server.ts             # Express app (routes + middleware)
├── src/
│   ├── components/       # React components (layout/, ui/)
│   ├── pages/            # Route pages
│   ├── lib/              # Shared libs (firebase, gemini, cache, utils)
│   ├── scripts/          # Maintenance scripts
│   └── test/             # Test files (setup, endpoints, components)
├── scripts/              # Deployment scripts
├── .github/workflows/    # CI/CD pipeline
└── dist/                 # Build output (gitignored)
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/health | Health check |
| GET | /api/config | Public config (PayPal/Razorpay keys) |
| POST | /api/ai/orchestrate | AI agent orchestration |
| POST | /api/ai/build | Build project via AI |
| POST | /api/contact | Contact form submission |
| POST | /api/email/send | Send email via Resend |
| POST | /api/paypal/create-order | Create PayPal order |
| POST | /api/paypal/capture-order | Capture PayPal payment |
| POST | /api/razorpay/create-order | Create Razorpay order |
| POST | /api/razorpay/verify-payment | Verify Razorpay signature |
| POST | /api/razorpay/webhook | Razorpay webhook handler |
| POST | /api/tasks/execute | Execute pending AI tasks |
| POST | /api/deploy/github | Deploy to GitHub |
| POST | /api/deploy/vercel | Deploy to Vercel |

## Commands

```bash
npm run dev        # Start dev server (tsx)
npm run build      # Vite build + esbuild server
npm run start      # Run production build
npm test           # Run vitest test suite
npm run lint       # TypeScript type check
```

## Deployment Pipeline

1. Push to `main` → GitHub Actions runs quality → build → Vercel deploy
2. Requires secrets in GitHub repo (see `scripts/setup-secrets.sh`)
3. Vercel project is linked via `vercel.json`

## Key Patterns

- **Neural cache**: In-memory cache with optional Firestore persistence
- **Rate limiting**: In-memory sliding window (60 req/min per IP)
- **Firebase Admin SDK**: Lazy-initialized per request, Service Account from env var
- **Dynamic imports**: SDKs loaded on demand to reduce cold start