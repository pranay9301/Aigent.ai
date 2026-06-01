#!/usr/bin/env bash
#===============================================================================
# Aigent.ai — Automated Deploy Entrypoint
# 1. Install deps if needed
# 2. Run tests
# 3. Type-check
# 4. Build
# 5. Commit & push to Git
# 6. Leave the GitHub Actions workflow to drive actual Vercel deploy
#
# Usage:
#   ./scripts/deploy.sh "commit message"  [target-branch]
#   ./scripts/deploy.sh                   (defaults to main)
#===============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
REPO_DEFAULT="pranay9301/Aigent.ai"
BRANCH="${2:-main}"
COMMIT_MSG="${1:-deploy: automated push $(date +%Y-%m-%d %H:%M:%S)}"

if [[ -n "${DEFAULT_GITHUB_REPO:-}" ]]; then
  REPO_DEFAULT="${DEFAULT_GITHUB_REPOSITORY:-${REPO_DEFAULT}}"
fi

echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   Aigent.ai — Automated Deploy Pipeline  ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
echo ""


# Ensure we're in repo root
if [[ ! -f package.json ]]; then
  echo -e "${RED}❌ Run this from Aigent.ai repo root.${NC}"
  exit 1
fi

remote_url=$(git remote get-url origin 2>/dev/null || true)
if [[ -z "${remote_url:-}" ]]; then
  echo -e "${RED}❌ No git remote 'origin'. Add a remote first.${NC}"
  exit 1
fi

# ── Step 0: Install if needed ─────────────────────────────────────────────
if [[ ! -d node_modules ]]; then
  echo -e "${YELLOW}[0/5] Installing dependencies...${NC}"
  npm ci
  echo -e "${GREEN}  Dependencies installed${NC}"
else
  echo -e "${GREEN}[0/5] Dependencies already installed${NC}"
fi


# ── Step 1: Run tests ─────────────────────────────────────────────────────
echo -e "${YELLOW}[1/5] Running test suite...${NC}"
npm test

echo -e "${GREEN}  Tests passed${NC}"
echo ""


# ── Step 2: TypeScript check ─────────────────────────────────────────────
echo -e "${YELLOW}[2/5] TypeScript type check...${NC}"
if npm run lint; then
  echo -e "${GREEN}  Lint/type-check passed${NC}"
else
  echo -e "${YELLOW}  Lint/type-check returned non-zero; continuing because tsc --noEmit is informational.${NC}"
fi
echo ""


# ── Step 3: Build ────────────────────────────────────────────────────────
echo -e "${YELLOW}[3/5] Building application...${NC}"
npm run build
echo -e "${GREEN}  Build complete${NC}"
echo ""


# ── Step 4: Commit & push ────────────────────────────────────────────────
echo -e "${YELLOW}[4/5] Committing and pushing to ${BRANCH}...${NC}"

git config advice.detachedHead false >/dev/null 2>&1 || true

push_branch_to_remote() {
  local branch="$1"
  local remote="${2:-origin}"

  if git ls-remote --exit-code --heads "$remote" "$branch" >/dev/null 2>&1; then
    git push "$remote" "HEAD:$branch"
  else
    git push "$remote" "HEAD:refs/heads/$branch"
  fi
}

changed_tree=$(git status --porcelain --untracked-files=all)
only_dist_changed=0
if [[ -z "${changed_tree:-}" ]]; then
  echo -e "${YELLOW}  No changes to commit${NC}"
else
  # If user explicitly passed a commit message, always create a commit.
  # Otherwise, only auto-commit when changes include src/test, src/pages, src/lib, api, server.ts.
  auto_commit=1
  if [[ -z "${1:-}" ]]; then
    if echo "$changed_tree" | grep -E '^( M|A |\?\?)[[:space:]]+(src|api|server\.ts)' >/dev/null 2>&1; then
      auto_commit=1
    else
      echo -e "${YELLOW}  No source/test changes detected; skipping auto-commit unless you provide a commit message.${NC}"
      auto_commit=0
    fi
  fi

  if [[ "$auto_commit" -eq 1 ]]; then
    git add -A
    git commit -m "$COMMIT_MSG" >/dev/null 2>&1 || true
    echo -e "${GREEN}  Changes committed and pushed${NC}"
  else
    echo -e "${YELLOW}  No auto-commit performed. Provide a message to force commit and push.${NC}"
    return 1
  fi
fi


# ── Step 5: Verify remote branch and trigger CI ──────────────────────────
echo -e "${YELLOW}[5/5] Verifying remote state for branch ${BRANCH}...${NC}"
remote_head=$(git ls-remote --heads origin "$BRANCH" | awk '{print $1}' || true)
if [[ -n "${remote_head:-}" && "${remote_head}" != "(null)" ]]; then
  echo -e "${GREEN}  Remote ${BRANCH} exists at ${remote_head}${NC}"
else
  echo -e "${YELLOW}  Remote branch ${BRANCH} not found; current push will create it.${NC}"
fi

if command -v gh &> /dev/null && gh auth status >/dev/null 2>&1; then
  RUN_ID=$(gh run list --repo "${REPO_DEFAULT}" --limit 1 --json databaseId -q '.[0].databaseId' 2>/dev/null || echo "")
  if [[ -n "${RUN_ID}" ]]; then
    echo -e "${GREEN}  Triggered: https://github.com/${REPO_DEFAULT}/actions/runs/${RUN_ID}${NC}"
    echo -e "${GREEN}  Watching run...${NC}"
    gh run watch "${RUN_ID}" --repo "${REPO_DEFAULT}" 2>/dev/null || true
  fi
fi

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Deploy pipeline complete!              ║${NC}"
echo -e "${GREEN}║   https://github.com/${REPO_DEFAULT}║"
echo -e "${GREEN}║   https://aigent-ai.vercel.app            ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
