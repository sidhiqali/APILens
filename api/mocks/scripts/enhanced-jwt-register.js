#!/usr/bin/env node

/**
 * APILens Enhanced Demo API Registration Script
 * Registers comprehensive demo APIs with JWT authentication.
 */

const axios = require('axios');

const APILENS_BASE = process.env.APILENS_BASE || 'http://localhost:3000';

const USER_CREDENTIALS = {
  email: process.env.APILENS_EMAIL || 'admin@example.com',
  password: process.env.APILENS_PASSWORD || 'password'
};

let JWT_TOKEN = '';

const enhancedAPIs = [
  {
    apiName: 'User Management API',
    openApiUrl: 'https://petstore.swagger.io/v2/swagger.json',
    type: 'Identity & Access',
    tags: ['users', 'authentication', 'security', 'critical'],
    checkFrequency: '30s',
    description: 'Enterprise user authentication with security breach detection'
  },
    type: 'Identity & Access',
    tags: ['users', 'authentication', 'security', 'critical'],
    checkFrequency: '30s',
    description: 'Enterprise user authentication with security breach detection'
  },
  {
    apiName: 'Order Processing API',
    openApiUrl: 'https://petstore.swagger.io/v2/swagger.json',
    type: 'E-commerce',
    tags: ['orders', 'fulfillment', 'inventory', 'major'],
    checkFrequency: '1m',
    description: 'E-commerce order system with fulfillment delays and inventory issues'
  },
  {
    apiName: 'Weather Data API',
    openApiUrl: 'https://jsonplaceholder.typicode.com/posts', // Working JSON API
    type: 'External Data',
    tags: ['weather', 'forecasting', 'data-quality', 'minor'],
    checkFrequency: '1m',
    description: 'Meteorological service experiencing data source outages'
  },
  {
    apiName: 'Payment Gateway API',
    openApiUrl: 'https://petstore.swagger.io/v2/swagger.json',
    type: 'Financial Services',
    tags: ['payments', 'fraud-detection', 'compliance', 'critical'],
    checkFrequency: '30s',
    description: 'Financial transaction processing with fraud detection overload'
  },
  {
    apiName: 'Inventory Management API',
    openApiUrl: 'https://petstore.swagger.io/v2/swagger.json',
    type: 'Supply Chain',
    tags: ['inventory', 'warehouse', 'automation', 'major'],
    checkFrequency: '1m',
    description: 'Warehouse inventory system with stock discrepancies'
  },
  {
    apiName: 'Notification Service API',
    openApiUrl: 'https://petstore.swagger.io/v2/swagger.json',
    type: 'Communication',
    tags: ['notifications', 'real-time', 'delivery', 'major'],
    checkFrequency: '30s',
    description: 'Real-time notification system with delivery failures'
  },
  {
    apiName: 'Real-time Chat API',
    openApiUrl: 'https://petstore.swagger.io/v2/swagger.json',
    type: 'Communication',
    tags: ['chat', 'websocket', 'real-time', 'critical'],
    checkFrequency: '30s',
    description: 'WebSocket messaging with connection storms and memory leaks'
  },
  {
    apiName: 'File Storage API',
    openApiUrl: 'https://petstore.swagger.io/v2/swagger.json',
    type: 'Infrastructure',
    tags: ['storage', 'files', 'backup', 'major'],
    checkFrequency: '1m',
    description: 'Cloud storage service with quota exceeded and corruption issues'
  },
  {
    apiName: 'Machine Learning Platform API',
    openApiUrl: 'https://petstore.swagger.io/v2/swagger.json',
    type: 'AI & Machine Learning',
    tags: ['ml', 'ai', 'gpu', 'model-drift', 'critical'],
    checkFrequency: '30s',
    description: 'ML infrastructure with model drift and GPU resource exhaustion'
  },
  {
    apiName: 'Video Streaming API',
    openApiUrl: 'https://petstore.swagger.io/v2/swagger.json',
    type: 'Media & Content',
    tags: ['video', 'streaming', 'cdn', 'buffering', 'major'],
    checkFrequency: '30s',
    description: 'Media streaming platform with CDN failures and buffering issues'
  },
  {
    apiName: 'IoT Device Management API',
    openApiUrl: 'https://petstore.swagger.io/v2/swagger.json',
    type: 'Internet of Things',
    tags: ['iot', 'devices', 'connectivity', 'telemetry', 'critical'],
    checkFrequency: '30s',
    description: 'IoT platform experiencing massive device disconnections'
  },
  {
    apiName: 'Blockchain API',
    openApiUrl: 'https://petstore.swagger.io/v2/swagger.json',
    type: 'Blockchain & Web3',
    tags: ['blockchain', 'consensus', 'smart-contracts', 'major'],
    checkFrequency: '1m',
    description: 'Blockchain network with consensus failures and smart contract issues'
  },
  {
    apiName: 'Email Service API',
    openApiUrl: 'https://petstore.swagger.io/v2/swagger.json',
    type: 'Communication',
    tags: ['email', 'delivery', 'spam-detection', 'blacklist', 'major'],
    checkFrequency: '1m',
    description: 'Email delivery system with spam detection overload'
  },
  {
    apiName: 'Search Engine API',
    openApiUrl: 'https://petstore.swagger.io/v2/swagger.json',
    type: 'Data & Analytics',
    tags: ['search', 'elasticsearch', 'indexing', 'performance', 'major'],
    checkFrequency: '1m',
    description: 'Search service with index corruption and query performance issues'
  },
  {
    apiName: 'Database API',
    openApiUrl: 'https://petstore.swagger.io/v2/swagger.json',
    type: 'Data & Storage',
    tags: ['database', 'replication', 'performance', 'connections', 'critical'],
    checkFrequency: '30s',
    description: 'Database service with connection pool exhaustion and replication lag'
  },
  {
    apiName: 'Analytics Dashboard API',
    openApiUrl: 'https://petstore.swagger.io/v2/swagger.json',
    type: 'Analytics & BI',
    tags: ['analytics', 'dashboard', 'etl', 'data-pipeline', 'major'],
    checkFrequency: '1m',
    description: 'Business intelligence dashboard with data pipeline failures'
  },
  {
    apiName: 'API Gateway',
    openApiUrl: 'https://petstore.swagger.io/v2/swagger.json',
    type: 'Infrastructure',
    tags: ['gateway', 'rate-limiting', 'routing', 'load-balancer', 'critical'],
    checkFrequency: '30s',
    description: 'Central API gateway with rate limiting and routing failures'
  },
  {
    apiName: 'Audit & Compliance API',
    openApiUrl: 'https://petstore.swagger.io/v2/swagger.json',
    type: 'Security & Compliance',
    tags: ['audit', 'compliance', 'security', 'violations', 'critical'],
    checkFrequency: '30s',
    description: 'Security audit system with compliance violations detected'
  }
];

