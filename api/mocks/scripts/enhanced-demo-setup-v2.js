#!/usr/bin/env node

/**
 * Enhanced APILens Demo Setup Script
 * 
 * Creates comprehensive test scenarios with diverse severity levels:
 * - CRITICAL: System failures, security breaches, complete outages
 * - HIGH: Major functionality issues, significant performance problems
 * - MEDIUM: Moderate issues, some degradation but functional
 * - LOW: Minor issues, cosmetic problems, rate limiting
 * - HEALTHY: Excellent performance, minimal to no issues
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const APILENS_BASE = process.env.APILENS_BASE || 'http://localhost:3000';

// Enhanced API configurations with diverse severity levels and realistic scenarios
const demoAPIs = [
  // CRITICAL SEVERITY - Worst Case Scenarios
  {
    name: 'User Authentication API',
    description: 'Critical user authentication service - COMPLETE SYSTEM FAILURE',
    baseUrl: 'http://localhost:4101',
    specUrl: 'http://localhost:5101/openapi.json',
    category: 'Authentication',
    tags: ['users', 'auth', 'critical', 'security', 'system-down'],
    frequency: '30s',
    severityLevel: 'CRITICAL',
    healthStatus: 'unhealthy',
    responseTime: 8500,
    errorRate: 95,
    issues: [
      'BREAKING: Complete authentication system overhaul - ALL endpoints changed',
      'CRITICAL: Database connection pool exhausted - service unavailable',
      'SECURITY: Critical vulnerability CVE-2025-0001 - immediate action required',
      'BREAKING: JWT token format completely changed - all clients broken',
      'CRITICAL: Memory leak causing server crashes every 10 minutes'
    ],
    incidents: [
      { type: 'OUTAGE', severity: 'CRITICAL', duration: '4h 23m', status: 'ONGOING' },
      { type: 'SECURITY_BREACH', severity: 'CRITICAL', duration: '2h 15m', status: 'INVESTIGATING' }
    ]
  },
  {
    name: 'Payment Processing API',
    description: 'Financial transactions - MAJOR PAYMENT FAILURES',
    baseUrl: 'http://localhost:4102',
    specUrl: 'http://localhost:5102/openapi.json',
    category: 'Financial',
    tags: ['payments', 'financial', 'critical', 'fraud-detection'],
    frequency: '30s',
    severityLevel: 'CRITICAL',
    healthStatus: 'degraded',
    responseTime: 5200,
    errorRate: 78,
    issues: [
      'CRITICAL: Payment gateway returning 50% failed transactions',
      'SECURITY: Potential fraud detection system compromise',
      'BREAKING: Credit card validation rules changed - rejecting valid cards',
      'MAJOR: Transaction timeouts causing customer complaints',
      'URGENT: PCI compliance violation - immediate remediation required'
    ],
    incidents: [
      { type: 'PAYMENT_FAILURE', severity: 'CRITICAL', duration: '2h 45m', status: 'MITIGATING' },
      { type: 'FRAUD_ALERT', severity: 'HIGH', duration: '45m', status: 'INVESTIGATING' }
    ]
  },

  // HIGH SEVERITY - Major Issues
  {
    name: 'Order Management API',
    description: 'E-commerce orders - HIGH SEVERITY performance issues',
    baseUrl: 'http://localhost:4103',
    specUrl: 'http://localhost:5103/openapi.json',
    category: 'E-commerce',
    tags: ['orders', 'ecommerce', 'performance', 'database-issues'],
    frequency: '1m',
    severityLevel: 'HIGH',
    healthStatus: 'degraded',
    responseTime: 3800,
    errorRate: 45,
    issues: [
      'HIGH: Order processing taking 5x longer than normal',
      'PERFORMANCE: Database connection pool near capacity',
      'BREAKING: Order status workflow changed - breaking client integrations',
      'MAJOR: Inventory synchronization lag causing overselling',
      'WARNING: Memory usage climbing steadily'
    ],
    incidents: [
      { type: 'PERFORMANCE_DEGRADATION', severity: 'HIGH', duration: '1h 20m', status: 'ONGOING' }
    ]
  },
  {
    name: 'Customer Support API',
    description: 'Support ticket system - HIGH SEVERITY integration failures',
    baseUrl: 'http://localhost:4104',
    specUrl: 'http://localhost:5104/openapi.json',
    category: 'Support',
    tags: ['support', 'tickets', 'integration-issues', 'escalation'],
    frequency: '1m',
    severityLevel: 'HIGH',
    healthStatus: 'unhealthy',
    responseTime: 4200,
    errorRate: 62,
    issues: [
      'HIGH: Ticket creation failing for 60% of requests',
      'INTEGRATION: Slack notification webhook broken',
      'BREAKING: Priority levels enum changed without migration',
      'MAJOR: Customer email notifications not being sent',
      'ESCALATION: VIP customer tickets stuck in queue'
    ],
    incidents: [
      { type: 'INTEGRATION_FAILURE', severity: 'HIGH', duration: '3h 10m', status: 'ESCALATED' }
    ]
  },

  // MEDIUM SEVERITY - Moderate Issues  
  {
    name: 'Product Catalog API',
    description: 'Product information - MEDIUM severity data inconsistencies',
    baseUrl: 'http://localhost:4105',
    specUrl: 'http://localhost:5105/openapi.json',
    category: 'Catalog',
    tags: ['products', 'catalog', 'data-sync', 'search-issues'],
    frequency: '5m',
    severityLevel: 'MEDIUM',
    healthStatus: 'degraded',
    responseTime: 1200,
    errorRate: 15,
    issues: [
      'MEDIUM: Product images loading slowly due to CDN issues',
      'DATA: Search index out of sync with product database',
      'NON-BREAKING: New product categories added',
      'WARNING: Some product descriptions truncated',
      'MINOR: Price formatting inconsistent across regions'
    ],
    incidents: [
      { type: 'DATA_SYNC_ISSUE', severity: 'MEDIUM', duration: '45m', status: 'MONITORING' }
    ]
  },
  {
    name: 'Analytics Dashboard API',
    description: 'Business metrics - MEDIUM severity reporting delays',
    baseUrl: 'http://localhost:4106',
    specUrl: 'http://localhost:5106/openapi.json',
    category: 'Analytics',
    tags: ['analytics', 'reporting', 'data-pipeline', 'delays'],
    frequency: '5m',
    severityLevel: 'MEDIUM',
    healthStatus: 'healthy',
    responseTime: 950,
    errorRate: 8,
    issues: [
      'MEDIUM: Real-time metrics delayed by 15 minutes',
      'DATA-PIPELINE: ETL job occasionally failing',
      'NON-BREAKING: New revenue metrics endpoints added',
      'PERFORMANCE: Large dataset queries timing out',
      'INFO: Dashboard cache refresh frequency reduced'
    ],
    incidents: [
      { type: 'DATA_DELAY', severity: 'MEDIUM', duration: '1h 30m', status: 'RESOLVED' }
    ]
  },

  // LOW SEVERITY - Minor Issues
  {
    name: 'Weather Integration API',
    description: 'External weather data - LOW severity rate limiting',
    baseUrl: 'http://localhost:4107',
    specUrl: 'http://localhost:5107/openapi.json',
    category: 'External',
    tags: ['weather', 'external', 'rate-limiting', 'third-party'],
    frequency: '15m',
    severityLevel: 'LOW',
    healthStatus: 'healthy',
    responseTime: 450,
    errorRate: 3,
    issues: [
      'LOW: Occasional rate limit warnings (still within quota)',
      'EXTERNAL: Third-party API response format slightly changed',
      'NON-BREAKING: Additional weather data fields available',
      'MINOR: Some weather icons updated',
      'INFO: API documentation links updated'
    ],
    incidents: [
      { type: 'RATE_LIMIT_WARNING', severity: 'LOW', duration: '10m', status: 'RESOLVED' }
    ]
  },
  {
    name: 'Email Notification API',
    description: 'Email delivery service - LOW severity template issues',
    baseUrl: 'http://localhost:4108',
    specUrl: 'http://localhost:5108/openapi.json',
    category: 'Notifications',
    tags: ['email', 'notifications', 'templates', 'delivery'],
    frequency: '10m',
    severityLevel: 'LOW',
    healthStatus: 'healthy',
    responseTime: 280,
    errorRate: 2,
    issues: [
      'LOW: Email template formatting slightly off in dark mode',
      'COSMETIC: Button styling inconsistent across email clients',
      'NON-BREAKING: New email template variants added',
      'MINOR: Bounce rate slightly higher than usual',
      'INFO: Unsubscribe link updated for compliance'
    ],
    incidents: [
      { type: 'TEMPLATE_ISSUE', severity: 'LOW', duration: '20m', status: 'RESOLVED' }
    ]
  },

  // HEALTHY APIs - Minimal to No Issues
  {
    name: 'Static Content API',
    description: 'CDN and static assets - HEALTHY with excellent performance',
    baseUrl: 'http://localhost:4109',
    specUrl: 'http://localhost:5109/openapi.json',
    category: 'Content',
    tags: ['cdn', 'static', 'assets', 'performance'],
    frequency: '30m',
    severityLevel: 'HEALTHY',
    healthStatus: 'healthy',
    responseTime: 120,
    errorRate: 0.1,
    issues: [
      'INFO: CDN cache hit rate improved to 99.8%',
      'OPTIMIZATION: Image compression algorithm updated',
      'NON-BREAKING: New asset formats supported (WebP, AVIF)',
      'IMPROVEMENT: Response times reduced by 15%',
      'SUCCESS: Zero downtime deployment completed'
    ],
    incidents: []
  },
  {
    name: 'Documentation API',
    description: 'API documentation service - HEALTHY with regular updates',
    baseUrl: 'http://localhost:4110',
    specUrl: 'http://localhost:5110/openapi.json',
    category: 'Documentation',
    tags: ['docs', 'api-reference', 'examples', 'guides'],
    frequency: '1h',
    severityLevel: 'HEALTHY',
    healthStatus: 'healthy',
    responseTime: 200,
    errorRate: 0.2,
    issues: [
      'INFO: API documentation updated with new examples',
      'IMPROVEMENT: Interactive API explorer enhanced',
      'NON-BREAKING: Code samples added for Python SDK',
      'UPDATE: Authentication guide clarified',
      'ENHANCEMENT: Search functionality improved'
    ],
    incidents: []
  },
  {
    name: 'Health Check API',
    description: 'System monitoring - HEALTHY serving as reliability benchmark',
    baseUrl: 'http://localhost:4111',
    specUrl: 'http://localhost:5111/openapi.json',
    category: 'Monitoring',
    tags: ['health', 'monitoring', 'status', 'reliability'],
    frequency: '5m',
    severityLevel: 'HEALTHY',
    healthStatus: 'healthy',
    responseTime: 85,
    errorRate: 0.05,
    issues: [
      'SUCCESS: 99.99% uptime maintained for 180 days',
      'IMPROVEMENT: Health check granularity increased',
      'ENHANCEMENT: New dependency health indicators added',
      'OPTIMIZATION: Response payload size reduced',
      'ACHIEVEMENT: Zero false alarms this month'
    ],
    incidents: []
  }
];

// Enhanced Change Patterns for Different Severity Levels
const changePatterns = {
  'CRITICAL': {
    types: ['BREAKING_CHANGE', 'SECURITY_VULNERABILITY', 'SYSTEM_FAILURE'],
    frequency: 'high',
    examples: [
      'Complete API restructure',
      'Security patch requiring immediate update',
      'Database schema migration',
      'Authentication system overhaul'
    ]
  },
  'HIGH': {
    types: ['MAJOR_CHANGE', 'PERFORMANCE_REGRESSION', 'INTEGRATION_BREAK'],
    frequency: 'medium',
    examples: [
      'New required parameters',
      'Response format changes',
      'Rate limiting changes',
      'Deprecated endpoint removal'
    ]
  },
  'MEDIUM': {
    types: ['MINOR_CHANGE', 'FEATURE_ADDITION', 'BUG_FIX'],
    frequency: 'regular',
    examples: [
      'Optional parameter addition',
      'Error message improvements',
      'Performance optimizations',
      'Documentation updates'
    ]
  },
  'LOW': {
    types: ['COSMETIC_CHANGE', 'DOCUMENTATION_UPDATE', 'OPTIMIZATION'],
    frequency: 'low',
    examples: [
      'Field name clarifications',
      'Example updates',
      'Response time improvements',
      'Code cleanup'
    ]
  },
  'HEALTHY': {
    types: ['ENHANCEMENT', 'OPTIMIZATION', 'FEATURE_ADDITION'],
    frequency: 'planned',
    examples: [
      'New features',
      'Performance improvements',
      'Additional endpoints',
      'Better error handling'
    ]
  }
};

// Mock Server Generator Functions
function generateMockServer(api) {
  const openApiSpec = {
    openapi: '3.0.0',
    info: {
      title: api.name,
      version: '1.0.0',
      description: api.description
    },
    servers: [
      {
        url: api.baseUrl,
        description: 'Development server'
      }
    ],
    paths: generatePathsForSeverity(api.severityLevel),
    components: {
      schemas: generateSchemasForSeverity(api.severityLevel),
      responses: generateResponsesForSeverity(api.severityLevel)
    }
  };

  return openApiSpec;
}

function generatePathsForSeverity(severity) {
  const basePaths = {
    '/health': {
      get: {
        summary: 'Health check endpoint',
        responses: {
          '200': { description: 'Service is healthy' },
          '500': { description: 'Service is unhealthy' }
        }
      }
    }
  };

  switch (severity) {
    case 'CRITICAL':
      return {
        ...basePaths,
        '/auth/login': {
          post: {
            summary: 'User authentication (BROKEN)',
            responses: {
              '500': { description: 'Internal server error - system failure' },
              '503': { description: 'Service unavailable' }
            }
          }
        },
        '/users': {
          get: {
            summary: 'Get users (FAILING)',
            responses: {
              '500': { description: 'Database connection failed' },
              '504': { description: 'Gateway timeout' }
            }
          }
        }
      };
    
    case 'HIGH':
      return {
        ...basePaths,
        '/orders': {
          get: {
            summary: 'Get orders (SLOW)',
            responses: {
              '200': { description: 'Orders retrieved (very slow)' },
              '408': { description: 'Request timeout' },
              '502': { description: 'Bad gateway - database issues' }
            }
          },
          post: {
            summary: 'Create order (UNRELIABLE)',
            responses: {
              '201': { description: 'Order created' },
              '500': { description: 'Processing error' },
              '503': { description: 'Service temporarily unavailable' }
            }
          }
        }
      };

    case 'MEDIUM':
      return {
        ...basePaths,
        '/products': {
          get: {
            summary: 'Get products (DEGRADED)',
            responses: {
              '200': { description: 'Products retrieved' },
              '206': { description: 'Partial content - some data missing' },
              '429': { description: 'Rate limit exceeded' }
            }
          }
        }
      };

    case 'LOW':
      return {
        ...basePaths,
        '/weather': {
          get: {
            summary: 'Get weather data (MINOR ISSUES)',
            responses: {
              '200': { description: 'Weather data retrieved' },
              '429': { description: 'Rate limit warning' }
            }
          }
        }
      };

    default: // HEALTHY
      return {
        ...basePaths,
        '/content': {
          get: {
            summary: 'Get static content (EXCELLENT)',
            responses: {
              '200': { description: 'Content retrieved successfully' },
              '304': { description: 'Not modified - cached response' }
            }
          }
        }
      };
  }
}

function generateSchemasForSeverity(severity) {
  const baseSchemas = {
    Error: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
        severity: { type: 'string', enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'] }
      }
    }
  };

  if (severity === 'CRITICAL') {
    return {
      ...baseSchemas,
      SystemFailure: {
        type: 'object',
        properties: {
          errorType: { type: 'string', enum: ['OUTAGE', 'SECURITY_BREACH', 'DATA_LOSS'] },
          impact: { type: 'string' },
          estimatedRecovery: { type: 'string' }
        }
      }
    };
  }

  return baseSchemas;
}

function generateResponsesForSeverity(severity) {
  const baseResponses = {
    '500': {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/Error' }
        }
      }
    }
  };

  if (severity === 'CRITICAL') {
    return {
      ...baseResponses,
      '503': {
        description: 'Service unavailable - critical system failure',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SystemFailure' }
          }
        }
      }
    };
  }

  return baseResponses;
}

// Main execution function
async function setupEnhancedDemo() {
  console.log('🚀 Setting up Enhanced APILens Demo with Diverse Severity Levels');
  console.log('================================================================');
  console.log('');

  // Create OpenAPI specs directory
  const specsDir = path.join(__dirname, '..', 'openapi', 'enhanced');
  if (!fs.existsSync(specsDir)) {
    fs.mkdirSync(specsDir, { recursive: true });
  }

  // Generate OpenAPI specs for each severity level
  console.log('📝 Generating OpenAPI specifications...');
  
  for (const api of demoAPIs) {
    const spec = generateMockServer(api);
    const filename = `${api.name.toLowerCase().replace(/\s+/g, '-')}.yaml`;
    const filepath = path.join(specsDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(spec, null, 2));
    console.log(`   ✅ Generated: ${filename} (${api.severityLevel} severity)`);
  }

  console.log('');
  console.log('📊 Severity Distribution:');
  const severityCount = {};
  demoAPIs.forEach(api => {
    severityCount[api.severityLevel] = (severityCount[api.severityLevel] || 0) + 1;
  });

  Object.entries(severityCount).forEach(([severity, count]) => {
    const emoji = {
      'CRITICAL': '🔴',
      'HIGH': '🟠', 
      'MEDIUM': '🟡',
      'LOW': '🟢',
      'HEALTHY': '✅'
    }[severity];
    console.log(`   ${emoji} ${severity}: ${count} APIs`);
  });

  console.log('');
  console.log('🎯 Demo Scenarios Created:');
  console.log('   🔴 CRITICAL: System failures, security breaches, complete outages');
  console.log('   🟠 HIGH: Major functionality issues, significant performance problems'); 
  console.log('   🟡 MEDIUM: Moderate issues, some degradation but functional');
  console.log('   🟢 LOW: Minor issues, cosmetic problems, rate limiting');
  console.log('   ✅ HEALTHY: Excellent performance, minimal to no issues');
  console.log('');
  console.log('🚀 Enhanced demo setup complete! Your university presentation now has:');
  console.log('   📈 Realistic severity progression from worst to best');
  console.log('   🔄 Dynamic change patterns for each severity level');
  console.log('   📊 Comprehensive error scenarios and incident types');
  console.log('   🎭 Production-like API behavior simulation');
  console.log('');
  console.log('Next: Run the mock servers and register these APIs in APILens!');
}

// Run the setup
if (require.main === module) {
  setupEnhancedDemo().catch(console.error);
}

module.exports = { demoAPIs, changePatterns, generateMockServer };
