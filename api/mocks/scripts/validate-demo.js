#!/usr/bin/env node

/**
 * Demo Validation Script
 * 
 * Validates that the enhanced demo setup is working correctly
 * and provides a comprehensive status report for university presentation.
 */

const axios = require('axios');
const fs = require('fs');

// Configuration
const APILENS_BASE = process.env.APILENS_BASE || 'http://localhost:3000';
const AUTH_TOKEN = process.env.APILENS_AUTH_TOKEN || '';

// Validation tests
const validationTests = [
  {
    name: 'APILens Backend Health',
    test: async () => {
      const response = await axios.get(`${APILENS_BASE}/health`, { timeout: 5000 });
      return response.status === 200;
    }
  },
  {
    name: 'Authentication Token Valid',
    test: async () => {
      if (!AUTH_TOKEN) return false;
      const response = await axios.get(`${APILENS_BASE}/profile`, {
        headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` },
        timeout: 5000
      });
      return response.status === 200;
    }
  },
  {
    name: 'APIs Registered',
    test: async () => {
      const response = await axios.get(`${APILENS_BASE}/apis`, {
        headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` },
        timeout: 5000
      });
      return response.data && response.data.length >= 6;
    }
  },
  {
    name: 'Mock Servers Running',
    test: async () => {
      const ports = [4101, 4102, 4103, 4104, 4105, 4106];
      const healthChecks = await Promise.all(
        ports.map(async (port) => {
          try {
            await axios.get(`http://localhost:${port}/health`, { timeout: 2000 });
            return true;
          } catch {
            return false;
          }
        })
      );
      return healthChecks.filter(Boolean).length >= 4; // At least 4 of 6 APIs
    }
  },
  {
    name: 'Spec Servers Responding',
    test: async () => {
      const specPorts = [5101, 5102, 5103, 5104, 5105, 5106];
      const specChecks = await Promise.all(
        specPorts.map(async (port) => {
          try {
            await axios.get(`http://localhost:${port}/openapi.json`, { timeout: 2000 });
            return true;
          } catch {
            return false;
          }
        })
      );
      return specChecks.filter(Boolean).length >= 4; // At least 4 of 6 specs
    }
  },
  {
    name: 'Error Scenarios Active',
    test: async () => {
      try {
        const response = await axios.get('http://localhost:5101/health', { timeout: 2000 });
        return response.data && 
               response.data.status !== 'healthy' || 
               response.data.error || 
               response.data.severity;
      } catch {
        return false; // Might be intentionally failing
      }
    }
  },
  {
    name: 'Change Detection Ready',
    test: async () => {
      const response = await axios.get(`${APILENS_BASE}/changelogs`, {
        headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` },
        timeout: 5000
      });
      return response.status === 200; // Endpoint exists for change tracking
    }
  },
  {
    name: 'Notifications System',
    test: async () => {
      const response = await axios.get(`${APILENS_BASE}/notifications`, {
        headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` },
        timeout: 5000
      });
      return response.status === 200; // Endpoint exists for notifications
    }
  }
];

