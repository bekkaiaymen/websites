#!/usr/bin/env node

/**
 * Deployment Verification Script
 * التحقق من نجاح النشر على جميع المنصات
 * 
 * الاستخدام: node verify-deployment.js
 */

const https = require('https');
const http = require('http');

// ANSI Colors for terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`  ${title}`, 'bold');
  log(`${'='.repeat(60)}\n`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Function to make HTTP/HTTPS requests
function checkURL(url, name) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const request = protocol.get(url, { timeout: 5000 }, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        const success = response.statusCode >= 200 && response.statusCode < 400;
        resolve({
          name,
          url,
          statusCode: response.statusCode,
          headers: response.headers,
          data,
          success,
        });
      });
    }).on('error', (error) => {
      resolve({
        name,
        url,
        error: error.message,
        success: false,
      });
    });

    request.setTimeout(5000, () => {
      request.destroy();
      resolve({
        name,
        url,
        error: 'Request timeout after 5 seconds',
        success: false,
      });
    });
  });
}

// Main verification function
async function verifyDeployment() {
  logHeader('🚀 Deployment Verification Script');
  
  log('This script verifies that all three parts of your Ali-Baba deployment are working correctly.', 'blue');
  log('Press CTRL+C to stop.\n', 'blue');

  // Configuration - UPDATE THESE URLs
  const deploymentConfig = {
    backend: {
      name: 'Backend API (Render)',
      url: 'https://ali-baba-api.onrender.com',
      healthCheck: 'https://ali-baba-api.onrender.com/api/health',
    },
    erpDashboard: {
      name: 'ERP Dashboard (Vercel)',
      url: 'https://alibaba-erp.vercel.app',
      healthCheck: 'https://alibaba-erp.vercel.app',
    },
    storefront: {
      name: 'Storefront (Vercel)',
      url: 'https://alibaba-store.vercel.app',
      healthCheck: 'https://alibaba-store.vercel.app',
    },
  };

  log('Configuration URLs:', 'cyan');
  Object.entries(deploymentConfig).forEach(([key, config]) => {
    logInfo(`${config.name}: ${config.url}`);
  });

  log('\n⏳ Checking deployments...\n', 'yellow');

  // Check Backend
  logHeader('1️⃣  Backend API (Render)');
  let backendResult = await checkURL(deploymentConfig.backend.url, deploymentConfig.backend.name);
  
  if (backendResult.success) {
    logSuccess(`Backend is responding (${backendResult.statusCode})`);
    logInfo(`Response headers: ${JSON.stringify(backendResult.headers, null, 2).substring(0, 200)}...`);
  } else {
    logError(`Backend is not responding: ${backendResult.error}`);
    logWarning('Make sure the Render service is running and the URL is correct');
  }

  // Check Health endpoint
  let healthResult = await checkURL(deploymentConfig.backend.healthCheck, 'Health Check');
  if (healthResult.success) {
    logSuccess(`Health check endpoint is responding (${healthResult.statusCode})`);
    if (healthResult.data.length > 0) {
      logInfo(`Response: ${healthResult.data.substring(0, 100)}...`);
    }
  } else {
    logWarning(`Health check endpoint is not responding: ${healthResult.error}`);
  }

  // Check ERP Dashboard
  logHeader('2️⃣  ERP Dashboard (Vercel)');
  let erpResult = await checkURL(deploymentConfig.erpDashboard.url, deploymentConfig.erpDashboard.name);
  
  if (erpResult.success) {
    logSuccess(`ERP Dashboard is responding (${erpResult.statusCode})`);
    if (erpResult.data.includes('<!DOCTYPE') || erpResult.data.includes('<html')) {
      logSuccess('HTML page loaded successfully');
    }
  } else {
    logError(`ERP Dashboard is not responding: ${erpResult.error}`);
    logWarning('Make sure Vercel deployment is complete and URL is correct');
  }

  // Check Storefront
  logHeader('3️⃣  Storefront (Vercel)');
  let storeResult = await checkURL(deploymentConfig.storefront.url, deploymentConfig.storefront.name);
  
  if (storeResult.success) {
    logSuccess(`Storefront is responding (${storeResult.statusCode})`);
    if (storeResult.data.includes('<!DOCTYPE') || storeResult.data.includes('<html')) {
      logSuccess('HTML page loaded successfully');
    }
  } else {
    logError(`Storefront is not responding: ${storeResult.error}`);
    logWarning('Make sure Vercel deployment is complete and URL is correct');
  }

  // Summary
  logHeader('📊 Summary');
  
  const results = [
    { name: 'Backend API', result: backendResult },
    { name: 'ERP Dashboard', result: erpResult },
    { name: 'Storefront', result: storeResult },
  ];

  const allHealthy = results.every(r => r.result.success);
  
  results.forEach(({ name, result }) => {
    if (result.success) {
      logSuccess(`${name}: ✅ Operational`);
    } else {
      logError(`${name}: ❌ Not responding`);
    }
  });

  if (allHealthy) {
    log('\n🎉 All deployments are working correctly!\n', 'green');
    log('Your Ali-Baba application is ready for production use.', 'cyan');
  } else {
    log('\n⚠️  Some deployments are not responding.\n', 'yellow');
    log('Please check the following:', 'cyan');
    log('1. Update the URLs in this script to match your actual deployment URLs', 'cyan');
    log('2. Ensure all services are deployed and running', 'cyan');
    log('3. Check the deployment logs for errors', 'cyan');
    log('4. Verify environment variables are correctly set', 'cyan');
  }

  // Additional checks
  logHeader('🔍 Additional Checks');
  
  log('Manual checks you should perform:', 'cyan');
  log('1. Backend API:', 'bold');
  log('   - Visit: https://ali-baba-api.onrender.com/', 'reset');
  log('   - You should see: "Ali Baba Chocolate API is running 🍫"\n', 'reset');
  
  log('2. ERP Dashboard:', 'bold');
  log('   - Visit: https://alibaba-erp.vercel.app', 'reset');
  log('   - Try logging in with your credentials\n', 'reset');
  
  log('3. Storefront:', 'bold');
  log('   - Visit: https://alibaba-store.vercel.app', 'reset');
  log('   - Check if products load correctly\n', 'reset');

  log('4. API Connection:', 'bold');
  log('   - Open browser DevTools (F12) → Console tab', 'reset');
  log('   - Check for CORS errors or failed API calls\n', 'reset');

  // Environment variables check
  logHeader('🔐 Environment Variables');
  
  log('Render Backend should have:', 'cyan');
  log('  - MONGODB_URI (MongoDB connection string)', 'blue');
  log('  - JWT_SECRET (secret key for tokens)', 'blue');
  log('  - NODE_ENV=production', 'blue');
  log('  - USD_BUY_RATE, USD_SELL_RATE (exchange rates)', 'blue');
  log('  - SHOPIFY_WEBHOOK_SECRET (if using Shopify)', 'blue');

  log('\nVercel ERP & Storefront should have:', 'cyan');
  log('  - VITE_API_URL (pointing to your Render backend)', 'blue');

  log('\nTo verify environment variables:', 'cyan');
  log('  Render: Dashboard → Select Service → Settings → Environment', 'blue');
  log('  Vercel: Dashboard → Select Project → Settings → Environment Variables\n', 'blue');

  // Final message
  logHeader('✅ Verification Complete');
  
  if (allHealthy) {
    log('Status: All systems operational! 🚀\n', 'green');
  } else {
    log('Status: Some issues detected. Review the checks above. ⚠️\n', 'yellow');
  }

  log('For more help, check:', 'cyan');
  log('  - LIVE_DEPLOYMENT_GUIDE.md', 'blue');
  log('  - ENV_VARIABLES_CHECKLIST.md', 'blue');
  log('  - Render logs: https://render.com', 'blue');
  log('  - Vercel logs: https://vercel.com\n', 'blue');

  // Exit with appropriate code
  process.exit(allHealthy ? 0 : 1);
}

// Run verification
verifyDeployment().catch((error) => {
  logError(`Fatal error: ${error.message}`);
  process.exit(1);
});
