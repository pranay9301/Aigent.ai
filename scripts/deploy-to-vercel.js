#!/usr/bin/env node

/**
 * Automated Vercel Deployment Script
 * Pushes current state → GitHub → triggers Vercel deploy via API.
 *
 * Usage:
 *   node scripts/deploy-to-vercel.js
 *   node scripts/deploy-to-vercel.js "commit message"
 */

import { execSync } from "child_process";
import { readFileSync } from "fs";
import { createInterface } from "readline";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const GITHUB_REPO = "pranay9301/Aigent.ai";
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

function run(cmd) {
  return execSync(cmd, { encoding: "utf-8" }).trim();
}

function prompt(query) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(query, (a) => { rl.close(); resolve(a); }));
}

async function checkGitStatus() {
  console.log(" Checking Git Status...");

  const status = run("git status --porcelain");
  if (status) {
    console.log(" Uncommitted changes detected:");
    console.log(status);

    const msg = process.argv[2] || await prompt("Enter commit message: ");
    execSync("git add .", { stdio: "inherit" });
    execSync(`git commit -m "${msg.replace(/"/g, '\\"')}"`, { stdio: "inherit" });
    execSync("git push origin main", { stdio: "inherit" });
    console.log(" Changes committed and pushed to GitHub");
  } else {
    console.log(" No uncommitted changes — using latest commit");
    execSync("git pull origin main", { stdio: "inherit" });
  }
}

async function triggerVercelDeployment() {
  if (!VERCEL_TOKEN) throw new Error("VERCEL_TOKEN not found in .env.local");

  console.log("\n Triggering Vercel Deployment...");

  const res = await fetch("https://api.vercel.com/v13/deployments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${VERCEL_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: `Aigent.ai-${new Date().toISOString().slice(0, 10)}`,
      gitSource: { type: "github", repo: GITHUB_REPO, ref: "main" },
      env: { NODE_ENV: "production", VERCEL_ENV: "production" },
    }),
  });

  if (!res.ok) throw new Error(`Vercel API Error: ${JSON.stringify(await res.json())}`);

  const data = await res.json();
  console.log(`   ID: ${data.id}`);
  console.log(`   URL: https://${data.url}`);
  console.log(`   Status: ${data.status}`);
  return data;
}

async function monitorDeployment(id) {
  if (!VERCEL_TOKEN) return;

  console.log("\n Monitoring deployment...");
  const maxAttempts = 60;

  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(`https://api.vercel.com/v13/deployments/${id}`, {
      headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
    });
    const data = await res.json();

    if (data.status === "SUCCESS") {
      console.log(`  SUCCESS: https://${data.url}`);
      return data;
    }
    if (["FAILED", "ERROR"].includes(data.status)) {
      throw new Error(`Deployment ${data.status}: ${data.error?.message || "unknown"}`);
    }

    process.stdout.write(".");
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error("Deployment timed out");
}

async function main() {
  console.log(" Aigent.ai Vercel Deployment Pipeline");
  console.log("=======================================\n");

  await checkGitStatus();
  const deploy = await triggerVercelDeployment();
  await monitorDeployment(deploy.id);

  console.log("\n Deployment completed successfully!");
  console.log(` Production URL: https://${deploy.url}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("\n Deployment failed:", err.message);
  process.exit(1);
});