// Collect demo statistics
async function collectDemoStats() {
  const stats = {
    apis: 0,
    criticalIssues: 0,
    majorIssues: 0,
    minorIssues: 0,
    securityIssues: 0,
    performanceIssues: 0,
    breakingChanges: 0,
    healthyAPIs: 0,
    unhealthyAPIs: 0,
    totalNotifications: 0,
    unreadNotifications: 0
  };

  try {
    const apisResponse = await axios.get(`${APILENS_BASE}/apis`, {
      headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
    });
    
    if (apisResponse.data) {
      stats.apis = apisResponse.data.length;
      
      for (const api of apisResponse.data) {
        if (api.healthStatus === 'healthy') stats.healthyAPIs++;
        else stats.unhealthyAPIs++;
      }
    }

    try {
      const notificationsResponse = await axios.get(`${APILENS_BASE}/notifications`, {
        headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` }
      });
      
      if (notificationsResponse.data && Array.isArray(notificationsResponse.data)) {
        stats.totalNotifications = notificationsResponse.data.length;
        stats.unreadNotifications = notificationsResponse.data.filter(n => !n.read).length;
        
        for (const notification of notificationsResponse.data) {
          if (notification.severity === 'critical') stats.criticalIssues++;
          else if (notification.severity === 'major') stats.majorIssues++;
          else if (notification.severity === 'minor') stats.minorIssues++;
          
          if (notification.type === 'security' || notification.category === 'security') stats.securityIssues++;
          if (notification.type === 'performance' || notification.category === 'performance') stats.performanceIssues++;
          if (notification.type === 'breaking_change' || notification.category === 'breaking_change') stats.breakingChanges++;
        }
      }
    } catch (error) {
    }

    const mockPorts = [5101, 5102, 5103];
    for (const port of mockPorts) {
      try {
        const healthResponse = await axios.get(`http://localhost:${port}/health`);
        if (healthResponse.data) {
          if (healthResponse.data.severity === 'critical') stats.criticalIssues++;
          else if (healthResponse.data.severity === 'major') stats.majorIssues++;
          else if (healthResponse.data.severity === 'minor') stats.minorIssues++;
        }
      } catch (error) {
      }
    }

  } catch (error) {
    console.log('Note: Could not collect full statistics - this is normal for initial setup');
  }

  return stats;
}

// Generate demo readiness report
function generateDemoReport(testResults, stats) {
  const passedTests = testResults.filter(r => r.passed).length;
  const totalTests = testResults.length;
  const readinessScore = Math.round((passedTests / totalTests) * 100);

  let readinessLevel = 'Not Ready';
  let readinessColor = '🔴';
  
  if (readinessScore >= 90) {
    readinessLevel = 'Excellent';
    readinessColor = '🟢';
  } else if (readinessScore >= 75) {
    readinessLevel = 'Good';
    readinessColor = '🟡';
  } else if (readinessScore >= 50) {
    readinessLevel = 'Fair';
    readinessColor = '🟠';
  }

  const report = `
🎓 APILens Demo Readiness Report
================================

${readinessColor} Overall Readiness: ${readinessLevel} (${readinessScore}%)

📊 Demo Statistics:
   • APIs Registered: ${stats.apis}
   • Healthy APIs: ${stats.healthyAPIs}
   • Unhealthy APIs: ${stats.unhealthyAPIs}
   • Total Notifications: ${stats.totalNotifications}
   • Unread Notifications: ${stats.unreadNotifications}

🚨 Issue Severity Distribution:
   • 🔴 Critical Issues: ${stats.criticalIssues}
   • 🟠 Major Issues: ${stats.majorIssues}
   • 🟡 Minor Issues: ${stats.minorIssues}

🔍 Issue Categories:
   • 🔒 Security Issues: ${stats.securityIssues}
   • ⚡ Performance Issues: ${stats.performanceIssues}
   • 💥 Breaking Changes: ${stats.breakingChanges}

✅ Validation Results:
${testResults.map(test => 
  `   ${test.passed ? '✅' : '❌'} ${test.name}${test.error ? ` (${test.error})` : ''}`
).join('\n')}

🎯 Demo Recommendations:
${readinessScore >= 90 ? 
  '   🎉 Perfect! Your demo is ready for university presentation.\n   🎬 All systems operational with comprehensive error scenarios.' :
readinessScore >= 75 ?
  '   👍 Good setup! Minor issues detected but demo should work well.\n   💡 Check failed tests above for optimization opportunities.' :
readinessScore >= 50 ?
  '   ⚠️  Fair setup. Some critical components may not be working.\n   🔧 Fix failed tests before proceeding with demo.' :
  '   🚨 Demo not ready! Multiple critical issues detected.\n   🛠️  Please fix failed tests before attempting demo.'
}

🚀 Next Steps:
${readinessScore >= 75 ?
  '   1. 🎬 Start your university presentation\n   2. 📊 Monitor dashboard for real-time changes\n   3. 🎯 Follow demo scenarios in ENHANCED-DEMO-GUIDE.md' :
  '   1. 🔧 Fix failed validation tests\n   2. 🚀 Re-run validation script\n   3. 📚 Review ENHANCED-DEMO-GUIDE.md for troubleshooting'
}

---
Generated: ${new Date().toISOString()}
For support: Check ENHANCED-DEMO-GUIDE.md troubleshooting section
`;

  return report;
}

// Main validation function
async function runValidation() {
  console.log('🔍 APILens Demo Validation Starting...\n');

  const testResults = [];
  for (const test of validationTests) {
    process.stdout.write(`Testing ${test.name}... `);
    try {
      const passed = await test.test();
      testResults.push({ name: test.name, passed });
      console.log(passed ? '✅' : '❌');
    } catch (error) {
      testResults.push({ name: test.name, passed: false, error: error.message });
      console.log(`❌ (${error.message.substring(0, 50)}...)`);
    }
  }

  console.log('\n📊 Collecting demo statistics...');
  const stats = await collectDemoStats();

  console.log('\n📋 Generating readiness report...');
  const report = generateDemoReport(testResults, stats);
  
  const reportPath = require('path').join(__dirname, '..', 'demo-validation-report.txt');
  require('fs').writeFileSync(reportPath, report);
  
  console.log(report);
  console.log(`\n📄 Full report saved to: ${reportPath}`);

  const passedTests = testResults.filter(r => r.passed).length;
  const readinessScore = Math.round((passedTests / validationTests.length) * 100);
  
  if (readinessScore < 50) {
    console.log('\n🚨 Demo validation failed! Please fix issues before proceeding.');
    process.exit(1);
  } else {
    console.log('\n✅ Demo validation completed successfully!');
    process.exit(0);
  }
}

// CLI help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
APILens Demo Validation Script

Usage:
  node validate-demo.js

Environment Variables:
  APILENS_BASE       APILens backend URL (default: http://localhost:3000)
  APILENS_AUTH_TOKEN Your APILens authentication token (required)

This script validates:
- APILens backend connectivity
- Authentication token validity
- Mock servers status
- Demo data readiness
- Error scenarios active
- Change detection capability

Run this before your university presentation to ensure everything is working.
`);
  process.exit(0);
}

// Run validation
if (!AUTH_TOKEN) {
  console.error('❌ Please set APILENS_AUTH_TOKEN environment variable');
  console.error('   export APILENS_AUTH_TOKEN="your_token_here"');
  process.exit(1);
}

runValidation().catch(error => {
  console.error('\n💥 Validation script error:', error.message);
  process.exit(1);
});
