const axios = require('axios');
const { demoAPIs } = require('./enhanced-demo-setup-v2.js');

const API_BASE_URL = 'http://localhost:3000';

// Use environment variables for credentials in production
const credentials = {
  email: process.env.APILENS_EMAIL || 'admin@example.com',
  password: process.env.APILENS_PASSWORD || 'password'
};

// Map demo APIs to registration format
const enhancedAPIsForRegistration = demoAPIs.map(api => ({
  apiName: api.name,
  openApiUrl: 'https://petstore.swagger.io/v2/swagger.json', // Using working fallback
  type: api.category,
  tags: [...api.tags, api.severityLevel.toLowerCase()],
  checkFrequency: api.frequency === '30s' ? '30s' : 
                  api.frequency === '1m' ? '1m' :
                  api.frequency === '5m' ? '5m' :
                  api.frequency === '10m' ? '5m' :
                  api.frequency === '15m' ? '15m' :
                  api.frequency === '30m' ? '30m' :
                  api.frequency === '1h' ? '1h' : '1m',
  description: `${api.description} | Severity: ${api.severityLevel} | Response Time: ${api.responseTime}ms | Error Rate: ${api.errorRate}%`
}));

async function authenticate() {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.data && response.data.token) {
      console.log('✅ Authentication successful');
      return response.data.token;
    } else {
      throw new Error('No token in response');
    }
  } catch (error) {
    console.error('❌ Authentication failed:', error.response?.data || error.message);
    return null;
  }
}

async function registerAPI(api, token) {
  try {
    const response = await axios.post(`${API_BASE_URL}/apis`, api, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const severityEmoji = {
      'CRITICAL': '🔴',
      'HIGH': '🟠',
      'MEDIUM': '🟡', 
      'LOW': '🟢',
      'HEALTHY': '✅'
    };
    
    const severity = api.tags.find(tag => 
      ['critical', 'high', 'medium', 'low', 'healthy'].includes(tag)
    )?.toUpperCase() || 'UNKNOWN';
    
    console.log(`${severityEmoji[severity] || '⚪'} Successfully registered: ${api.apiName}`);
    console.log(`   🆔 API ID: ${response.data.id}`);
    console.log(`   📊 Severity: ${severity}`);
    console.log(`   🔍 Type: ${api.type}`);
    console.log(`   ⏱️  Check Frequency: ${api.checkFrequency}`);
    console.log(`   🏷️  Tags: ${api.tags.join(', ')}`);
    console.log('');
    return response.data;
  } catch (error) {
    console.error(`❌ Failed to register ${api.apiName}:`);
    console.error(`   📡 HTTP Status: ${error.response?.status}`);
    console.error(`   💬 Error: ${error.response?.data?.message || error.message}`);
    console.log('');
    return null;
  }
}

async function main() {
  console.log('🎯 Enhanced APILens Demo - Severity-Based Registration');
  console.log('======================================================');
  console.log('');
  console.log('📊 Registering APIs with diverse severity levels:');
  console.log('   🔴 CRITICAL: Complete system failures and security breaches');
  console.log('   🟠 HIGH: Major functionality issues and performance problems');
  console.log('   🟡 MEDIUM: Moderate issues with some degradation');
  console.log('   🟢 LOW: Minor issues and cosmetic problems');
  console.log('   ✅ HEALTHY: Excellent performance with minimal issues');
  console.log('');
  
  // Authenticate
  const token = await authenticate();
  if (!token) {
    process.exit(1);
  }
  
  console.log(`📝 Registering ${enhancedAPIsForRegistration.length} APIs with realistic scenarios...`);
  console.log('');
  
  // Register each API
  let successCount = 0;
  const results = [];
  
  // Group APIs by severity for organized registration
  const apisBySeverity = {
    CRITICAL: [],
    HIGH: [],
    MEDIUM: [],
    LOW: [],
    HEALTHY: []
  };
  
  enhancedAPIsForRegistration.forEach(api => {
    const severity = api.tags.find(tag => 
      ['critical', 'high', 'medium', 'low', 'healthy'].includes(tag)
    )?.toUpperCase() || 'UNKNOWN';
    
    if (apisBySeverity[severity]) {
      apisBySeverity[severity].push(api);
    }
  });
  
  // Register in severity order (worst to best)
  for (const severity of ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'HEALTHY']) {
    if (apisBySeverity[severity].length > 0) {
      const severityEmoji = {
        'CRITICAL': '🔴',
        'HIGH': '🟠',
        'MEDIUM': '🟡',
        'LOW': '🟢',
        'HEALTHY': '✅'
      }[severity];
      
      console.log(`${severityEmoji} Registering ${severity} Severity APIs (${apisBySeverity[severity].length} APIs):`);
      console.log('');
      
      for (const api of apisBySeverity[severity]) {
        const result = await registerAPI(api, token);
        if (result) {
          successCount++;
        }
        results.push({ 
          api: api.apiName, 
          severity,
          success: !!result, 
          data: result 
        });
        
        // Small delay between registrations
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }
  
  console.log('📊 Registration Summary');
  console.log('=======================');
  console.log(`✅ Successfully registered: ${successCount}/${enhancedAPIsForRegistration.length} APIs`);
  console.log('');
  
  // Summary by severity
  const summaryBySeverity = {};
  results.forEach(r => {
    if (!summaryBySeverity[r.severity]) {
      summaryBySeverity[r.severity] = { success: 0, total: 0 };
    }
    summaryBySeverity[r.severity].total++;
    if (r.success) summaryBySeverity[r.severity].success++;
  });
  
  console.log('📈 Results by Severity Level:');
  Object.entries(summaryBySeverity).forEach(([severity, stats]) => {
    const emoji = {
      'CRITICAL': '🔴',
      'HIGH': '🟠',
      'MEDIUM': '🟡',
      'LOW': '🟢',
      'HEALTHY': '✅'
    }[severity];
    console.log(`   ${emoji} ${severity}: ${stats.success}/${stats.total} registered`);
  });
  
  if (successCount === enhancedAPIsForRegistration.length) {
    console.log('');
    console.log('🎉 COMPLETE SUCCESS! All APIs registered with diverse severity levels!');
    console.log('');
    console.log('🎭 Your university demo now features:');
    console.log('   📊 Realistic production error scenarios');
    console.log('   🌊 Full severity spectrum from critical failures to healthy systems');
    console.log('   🔄 Dynamic change patterns and incident types');
    console.log('   📈 Comprehensive monitoring and alerting scenarios');
    console.log('');
    console.log('🚀 Ready for an impressive university presentation!');
  } else {
    const failed = results.filter(r => !r.success);
    console.log('');
    console.log(`❌ Failed registrations: ${failed.length}`);
    if (failed.length > 0) {
      console.log('   Failed APIs:');
      failed.forEach(f => console.log(`   • ${f.api} (${f.severity})`));
    }
  }
}

main().catch(console.error);
