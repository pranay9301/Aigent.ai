#!/usr/bin/env node
/**
 * Legacy manual deployment trigger.
 *
 * Preferred: use `./scripts/deploy.sh` so CI/CD controls Vercel deployment.
 * This script only exists for one-off direct pushes when needed.
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';

const TOKEN = process.env.VERCEL_TOKEN;
const REPO = process.argv[2] || 'pranay9301/Aigent.ai';
const [owner, repoName] = REPO.split('/');

if (!TOKEN) {
  console.error('Missing VERCEL_TOKEN');
  process.exit(1);
}

const target = `https://api.vercel.com/v13/deployments`;

const body = {
  name: repoName,
  gitSource: {
    type: 'github',
    repo: REPO,
    ref: 'main'
  }
};

const res = await fetch(target, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${TOKEN}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(body)
});

const text = await res.text();
const data = JSON.parse(text);
console.log(JSON.stringify({ res, deployment: data }, null, 2));

// Best-effort git push for audit
try {
  fs.writeFileSync('/tmp/git_push_log.txt', 'Skipped: git operations are handled by deploy.sh.');
} catch {}