async function loginAndGetToken() {
  try {
    console.log('🔐 Authenticating with your credentials...');
    console.log(`   📧 Email: ${USER_CREDENTIALS.email}`);
    
    const response = await axios.post(`${APILENS_BASE}/auth/login`, USER_CREDENTIALS, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.data.token) {
      JWT_TOKEN = response.data.token;
      console.log('✅ Successfully authenticated!');
      console.log(`   🎫 JWT Token: ${JWT_TOKEN.substring(0, 20)}...`);
      console.log(`   👤 User: ${response.data.user.email}`);
      console.log('');
      return true;
    } else {
      console.error('❌ No access token in response');
      return false;
    }
  } catch (error) {
    console.error('❌ Authentication failed:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Error: ${error.response.data?.message || error.response.data}`);
    } else {
      console.error(`   Error: ${error.message}`);
    }
    return false;
  }
}

async function registerAPIWithAxios(api) {
  try {
    console.log(`📝 Registering ${api.apiName}...`);
    
    // Create the payload
    const payload = {
      apiName: api.apiName,
      openApiUrl: api.openApiUrl,
      type: api.type,
      tags: api.tags,
      checkFrequency: api.checkFrequency,
      description: api.description
    };

    // Make the API call with axios instead of cURL
    const response = await axios.post(`${APILENS_BASE}/apis`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`
      },
      timeout: 30000 // 30 second timeout
    });

    console.log(`   ✅ Successfully registered!`);
    console.log(`   🆔 API ID: ${response.data.id || response.data._id}`);
    console.log(`   🔍 Type: ${api.type}`);
    console.log(`   ⏱️  Check Frequency: ${api.checkFrequency}`);
    console.log(`   🏷️  Tags: ${api.tags.join(', ')}`);
    console.log(`   📊 Health Status: ${response.data.healthStatus}`);
    console.log('');

    return response.data;

  } catch (error) {
    console.error(`   ❌ Failed to register ${api.apiName}:`);
    
    if (error.response) {
      console.error(`   📡 HTTP Status: ${error.response.status}`);
      console.error(`   💬 Error: ${error.response.data?.message || JSON.stringify(error.response.data)}`);
    } else if (error.code === 'ECONNREFUSED') {
      console.error(`   � Error: Connection refused - is APILens running?`);
    } else if (error.code === 'ETIMEDOUT') {
      console.error(`   💬 Error: Request timeout - server may be overloaded`);
    } else {
      console.error(`   💬 Error: ${error.message}`);
    }
    console.log('');
    return null;
  }
}

async function checkAPILensConnection() {
  try {
    const response = await axios.get(`${APILENS_BASE}/health`, { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    try {
      const response = await axios.get(`${APILENS_BASE}`, { timeout: 5000 });
      return response.status === 200;
    } catch (error2) {
      return false;
    }
  }
}

async function main() {
  console.log('🚀 APILens Enhanced Demo - JWT Registration');
  console.log('============================================');
  console.log(`📡 APILens Backend: ${APILENS_BASE}`);
  console.log(`📊 Total APIs to register: ${enhancedAPIs.length}`);
  console.log('');

  // Check APILens connection
  console.log('🔍 Checking APILens backend connection...');
  const isConnected = await checkAPILensConnection();
  
  if (!isConnected) {
    console.error('❌ Cannot connect to APILens backend');
    console.error(`   Make sure APILens is running on ${APILENS_BASE}`);
    console.error('   Try: cd api && npm run dev');
    process.exit(1);
  }

  console.log('✅ APILens backend is responding');
  console.log('');

  // Authenticate
  const authenticated = await loginAndGetToken();
  if (!authenticated) {
    console.error('❌ Cannot proceed without authentication');
    console.error('   Please check your credentials and try again');
    process.exit(1);
  }

  // Register APIs
  console.log('📝 Registering APIs using JWT authentication...');
  console.log('');

  const results = [];
  for (const api of enhancedAPIs) {
    const result = await registerAPIWithAxios(api);
    results.push({ 
      api: api.apiName, 
      success: !!result, 
      data: result 
    });
    
    // Small delay between registrations
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('');
  console.log('📊 Registration Summary');
  console.log('=======================');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`✅ Successfully registered: ${successful.length}/${enhancedAPIs.length} APIs`);
  
  if (failed.length > 0) {
    console.log(`❌ Failed registrations: ${failed.length}/${enhancedAPIs.length}`);
    console.log('   Failed APIs:');
    failed.forEach(f => console.log(`   • ${f.api}`));
  }

  console.log('');

  if (successful.length === enhancedAPIs.length) {
    console.log('🎉 All APIs registered successfully in database!');
    console.log('');
    console.log('🎯 Next Steps:');
    console.log('   1. Start enhanced mock servers:');
    console.log('      node orchestrator/enhanced-start-mocks.js');
    console.log('');
    console.log('   2. Open APILens dashboard:');
    console.log(`      ${APILENS_BASE}`);
    console.log('');
    console.log('   3. You should see all 18 APIs in your dashboard');
    console.log('   4. APIs will start monitoring automatically');
    console.log('   5. Perfect for university presentation!');
    console.log('');
    console.log('📱 Registered APIs:');
    successful.forEach((result, index) => {
      console.log(`   ${(index + 1).toString().padStart(2)}. ${result.api}`);
    });
  } else if (successful.length > 0) {
    console.log(`🎯 Partial success: ${successful.length} APIs registered`);
    console.log('   You can proceed with the available APIs');
    console.log('   Or retry the failed ones later');
  } else {
    console.log('❌ No APIs were registered successfully');
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('   1. Verify your credentials are correct');
    console.log('   2. Check APILens backend logs for errors');
    console.log('   3. Ensure database connection is working');
    console.log('   4. Try registering one API manually through the UI');
  }
}

// Handle CLI arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
APILens Enhanced Demo - JWT Registration

This script authenticates with your real credentials and uses cURL to 
properly register all 18 APIs in the APILens database.

Usage:
  node enhanced-jwt-register.js

Features:
  • Real JWT authentication with your credentials
  • Proper cURL-based API registration
  • Comprehensive error handling
  • Direct database integration
  • 18 APIs with realistic production scenarios

Prerequisites:
  • APILens backend running on http://localhost:3000
  • Valid user account (sidhiq@gmail.com)
  • Network access for cURL commands

Examples:
  node enhanced-jwt-register.js
  APILENS_BASE="http://localhost:3001" node enhanced-jwt-register.js
`);
  process.exit(0);
}

// Run the registration
main().catch(error => {
  console.error('💥 Unexpected error:', error.message);
  console.error(error.stack);
  process.exit(1);
});
