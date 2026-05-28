#!/usr/bin/env bash
#===============================================================================
# Aigent.ai - GitHub Secrets & Vercel Setup Script
# Run this once after cloning the repo to configure CI/CD pipeline secrets.
#
# Usage:
#   chmod +x scripts/setup-secrets.sh
#   ./scripts/setup-secrets.sh
#
# Prerequisites:
#   - GitHub CLI (gh) installed and authenticated
#   - Vercel CLI (vercel) installed and authenticated
#   - All required API keys/credentials ready
#===============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

REPO="pranay9301/Aigent.ai"

echo -e "${GREEN}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║       Aigent.ai - CI/CD Secrets Setup            ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════╝${NC}"
echo ""

# ── Load .env.local if present ────────────────────────────────────────────
if [ -f .env.local ]; then
  echo -e "${YELLOW}📄 Loading .env.local file...${NC}"
  set -a; source .env.local; set +a
fi

# ── Helper to set a GitHub secret ─────────────────────────────────────────
set_gh_secret() {
  local name=$1
  local value=$2
  if [ -z "$value" ]; then
    echo -e "${RED}  ❌ $name is empty — skipping${NC}"
    return 1
  fi
  echo "$value" | gh secret set "$name" --repo "$REPO" 2>/dev/null
  echo -e "${GREEN}  ✅ $name set${NC}"
}

# ── Helper to prompt for a secret if not already set ──────────────────────
ensure_secret() {
  local name=$1
  local description=$2
  local current_value=${!name:-}

  if [ -z "$current_value" ]; then
    echo -e "${YELLOW}  🔑 $name ($description):${NC}"
    read -r -s "  ➤ Enter value (or press Enter to skip): " current_value
    echo ""
  fi
  set_gh_secret "$name" "$current_value"
}

echo -e "${GREEN}🔧 Checking GitHub CLI...${NC}"
if ! command -v gh &> /dev/null; then
  echo -e "${RED}❌ GitHub CLI (gh) not found. Install it first: https://cli.github.com/${NC}"
  exit 1
fi

if ! gh auth status &> /dev/null; then
  echo -e "${RED}❌ Not logged into GitHub CLI. Run: gh auth login${NC}"
  exit 1
fi

echo -e "${GREEN}✅ GitHub CLI is ready${NC}"
echo ""

# ── Step 1: GitHub Repository Secrets ─────────────────────────────────────
echo -e "${GREEN}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Step 1: GitHub Actions Secrets                   ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════╝${NC}"

echo -e "\n${GREEN}📌 Core API Secrets:${NC}"
ensure_secret "GEMINI_API_KEY" "Google Gemini AI API key"

echo -e "\n${GREEN}📌 Payment Gateway Secrets:${NC}"
ensure_secret "PAYPAL_CLIENT_ID" "PayPal Client ID"
ensure_secret "PAYPAL_CLIENT_SECRET" "PayPal Client Secret"
set_gh_secret "PAYPAL_MODE" "${PAYPAL_MODE:-live}"

ensure_secret "RAZORPAY_KEY_ID" "Razorpay Key ID"
ensure_secret "RAZORPAY_KEY_SECRET" "Razorpay Key Secret"
ensure_secret "RAZORPAY_WEBHOOK_SECRET" "Razorpay Webhook Secret"

echo -e "\n${GREEN}📌 Firebase Secrets:${NC}"
ensure_secret "FIREBASE_SERVICE_ACCOUNT_KEY" "Full service account JSON (paste the entire object)"
ensure_secret "FIREBASE_PROJECT_ID" "Firebase project ID"

echo -e "\n${GREEN}📌 Email Secrets:${NC}"
ensure_secret "RESEND_API_KEY" "Resend API key"
set_gh_secret "RESEND_FROM_EMAIL" "${RESEND_FROM_EMAIL:-onboarding@resend.dev}"

echo -e "\n${GREEN}📌 Security Secrets:${NC}"
ensure_secret "JWT_SECRET" "JWT signing secret (min 32 chars)"
ensure_secret "COOKIE_SECRET" "Cookie signing secret (min 32 chars)"

echo -e "\n${GREEN}📌 Deployment Secrets:${NC}"
ensure_secret "VERCEL_TOKEN" "Vercel access token (from vercel.com/account/tokens)"
ensure_secret "VERCEL_ORG_ID" "Vercel org ID (run: vercel whoami --json)"
ensure_secret "VERCEL_PROJECT_ID" "Vercel project ID (run: vercel link && cat .vercel/project.json)"

echo -e "\n${GREEN}📌 Application Config:${NC}"
ensure_secret "SERVER_URL" "Production URL (e.g. https://your-app.vercel.app)"

# ── Step 2: Vercel Project Link ───────────────────────────────────────────
echo -e "\n${GREEN}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Step 2: Vercel Project Setup                     ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════╝${NC}"

if command -v vercel &> /dev/null; then
  echo -e "${YELLOW}📦 Linking Vercel project...${NC}"
  vercel link --yes 2>/dev/null && echo -e "${GREEN}✅ Vercel project linked${NC}" || echo -e "${RED}❌ Vercel link failed — do it manually: vercel link${NC}"
else
  echo -e "${YELLOW}⚠️  Vercel CLI not found. Install: npm i -g vercel && vercel link${NC}"
fi

# ── Done ──────────────────────────────────────────────────────────────────
echo -e "\n${GREEN}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Setup Complete!                                  ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Next steps:"
echo -e "  1. Push to main to trigger CI/CD: ${YELLOW}git push origin main${NC}"
echo -e "  2. Check workflow status: ${YELLOW}gh run list${NC}"
echo -e "  3. Monitor Vercel deployment: ${YELLOW}vercel list${NC}"
echo ""
echo -e "${GREEN}🚀 Your Aigent.ai pipeline is ready!${NC}"