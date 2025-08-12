#!/usr/bin/env node

/**
 * APILens Mock Universe Auto-Registration Script
 * 
 * Automatically registers all 6 mock APIs with APILens using different monitoring frequencies.
 * Run this after starting the mock universe to quickly set up all APIs for demo.
 */

const axios = require('axios');

// Configuration
const APILENS_BASE = process.env.APILENS_BASE || 'http://localhost:3000';
const AUTH_TOKEN = process.env.APILENS_AUTH_TOKEN || '';

if (!AUTH_TOKEN) {
  console.error('❌ Please set APILENS_AUTH_TOKEN environment variable');
  console.error('   export APILENS_AUTH_TOKEN="your_token_here"');
  process.exit(1);
}

const apis = [
  {
    name: 'Users API',
    description: 'User management API - will flip from v1 to v2 after 60s',
    baseUrl: 'http://localhost:4101',
    category: 'User Management',
    tags: ['users', 'authentication', 'demo'],
    frequency: '30s',
    expectedChange: 'Field rename: username → handle + new status query param',
    flipTime: '60 seconds'
  },
  {
    name: 'Orders API', 
    description: 'Order management API - stays on v1 for manual testing',
    baseUrl: 'http://localhost:4102',
    category: 'E-commerce',
    tags: ['orders', 'commerce', 'manual-test'],
    frequency: '2m',
    expectedChange: 'New required header + cancel endpoint',
    flipTime: 'manual'
  },
  {
    name: 'Weather API',
    description: 'Weather information API - will flip from v1 to v2 after 90s', 
    baseUrl: 'http://localhost:4103',
    category: 'External Data',
    tags: ['weather', 'external', 'demo'],
    frequency: '45s',
    expectedChange: 'New required units query param + field rename: tempC → temperature',
    flipTime: '90 seconds'
  },
  {
    name: 'Payments API',
    description: 'Payment processing API - stays on v1 for auth scheme testing',
    baseUrl: 'http://localhost:4104', 
    category: 'Financial',
    tags: ['payments', 'auth', 'security', 'manual-test'],
    frequency: '5m',
    expectedChange: 'Auth scheme change: API Key → Bearer JWT',
    flipTime: 'manual'
  },
  {
    name: 'Inventory API',
    description: 'Product inventory API - will flip from v1 to v2 after 120s (2 minutes)',
    baseUrl: 'http://localhost:4105',
    category: 'Inventory', 
    tags: ['inventory', 'products', 'pagination', 'demo'],
    frequency: '1m',
    expectedChange: 'Response structure change: Array → {data, nextCursor, hasMore, total}',
    flipTime: '120 seconds'
  },
  {
    name: 'Notifications API',
    description: 'Event notifications API - will flip from v1 to v2 after 60s',
    baseUrl: 'http://localhost:4106',
    category: 'Messaging',
    tags: ['notifications', 'events', 'webhooks', 'rate-limiting', 'demo'], 
    frequency: '20s',
    expectedChange: 'Multiple changes: new /webhooks endpoint + 429 responses + header changes',
    flipTime: '60 seconds'
  }
];

async function registerAPI(api) {
  const payload = {
    name: api.name,
    description: api.description,
    baseUrl: api.baseUrl,
    openApiUrl: `${api.baseUrl}/openapi.json`,
    version: '1.0.0',
    category: api.category,
    tags: api.tags,
    monitoringConfig: {
      enabled: true,
      frequency: api.frequency,
      alertOnChange: true,
      changeTypes: ['breaking', 'non-breaking', 'feature']
    },
    expectedChanges: {
      description: api.expectedChange,
      changeType: api.flipTime === 'manual' ? 'manual-test' : 'breaking',
      estimatedTime: api.flipTime
    }
  };

  try {
    const response = await axios.post(`${APILENS_BASE}/api/apis`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });

    console.log(`✅ ${api.name} registered successfully`);
    console.log(`   📊 Monitoring: ${api.frequency}`);
    console.log(`   🔄 Change: ${api.expectedChange}`);
    console.log(`   ⏰ Flip time: ${api.flipTime}`);
    console.log(`   🆔 API ID: ${response.data.id}`);
    console.log('');
    
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to register ${api.name}:`);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Error: ${error.response.data?.message || error.response.data}`);
    } else {
      console.error(`   Error: ${error.message}`);
    }
    console.log('');
    return null;
  }
}

async function checkAPIHealth(baseUrl) {
  try {
    // Try a simple health check - most APIs should respond to their base endpoint
    await axios.get(baseUrl, { timeout: 2000 });
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('🚀 APILens Mock Universe Auto-Registration');
  console.log('==========================================');
  console.log(`📡 APILens URL: ${APILENS_BASE}`);
  console.log(`🔐 Auth Token: ${AUTH_TOKEN.substring(0, 10)}...`);
  console.log('');

  // Check if mock APIs are running
  console.log('🔍 Checking if mock APIs are running...');
  const healthChecks = await Promise.all(
    apis.map(async (api) => ({
      name: api.name,
      url: api.baseUrl,
      healthy: await checkAPIHealth(api.baseUrl)
    }))
  );

  const unhealthyAPIs = healthChecks.filter(check => !check.healthy);
  if (unhealthyAPIs.length > 0) {
    console.log('⚠️  Some APIs are not responding:');
    unhealthyAPIs.forEach(api => {
      console.log(`   ❌ ${api.name} (${api.url})`);
    });
    console.log('');
    console.log('💡 Make sure to run: npm run mocks');
    console.log('');
  } else {
    console.log('✅ All mock APIs are responding');
    console.log('');
  }

  // Register APIs
  console.log('📝 Registering APIs with APILens...');
  console.log('');

  const results = [];
  for (const api of apis) {
    const result = await registerAPI(api);
    results.push({ api: api.name, success: !!result, data: result });
    
    // Small delay between registrations
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('📊 Registration Summary');
  console.log('=======================');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`✅ Successful: ${successful.length}/${apis.length}`);
  if (failed.length > 0) {
    console.log(`❌ Failed: ${failed.length}/${apis.length}`);
    failed.forEach(f => console.log(`   • ${f.api}`));
  }
  console.log('');

  if (successful.length === apis.length) {
    console.log('🎉 All APIs registered successfully!');
    console.log('');
    console.log('🎯 Next Steps:');
    console.log('   1. Watch the APILens dashboard for change detection');
    console.log('   2. APIs will start flipping to v2 automatically:');
    console.log('      • Users & Notifications: 60s');
    console.log('      • Weather: 90s');  
    console.log('      • Inventory: 120s');
    console.log('   3. Test Orders & Payments manually for breaking changes');
    console.log('');
    console.log('🌐 API Endpoints:');
    apis.forEach(api => {
      console.log(`   • ${api.name.padEnd(20)} ${api.baseUrl}`);
    });
  } else {
    console.log('⚠️  Some registrations failed. Check errors above and retry.');
  }
}

// Handle CLI arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
APILens Mock Universe Auto-Registration

Usage:
  node register-apis.js

Environment Variables:
  APILENS_BASE       APILens backend URL (default: http://localhost:3000)
  APILENS_AUTH_TOKEN Your APILens authentication token (required)

Examples:
  export APILENS_AUTH_TOKEN="your_token_here"
  node register-apis.js

  APILENS_BASE="https://apilens.example.com" node register-apis.js
`);
  process.exit(0);
}

// Run the registration
main().catch(error => {
  console.error('💥 Unexpected error:', error.message);
  process.exit(1);
});
