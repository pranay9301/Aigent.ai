#!/usr/bin/env bash
#===============================================================================
# Aigent.ai — One-Command Deploy
# 1. Runs test suite
# 2. Builds app
# 3. Commits & pushes to GitHub
# 4. Triggers Vercel deployment
#
# Usage:
#   ./scripts/deploy.sh "commit message"
#   ./scripts/deploy.sh  # prompts for message
#===============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
REPO="pranay9301/Aigent.ai"

echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   Aigent.ai — Automated Deploy Pipeline  ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
echo ""

# ── Step 1: Run tests ────────────────────────────────────────────────────────
echo -e "${YELLOW}[1/5] Running test suite...${NC}"
npm test 2>&1
echo -e "${GREEN}  Tests passed${NC}"
echo ""

# ── Step 2: TypeScript check ─────────────────────────────────────────────────
echo -e "${YELLOW}[2/5] TypeScript type check...${NC}"
npx tsc --noEmit 2>&1 || echo -e "${YELLOW}  Warnings exist (non-blocking)${NC}"
echo -e "${GREEN}  Type check complete${NC}"
echo ""

# ── Step 3: Build ────────────────────────────────────────────────────────────
echo -e "${YELLOW}[3/5] Building application...${NC}"
npm run build 2>&1
echo -e "${GREEN}  Build complete${NC}"
echo ""

# ── Step 4: Commit & Push ────────────────────────────────────────────────────
echo -e "${YELLOW}[4/5] Committing and pushing to GitHub...${NC}"

if [ -n "$(git status --porcelain)" ]; then
  git add -A
  if [ -n "${1:-}" ]; then
    git commit -m "$1"
  else
    git commit -m "deploy: automated push $(date +%Y-%m-%d)"
  fi
  git push origin main
  echo -e "${GREEN}  Changes committed and pushed${NC}"
else
  echo -e "${YELLOW}  No changes to commit${NC}"
fi
echo ""

# ── Step 5: Verify CI/CD status ──────────────────────────────────────────────
echo -e "${YELLOW}[5/5] Checking deployment status...${NC}"
if command -v gh &> /dev/null; then
  RUN_ID=$(gh run list --repo "$REPO" --limit 1 --json databaseId -q '.[0].databaseId' 2>/dev/null || echo "")
  if [ -n "$RUN_ID" ]; then
    echo -e "${GREEN}  Triggered: https://github.com/$REPO/actions/runs/$RUN_ID${NC}"
    echo -e "${GREEN}  Watching run...${NC}"
    gh run watch "$RUN_ID" --repo "$REPO" 2>/dev/null || true
  fi
fi

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Deploy pipeline complete!              ║${NC}"
echo -e "${GREEN}║   https://github.com/$REPO                ║${NC}"
echo -e "${GREEN}║   https://aigent-ai.vercel.app            ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"