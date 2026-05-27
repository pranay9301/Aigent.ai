#!/usr/bin/env node

/**
 * Automated Vercel Deployment Script
 * Triggers deployment from GitHub commit and logs results
 */

import { exec } from 'child_process';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs/promises';

// Load environment variables
dotenv.config();

const CONFIG = {
  VERCEL_TOKEN: process.env.VERCEL_TOKEN,
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  DEFAULT_REPO: 'pranay9301/Aigent.ai',
  DEPLOY_LOG_PATH: path.join(process.cwd(), 'deployments.log'),
  MAX_LOG_ENTRIES: 100
};

/**
 * Log deployment events
 */
async function logDeploymentEvent(type, message, details = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = JSON.stringify({
    timestamp,
    type,
    message,
    ...details
  }, null, 2);

  try {
    // Read existing logs
    let logs = [];
    try {
      const fileContent = await fs.readFile(CONFIG.DEPLOY_LOG_PATH, 'utf-8');
      logs = fileContent.trim() ? JSON.parse(fileContent) : [];
    } catch {
      // File doesn't exist yet
    }

    // Add new entry and trim if needed
    logs.unshift(logEntry);
    if (logs.length > CONFIG.MAX_LOG_ENTRIES) {
      logs = logs.slice(0, CONFIG.MAX_LOG_ENTRIES);
    }

    // Write back
    await fs.writeFile(CONFIG.DEPLOY_LOG_PATH, JSON.stringify(logs, null, 2));
    console.log(`📝 [${timestamp}] ${type}: ${message}`);
  } catch (error) {
    console.error('❌ Failed to log deployment event:', error.message);
  }
}

/**
 * Get latest GitHub commit SHA
 */
async function getLatestCommitSha(repo = CONFIG.DEFAULT_REPO) {
  if (!CONFIG.GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN environment variable is required');
  }

  const [owner, repoName] = repo.split('/');
  const apiUrl = `https://api.github.com/repos/${owner}/${repoName}/commits/main`;

  const response = await fetch(apiUrl, {
    headers: {
      Authorization: `token ${CONFIG.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json'
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`GitHub API error: ${response.status} - ${errorData.message}`);
  }

  const commitData = await response.json();
  return commitData.sha;
}

/**
 * Trigger Vercel deployment
 */
async function triggerVercelDeployment(repo = CONFIG.DEFAULT_REPO, commitSha = 'main') {
  if (!CONFIG.VERCEL_TOKEN) {
    throw new Error('VERCEL_TOKEN environment variable is required');
  }

  const [owner, repoName] = repo.split('/');

  console.log(`🚀 Triggering Vercel deployment for ${repo}`);
  console.log(`🔖 Using commit: ${commitSha}`);

  const response = await fetch('https://api.vercel.com/v13/deployments', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CONFIG.VERCEL_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: repoName,
      gitSource: {
        type: 'github',
        repo: repo,
        ref: commitSha
      },
      env: {
        NODE_ENV: 'production',
        VERCEL_ENV: 'production'
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Vercel API error: ${response.status} - ${JSON.stringify(errorData)}`);
  }

  const deployment = await response.json();
  console.log(`✅ Vercel deployment triggered successfully`);
  console.log(`🔗 Deployment URL: https://${deployment.url}`);
  console.log(`📋 Deployment ID: ${deployment.id}`);

  return deployment;
}

/**
 * Monitor Vercel deployment status
 */
async function monitorDeploymentStatus(deploymentId, checkInterval = 10000) {
  if (!CONFIG.VERCEL_TOKEN) {
    throw new Error('VERCEL_TOKEN environment variable is required');
  }

  console.log(`⌛ Monitoring deployment status (checking every ${checkInterval/1000}s)...`);

  while (true) {
    const response = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
      headers: {
        Authorization: `Bearer ${CONFIG.VERCEL_TOKEN}`,
      }
    });

    const deployment = await response.json();

    switch (deployment.status) {
      case 'BUILDING':
        console.log('🏗️  Deployment is building...');
        break;
      case 'QUEUED':
        console.log('⚙️  Deployment is queued...');
        break;
      case 'READY':
        console.log('✅ Deployment is ready!');
        console.log(`🔗 Final URL: https://${deployment.url}`);
        return deployment;
      case 'ERROR':
        console.error('❌ Deployment failed!');
        console.error(`📋 Error details: ${JSON.stringify(deployment.meta, null, 2)}`);
        throw new Error('Vercel deployment failed');
      default:
        console.log(`ℹ️  Deployment status: ${deployment.status}`);
    }

    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }
}

