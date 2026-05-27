#!/usr/bin/env node

/**
 * Automated Vercel Deployment Script
 * Triggers deployment from GitHub commit and logs results
 */

import { exec } from 'child_process';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: '.env.local' });

const GITHUB_REPO = 'pranay9301/Aigent.ai';
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

async function runCommand(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(`Error: ${error.message}\nStderr: ${stderr}`);
        return;
      }
      resolve(stdout.trim());
    });
  });
}

async function checkGitStatus() {
  console.log('🔍 Checking Git Status...');

  const status = await runCommand('git status --porcelain');
  if (status) {
    console.log('📝 Uncommitted changes detected:');
    console.log(status);

    const commitMsg = await prompt('Enter commit message for deployment: ');
    await runCommand(`git add .`);
    await runCommand(`git commit -m "${commitMsg}"`);
    await runCommand(`git push origin main`);

    console.log('✅ Changes committed and pushed to GitHub');
  } else {
    console.log('✅ No uncommitted changes - using latest commit');
    await runCommand(`git pull origin main`);
  }
}

async function triggerVercelDeployment() {
  console.log('\n🚀 Triggering Vercel Deployment...');

  const deployRes = await fetch('https://api.vercel.com/v13/deployments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: `Aigent.ai Deployment - ${new Date().toISOString().slice(0,10)}`,
      gitSource: {
        type: 'github',
        repo: GITHUB_REPO,
        ref: 'main'
      },
      env: {
        NODE_ENV: 'production',
        VERCEL_ENV: 'production'
      }
    })
  });

  if (!deployRes.ok) {
    const errorData = await deployRes.json();
    throw new Error(`Vercel API Error: ${JSON.stringify(errorData)}`);
  }

  const deployData = await deployRes.json();
  console.log(`✅ Vercel Deployment Triggered:`);
  console.log(`   - Deployment ID: ${deployData.id}`);
  console.log(`   - URL: https://${deployData.url}`);
  console.log(`   - Status: ${deployData.status}`);

  return deployData;
}

async function logDeploymentToFirestore(deployData) {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    console.log('⚠️  Firestore logging skipped - no credentials');
    return;
  }

  try {
    const adminSdk = await import('firebase-admin');
    if (!adminSdk.apps.length) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      adminSdk.initializeApp({
        credential: adminSdk.credential.cert(serviceAccount)
      });
    }

    const db = adminSdk.firestore();
    await db.collection('deploys').add({
      target: 'vercel',
      repo: GITHUB_REPO,
      status: 'triggered',
      url: `https://${deployData.url}`,
      deploymentId: deployData.id,
      createdAt: new Date().toISOString(),
      metadata: {
        vercel: {
          id: deployData.id,
          url: deployData.url,
          status: deployData.status
        }
      }
    });

    console.log('✅ Deployment logged to Firestore');
  } catch (error) {
    console.error('❌ Firestore logging failed:', error.message);
  }
}

async function monitorDeployment(deploymentId) {
  console.log('\n📊 Monitoring Deployment Status...');

  const checkStatus = async () => {
    const statusRes = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
      headers: { 'Authorization': `Bearer ${VERCEL_TOKEN}` }
    });

    const statusData = await statusRes.json();

    if (statusData.status === 'SUCCESS') {
      console.log(`✅ Deployment SUCCESSFUL!`);
      console.log(`   - Production URL: https://${statusData.url}`);
      return;
    } else if (statusData.status === 'FAILED' || statusData.status === 'ERROR') {
      console.error(`❌ Deployment FAILED:`);
      console.error(`   - Error: ${statusData.error.message}`);
      console.error(`   - Logs: https://vercel.com/${GITHUB_REPO.split('/')[0]}/${GITHUB_REPO.split('/')[1]}/deployments/${deploymentId}`);
      return;
    } else {
      console.log(`⌛ Deployment in progress: ${statusData.status}`);
      setTimeout(checkStatus, 10000);
    }
  };

  await checkStatus();
}

async function main() {
  if (!VERCEL_TOKEN) {
    throw new Error('❌ VERCEL_TOKEN not found in .env.local');
  }

  try {
    console.log('🔧 Aigent.ai Vercel Deployment Pipeline');
    console.log('=======================================');

    await checkGitStatus();
    const deployData = await triggerVercelDeployment();
    await logDeploymentToFirestore(deployData);
    await monitorDeployment(deployData.id);

    console.log('\n🎉 Deployment Pipeline Completed Successfully!');
    console.log('🚀 Your Aigent.ai application is now live!');

  } catch (error) {
    console.error('❌ Deployment Pipeline Failed:', error);
    process.exit(1);
  }
}

// Helper for user input
function prompt(question) {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    readline.question(question, ans => {
      readline.close();
      resolve(ans);
    });
  });
}

if (require.main === module) {
  main();
}