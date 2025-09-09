#!/usr/bin/env node

const axios = require('axios');

const APILENS_BASE_URL = 'http://localhost:3000';
const USER_ID = '688bbf97f1d2e59a4ebfd1ab';
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InNpZGhpcUBnbWFpbC5jb20iLCJzdWIiOiI2ODhiYmY5N2YxZDJlNTlhNGViZmQxYWIiLCJpYXQiOjE3NTczNzY5ODUsImV4cCI6MTc1NzM4MDU4NX0.baJQEMTvd2FPO3noIFWQPbBse94cY82c-rg2enjGbNo';

// Mock APIs configuration matching your orchestrator
const MOCK_APIS = [
  {
    apiName: 'Users API',
    openApiUrl: 'http://localhost:5101/openapi.json',
    description: 'User management API with field rename changes',
    tags: ['mock', 'users', 'breaking'],
    checkFrequency: '30s'
  },
  {
    apiName: 'Orders API', 
    openApiUrl: 'http://localhost:5102/openapi.json',
    description: 'Order processing API with new required headers',
    tags: ['mock', 'orders', 'breaking'],
    checkFrequency: '30s'
  },
  {
    apiName: 'Weather API',
    openApiUrl: 'http://localhost:5103/openapi.json', 
    description: 'Weather service API with new required parameters',
    tags: ['mock', 'weather', 'breaking'],
    checkFrequency: '30s'
  },
  {
    apiName: 'Payments API',
    openApiUrl: 'http://localhost:5104/openapi.json',
    description: 'Payment processing API with auth scheme changes', 
    tags: ['mock', 'payments', 'breaking'],
    checkFrequency: '30s'
  },
  {
    apiName: 'Inventory API',
    openApiUrl: 'http://localhost:5105/openapi.json',
    description: 'Inventory management API with response structure changes',
    tags: ['mock', 'inventory', 'breaking'], 
    checkFrequency: '30s'
  },
  {
    apiName: 'Notifications API',
    openApiUrl: 'http://localhost:5106/openapi.json',
    description: 'Notification service API with webhook changes',
    tags: ['mock', 'notifications', 'breaking'],
    checkFrequency: '30s'
  }
];

async function registerMockApis() {
  console.log('🚀 Registering mock APIs with APILens...\n');
  
  try {
    for (const apiConfig of MOCK_APIS) {
      console.log(`📝 Registering ${apiConfig.apiName}...`);
      
      try {
        const response = await axios.post(`${APILENS_BASE_URL}/apis`, apiConfig, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${JWT_TOKEN}`
          },
          timeout: 10000
        });
        
        console.log(`   ✅ Successfully registered: ${response.data.id}`);
        console.log(`   📊 Version: ${response.data.version}`);
        console.log(`   🔗 URL: ${apiConfig.openApiUrl}`);
        
      } catch (error) {
        if (error.response?.status === 409) {
          console.log(`   ℹ️  Already exists, skipping: ${apiConfig.apiName}`);
        } else {
          console.log(`   ❌ Failed to register ${apiConfig.apiName}:`, error.response?.data || error.message);
        }
      }
      
      console.log('');
    }
    
    console.log('🎉 Mock API registration complete!');
    console.log('🔄 Your APILens will now monitor these mock APIs for changes.');
    console.log('⏰ Check frequency set to 30s for fast testing.');
    
  } catch (error) {
    console.error('💥 Registration failed:', error.message);
    process.exit(1);
  }
}

async function checkMockServers() {
  console.log('🔍 Checking mock server availability...\n');
  
  for (const api of MOCK_APIS) {
    try {
      const response = await axios.get(api.openApiUrl, { timeout: 5000 });
      console.log(`✅ ${api.apiName}: Available (v${response.data.info?.version || 'unknown'})`);
    } catch (error) {
      console.log(`❌ ${api.apiName}: Not available - ${error.message}`);
    }
  }
  console.log('');
}

async function main() {
  console.log('🎯 Mock API Registration Tool\n');
  
  await checkMockServers();
  await registerMockApis();
  
  console.log('\n💡 Next steps:');
  console.log('1. Check your APILens dashboard - you should see 6 new mock APIs');
  console.log('2. Wait for version flips (users: 30s, notifications: 60s, etc.)');
  console.log('3. Watch as APIs change status based on breaking changes');
  console.log('4. APIs will show unhealthy/error status after version flips');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { registerMockApis, MOCK_APIS };