/**
 * Main deployment workflow
 */
async function runDeploymentWorkflow() {
  try {
    console.log('🚀 Starting Vercel Deployment Workflow\n');

    // Validate credentials
    if (!CONFIG.VERCEL_TOKEN) {
      throw new Error('VERCEL_TOKEN is not configured in environment variables');
    }

    // Get latest commit
    const commitSha = await getLatestCommitSha();
    await logDeploymentEvent('info', 'Retrieved latest commit', { commitSha });

    // Trigger deployment
    const deployment = await triggerVercelDeployment(CONFIG.DEFAULT_REPO, commitSha);
    await logDeploymentEvent('success', 'Deployment triggered', {
      deploymentId: deployment.id,
      url: `https://${deployment.url}`
    });

    // Monitor deployment
    const finalDeployment = await monitorDeploymentStatus(deployment.id);
    await logDeploymentEvent('success', 'Deployment completed successfully', {
      deploymentId: finalDeployment.id,
      finalUrl: `https://${finalDeployment.url}`,
      status: finalDeployment.status
    });

    console.log('\n🎉 ALL DEPLOYMENT STEPS COMPLETED SUCCESSFULLY!');
    console.log(`📋 Final Deployment Details:`);
    console.log(`   - ID: ${finalDeployment.id}`);
    console.log(`   - URL: https://${finalDeployment.url}`);
    console.log(`   - Status: ${finalDeployment.status}`);
    console.log(`   - Created: ${new Date(finalDeployment.createdAt).toLocaleString()}`);

    return finalDeployment;

  } catch (error) {
    await logDeploymentEvent('error', 'Deployment failed', {
      error: error.message,
      stack: error.stack
    });
    console.error('\n💥 DEPLOYMENT FAILED:', error.message);
    throw error;
  }
}

/**
 * Create GitHub webhook listener for auto-deployments
 */
async function createWebhookListener() {
  console.log('\n🔧 Setting up GitHub webhook listener for auto-deployments...');

  // This would be implemented as a separate service in production
  // For now, we'll just provide instructions
  console.log('ℹ️  Webhook listener would run on port 3001 and listen for:');
  console.log('   - GitHub push events');
  console.log('   - Repository dispatch events');
  console.log('   - PR merge events');

  console.log('\n📋 To implement auto-deployments:');
  console.log('1. Create a GitHub webhook pointing to your server:');
  console.log('   - Payload URL: https://your-server.com/api/github-webhook');
  console.log('   - Content type: application/json');
  console.log('   - Secret: your-webhook-secret');
  console.log('   - Events: Just the "Push" event');

  console.log('\n2. Add this endpoint to your server.ts:');
  console.log(`app.post('/api/github-webhook', async (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  const payload = req.body;

  // Verify webhook signature
  if (!signature) return res.status(403).send('Missing signature');

  // Implement webhook payload processing
  if (payload.ref === 'refs/heads/main') {
    console.log('📢 Main branch pushed - triggering deployment');
    await runDeploymentWorkflow();
  }

  res.status(200).send('Webhook received');
});`);
}

// Run workflow when script is executed directly
if (require.main === module) {
  console.log('🔧 Checking environment configuration...');

  // Check for required environment variables
  const missingEnvVars = [];
  if (!CONFIG.VERCEL_TOKEN) missingEnvVars.push('VERCEL_TOKEN');
  if (!CONFIG.GITHUB_TOKEN) missingEnvVars.push('GITHUB_TOKEN');

  if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingEnvVars.forEach(varName => console.error(`   - ${varName}`));
    console.log('\n📋 Create a .env.local file with:');
    console.log('VERCEL_TOKEN=your_vercel_token_here');
    console.log('GITHUB_TOKEN=your_github_token_here');
    process.exit(1);
  }

  runDeploymentWorkflow()
    .then(() => createWebhookListener())
    .catch(error => {
      console.error('💥 Deployment workflow failed:', error.message);
      process.exit(1);
    });
}