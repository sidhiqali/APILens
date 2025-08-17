#!/usr/bin/env node

/**
 * Quick test script to register APIs with bypassed auth for testing notifications
 */

const axios = require('axios');

const APILENS_BASE = 'http://localhost:3000';

const apis = [
  {
    apiName: 'Users API',
    description: 'User management API with dynamic health status',
    openApiUrl: 'http://localhost:5101/openapi.json',
    type: 'User Management',
    tags: ['users', 'authentication', 'demo'],
    checkFrequency: '30s'
  },
  {
    apiName: 'Orders API',
    description: 'Order management API with error states',
    openApiUrl: 'http://localhost:5102/openapi.json',
    type: 'E-commerce',
    tags: ['orders', 'commerce', 'test'],
    checkFrequency: '30s'
  },
  {
    apiName: 'Payments API',
    description: 'Payment processing API',
    openApiUrl: 'http://localhost:5104/openapi.json',
    type: 'Financial',
    tags: ['payments', 'financial'],
    checkFrequency: '30s'
  },
  {
    apiName: 'Notifications API',
    description: 'Notifications API with unhealthy states',
    openApiUrl: 'http://localhost:5106/openapi.json',
    type: 'Messaging',
    tags: ['notifications', 'events'],
    checkFrequency: '30s'
  }
];

async function createTestUser() {
  try {
    // First try to register
    const registerResponse = await axios.post(`${APILENS_BASE}/auth/register`, {
      email: 'testuser@example.com',
      password: 'password123'
    });
    
    console.log('✅ Test user registered:', registerResponse.data.user.email);
    return registerResponse.data.user._id;
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('ℹ️  Test user already exists');
      return null; // User already exists
    }
    console.error('❌ Failed to register test user:', error.response?.data?.message || error.message);
    return null;
  }
}

async function registerAPI(api, userId) {
  try {
    // Manually insert API without auth for testing
    const response = await axios.post(`${APILENS_BASE}/apis`, {
      ...api,
      userId: userId || '68a2649e6e0c50cd1710420f' // Use the first registered user
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ ${api.apiName} registered successfully`);
    console.log(`   🆔 API ID: ${response.data._id}`);
    return response.data;
  } catch (error) {
    // If auth fails, try without userId for now
    if (error.response?.status === 401) {
      console.log(`⚠️  Auth required for ${api.apiName}, skipping for now...`);
      return null;
    }
    
    console.error(`❌ Failed to register ${api.apiName}:`);
    console.error(`   Status: ${error.response?.status || 'No response'}`);
    console.error(`   Error: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

async function testHealthEndpoints() {
  console.log('\n🔍 Testing health endpoints...');
  
  for (const api of apis) {
    try {
      const healthUrl = api.openApiUrl.replace('/openapi.json', '/health');
      const response = await axios.get(healthUrl);
      console.log(`✅ ${api.apiName}: ${response.data.status} (${response.status})`);
      if (response.data.error) {
        console.log(`   ⚠️  Error: ${response.data.error}`);
      }
    } catch (error) {
      console.log(`❌ ${api.apiName}: Health check failed`);
    }
  }
}

async function main() {
  console.log('🧪 APILens Test Registration');
  console.log('============================');
  
  // Test health endpoints first
  await testHealthEndpoints();
  
  console.log('\n📝 Registering APIs...');
  
  const userId = await createTestUser();
  
  for (const api of apis) {
    await registerAPI(api, userId);
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
  }
  
  console.log('\n✅ Test registration complete!');
  console.log('\n🎯 Next steps:');
  console.log('   1. Login to APILens with: testuser@example.com / password123');
  console.log('   2. (Manually verify email in DB if needed)');
  console.log('   3. Watch notifications as health status changes');
  console.log('   4. Check /dashboard and /notifications pages');
}

main().catch(console.error);
