/**
 * Enhanced APILens Mock Universe Orchestrator
 * 
 * Provides realistic API health patterns, error scenarios, and change detection
 * for comprehensive university demonstration. Features include:
 * - Dynamic health states with realistic error patterns
 * - Multiple severity levels and issue types
 * - Time-based scenarios that change during demo
 * - Comprehensive error simulation
 */
const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const net = require('net');
const http = require('http');
const url = require('url');

const config = require('./prismauto.config.js');

// Cross-platform binary detection
const BIN = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const PRISM_ARGS = ['prism', 'mock', '--dynamic'];

const processes = new Map();
const specServers = new Map();
const startTime = Date.now();

// Enhanced health patterns for university demo
const healthPatterns = {
  'critical-unstable': {
    states: ['error', 'unhealthy', 'error', 'degraded', 'unhealthy', 'error'],
    errors: [
      'Database connection pool exhausted',
      'Authentication service timeout (5000ms)',
      'Memory usage critical (95%)',
      'SSL certificate expired',
      'Circuit breaker OPEN - 80% error rate'
    ],
    responseTimeMs: [3000, 5000, 8000, 2000, 4000, 10000]
  },
  'performance-degraded': {
    states: ['degraded', 'degraded', 'unhealthy', 'degraded', 'healthy', 'degraded'],
    errors: [
      'Query execution time above threshold (2.5s)',
      'CPU usage sustained above 85%',
      'Cache hit ratio below 40%',
      'Thread pool near capacity',
      'Garbage collection pressure high'
    ],
    responseTimeMs: [1500, 2000, 1800, 1200, 300, 1600]
  },
  'security-issues': {
    states: ['error', 'unhealthy', 'healthy', 'error', 'degraded', 'unhealthy'],
    errors: [
      'CVE-2024-1234: Critical vulnerability detected',
      'Brute force attack detected (127 failed attempts)',
      'Invalid JWT signature rate increased',
      'Rate limiting activated - suspicious traffic',
      'TLS handshake failures increased'
    ],
    responseTimeMs: [800, 1200, 200, 2000, 600, 1500]
  },
  'external-dependency': {
    states: ['unhealthy', 'healthy', 'error', 'degraded', 'healthy', 'unhealthy'],
    errors: [
      'External payment service timeout',
      'Third-party API rate limit exceeded',
      'DNS resolution failures for external service',
      'Network connectivity issues to upstream',
      'External service returned HTTP 503'
    ],
    responseTimeMs: [5000, 200, 8000, 1000, 250, 3000]
  },
  'data-consistency': {
    states: ['degraded', 'unhealthy', 'degraded', 'error', 'degraded', 'healthy'],
    errors: [
      'Data synchronization lag detected (5 minutes)',
      'Referential integrity constraint violations',
      'Duplicate key errors in database',
      'Stale cache data detected',
      'Cross-region replication delay'
    ],
    responseTimeMs: [800, 1500, 900, 2500, 700, 300]
  },
  'messaging-failures': {
    states: ['unhealthy', 'error', 'degraded', 'unhealthy', 'degraded', 'error'],
    errors: [
      'Message queue overflow (10K pending)',
      'Dead letter queue capacity exceeded',
      'Webhook delivery failure rate: 45%',
      'Event bus partition offline',
      'Consumer lag increasing rapidly'
    ],
    responseTimeMs: [2000, 4000, 1200, 1800, 1000, 3500]
  },
  'connection-storms': {
    states: ['error', 'unhealthy', 'error', 'degraded', 'unhealthy', 'error'],
    errors: [
      'WebSocket connection limit exceeded (10K concurrent)',
      'Memory leak in connection pool detected',
      'Message flood protection activated',
      'Connection handshake timeout increased',
      'Auto-scaling triggered - CPU at 500%'
    ],
    responseTimeMs: [5000, 3000, 8000, 2000, 4000, 6000]
  },
  'storage-issues': {
    states: ['unhealthy', 'degraded', 'error', 'degraded', 'healthy', 'unhealthy'],
    errors: [
      'Storage quota exceeded - 95% of 10TB used',
      'File integrity check failed (127 corrupted files)',
      'Backup process failed for 3rd consecutive day',
      'Disk I/O latency increased by 600%',
      'Unauthorized access attempts detected'
    ],
    responseTimeMs: [3000, 1500, 5000, 2500, 400, 2800]
  },
  'ml-model-drift': {
    states: ['degraded', 'unhealthy', 'degraded', 'error', 'degraded', 'unhealthy'],
    errors: [
      'Model accuracy dropped from 94% to 67%',
      'GPU cluster CUDA out of memory errors',
      'Training pipeline failed - corrupt data',
      'Inference latency increased from 50ms to 2.3s',
      'Model showing bias in production traffic'
    ],
    responseTimeMs: [2300, 1800, 2000, 4500, 1900, 2100]
  },
  'cdn-failures': {
    states: ['unhealthy', 'error', 'degraded', 'unhealthy', 'degraded', 'error'],
    errors: [
      '40% of CDN edge servers unreachable',
      'Bandwidth capacity exceeded (100Gbps)',
      'GPU transcoding farm 70% failure rate',
      'Video quality forced to 480p',
      '25% streams buffering >5 seconds'
    ],
    responseTimeMs: [4000, 8000, 2000, 3500, 1800, 7000]
  },
  'iot-connectivity': {
    states: ['degraded', 'unhealthy', 'healthy', 'degraded', 'unhealthy', 'degraded'],
    errors: [
      '2,847 devices offline for >24 hours',
      '156 devices critical battery (<5%)',
      '892 devices need urgent firmware update',
      'Temperature sensor calibration drift',
      'Cellular network outage (40% devices affected)'
    ],
    responseTimeMs: [1200, 2000, 300, 1100, 1800, 1300]
  },
  'deprecated-sunset': {
    states: ['healthy', 'degraded', 'healthy', 'degraded', 'unhealthy', 'degraded'],
    errors: [
      'API version sunset in 30 days',
      'Legacy endpoint usage above threshold',
      'Migration readiness check failed',
      'Backward compatibility issues detected',
      'Deprecated feature usage warnings'
    ],
    responseTimeMs: [400, 800, 350, 700, 1200, 600]
  },
  'configuration-drift': {
    states: ['degraded', 'degraded', 'unhealthy', 'degraded', 'healthy', 'degraded'],
    errors: [
      'Environment configuration mismatch detected',
      'Feature flag inconsistency across regions',
      'Database schema version drift',
      'Config validation failures',
      'Environment variable overrides detected'
    ],
    responseTimeMs: [600, 800, 1500, 700, 250, 900]
  }
};

// API-specific configuration for enhanced demo
const enhancedAPIConfigs = [
  {
    name: 'User Authentication API',
    port: 4101,
    specPort: 5101,
    healthPattern: 'critical-unstable',
    v1: '../openapi/users/v1.yaml',
    v2: '../openapi/users/v2.yaml',
    flipAfterMs: 90000, // 1.5 minutes
    description: 'Critical auth issues, breaking changes'
  },
  {
    name: 'E-commerce Orders API',
    port: 4102,
    specPort: 5102,
    healthPattern: 'performance-degraded',
    v1: '../openapi/orders/v1.yaml',
    v2: '../openapi/orders/v2.yaml',
    flipAfterMs: 180000, // 3 minutes
    description: 'Performance regression, response time issues'
  },
  {
    name: 'Payment Processing API',
    port: 4103,
    specPort: 5103,
    healthPattern: 'security-issues',
    v1: '../openapi/payments/v1.yaml',
    v2: '../openapi/payments/v2.yaml',
    flipAfterMs: 240000, // 4 minutes
    description: 'Security vulnerabilities, auth changes'
  },
  {
    name: 'Inventory Management API',
    port: 4104,
    specPort: 5104,
    healthPattern: 'data-consistency',
    v1: '../openapi/inventory/v1.yaml',
    v2: '../openapi/inventory/v2.yaml',
    flipAfterMs: 300000, // 5 minutes
    description: 'Data sync issues, schema changes'
  },
  {
    name: 'External Weather API',
    port: 4105,
    specPort: 5105,
    healthPattern: 'external-dependency',
    v1: '../openapi/weather/v1.yaml',
    v2: '../openapi/weather/v2.yaml',
    flipAfterMs: 360000, // 6 minutes
    description: 'External service failures, rate limiting'
  },
  {
    name: 'Notifications Service API',
    port: 4106,
    specPort: 5106,
    healthPattern: 'messaging-failures',
    v1: '../openapi/notifications/v1.yaml',
    v2: '../openapi/notifications/v2.yaml',
    flipAfterMs: 120000, // 2 minutes
    description: 'Message delivery failures, webhook issues'
  },
  {
    name: 'Real-time Chat API',
    port: 4107,
    specPort: 5107,
    healthPattern: 'connection-storms',
    v1: '../openapi/notifications/v1.yaml', // Reuse existing spec
    v2: '../openapi/notifications/v2.yaml',
    flipAfterMs: 480000, // 8 minutes
    description: 'WebSocket connection storms, message floods'
  },
  {
    name: 'File Storage API',
    port: 4108,
    specPort: 5108,
    healthPattern: 'storage-issues',
    v1: '../openapi/inventory/v1.yaml', // Reuse existing spec
    v2: '../openapi/inventory/v2.yaml',
    flipAfterMs: 540000, // 9 minutes
    description: 'Storage quota violations, file corruption'
  },
  {
    name: 'Machine Learning API',
    port: 4109,
    specPort: 5109,
    healthPattern: 'ml-model-drift',
    v1: '../openapi/weather/v1.yaml', // Reuse existing spec
    v2: '../openapi/weather/v2.yaml',
    flipAfterMs: 420000, // 7 minutes
    description: 'Model drift, GPU failures, accuracy loss'
  },
  {
    name: 'Video Streaming API',
    port: 4110,
    specPort: 5110,
    healthPattern: 'cdn-failures',
    v1: '../openapi/users/v1.yaml', // Reuse existing spec
    v2: '../openapi/users/v1.yaml',
    flipAfterMs: 600000, // 10 minutes
    description: 'CDN failures, bandwidth spikes, buffering'
  },
  {
    name: 'IoT Device API',
    port: 4111,
    specPort: 5111,
    healthPattern: 'iot-connectivity',
    v1: '../openapi/orders/v1.yaml', // Reuse existing spec
    v2: '../openapi/orders/v2.yaml',
    flipAfterMs: 660000, // 11 minutes
    description: 'Device connectivity issues, battery alerts'
  }
];

// Utility functions
function r(p) { 
  return path.resolve(__dirname, p); 
}

function timestamp() {
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  return `[${elapsed}s]`;
}

function log(message) {
  console.log(`${timestamp()} ${message}`);
}

// Enhanced health check endpoint with realistic scenarios
function createEnhancedSpecServer(apiConfig) {
  const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }
    
    if (parsedUrl.pathname === '/openapi.json' || parsedUrl.pathname === '/openapi.yaml') {
      try {
        const serverInfo = specServers.get(apiConfig.name);
        const activeSpecPath = serverInfo ? serverInfo.currentSpecPath : apiConfig.v1;
        const specContent = fs.readFileSync(r(activeSpecPath), 'utf8');
        
        if (parsedUrl.pathname === '/openapi.json') {
          const yaml = require('js-yaml');
          const jsonSpec = yaml.load(specContent);
          res.setHeader('Content-Type', 'application/json');
          res.writeHead(200);
          res.end(JSON.stringify(jsonSpec, null, 2));
        } else {
          res.setHeader('Content-Type', 'application/yaml');
          res.writeHead(200);
          res.end(specContent);
        }
      } catch (error) {
        res.writeHead(500);
        res.end(`Error reading spec: ${error.message}`);
      }
    } else if (parsedUrl.pathname === '/health') {
      res.setHeader('Content-Type', 'application/json');
      
      // Get health pattern for this API
      const pattern = healthPatterns[apiConfig.healthPattern];
      const timeSlot = Math.floor((Date.now() - startTime) / (30 * 1000)) % pattern.states.length; // 30-second cycles
      
      const currentState = pattern.states[timeSlot];
      const currentError = pattern.errors[timeSlot];
      const currentResponseTime = pattern.responseTimeMs[timeSlot];
      
      // Determine status code based on health state
      const statusCode = currentState === 'healthy' ? 200 : 
                        currentState === 'degraded' ? 200 : 
                        currentState === 'unhealthy' ? 503 : 500;
      
      // Create detailed health response
      const healthResponse = {
        status: currentState,
        api: apiConfig.name,
        timestamp: new Date().toISOString(),
        responseTime: currentResponseTime,
        version: specServers.get(apiConfig.name)?.currentSpecPath?.includes('v2') ? 'v2' : 'v1',
        error: currentState !== 'healthy' ? currentError : null,
        severity: currentState === 'error' ? 'critical' :
                 currentState === 'unhealthy' ? 'major' :
                 currentState === 'degraded' ? 'minor' : 'info',
        healthChecks: generateDetailedHealthChecks(apiConfig, currentState),
        metrics: generateRealisticMetrics(apiConfig, currentState),
        incidents: generateIncidentHistory(apiConfig),
        dependencies: generateDependencyStatus(apiConfig, currentState)
      };
      
      res.writeHead(statusCode);
      res.end(JSON.stringify(healthResponse, null, 2));
    } else {
      res.writeHead(404);
      res.end('Not Found - Available endpoints: /openapi.json, /openapi.yaml, /health');
    }
  });
  
  server.listen(apiConfig.specPort, '0.0.0.0', () => {
    log(`📄 ${apiConfig.name} enhanced server started on :${apiConfig.specPort}`);
  });
  
  specServers.set(apiConfig.name, { 
    server, 
    port: apiConfig.specPort, 
    currentSpecPath: apiConfig.v1,
    config: apiConfig
  });
  
  return server;
}

function generateDetailedHealthChecks(apiConfig, currentState) {
  const baseChecks = {
    database: currentState === 'healthy' ? 'ok' : 
             currentState === 'degraded' ? 'slow' : 'failed',
    cache: Math.random() > 0.8 ? 'degraded' : 'ok',
    memory: currentState === 'error' ? 'critical' : 
           currentState === 'unhealthy' ? 'high' : 'normal',
    cpu: currentState === 'degraded' ? 'high' : 'normal'
  };
  
  // Add API-specific checks
  if (apiConfig.name.includes('Payment')) {
    baseChecks.paymentGateway = currentState === 'unhealthy' ? 'timeout' : 'ok';
    baseChecks.encryption = currentState === 'error' ? 'failed' : 'ok';
  } else if (apiConfig.name.includes('Authentication')) {
    baseChecks.ldap = currentState === 'error' ? 'unreachable' : 'ok';
    baseChecks.tokenStore = currentState === 'unhealthy' ? 'degraded' : 'ok';
  } else if (apiConfig.name.includes('Weather')) {
    baseChecks.externalAPI = currentState === 'error' ? 'timeout' : 'ok';
    baseChecks.rateLimit = currentState === 'unhealthy' ? 'exceeded' : 'ok';
  }
  
  return baseChecks;
}

function generateRealisticMetrics(apiConfig, currentState) {
  const baseMetrics = {
    requestsPerMinute: Math.floor(Math.random() * 500) + 100,
    errorRate: currentState === 'healthy' ? Math.random() * 0.01 : 
              currentState === 'degraded' ? Math.random() * 0.05 + 0.01 :
              Math.random() * 0.2 + 0.05,
    uptime: currentState === 'error' ? Math.random() * 0.1 + 0.85 : 
           Math.random() * 0.05 + 0.95,
    diskUsage: Math.random() * 0.3 + 0.4,
    connectionPool: currentState === 'unhealthy' ? Math.random() * 0.2 + 0.8 : 
                   Math.random() * 0.4 + 0.3
  };
  
  // Add pattern-specific metrics
  if (apiConfig.healthPattern === 'performance-degraded') {
    baseMetrics.avgResponseTime = Math.random() * 1000 + 1000; // 1-2 seconds
    baseMetrics.p95ResponseTime = Math.random() * 2000 + 2000; // 2-4 seconds
  } else if (apiConfig.healthPattern === 'security-issues') {
    baseMetrics.failedAuthAttempts = Math.floor(Math.random() * 100) + 20;
    baseMetrics.suspiciousRequests = Math.floor(Math.random() * 50) + 5;
  }
  
  return baseMetrics;
}

function generateIncidentHistory(apiConfig) {
  const incidents = [];
  const now = new Date();
  
  // Generate 3-5 recent incidents
  const incidentCount = Math.floor(Math.random() * 3) + 3;
  for (let i = 0; i < incidentCount; i++) {
    const timestamp = new Date(now.getTime() - (i + 1) * 2 * 60 * 60 * 1000); // 2 hours apart
    incidents.push({
      id: `inc_${Date.now()}_${i}`,
      timestamp: timestamp.toISOString(),
      severity: ['critical', 'major', 'minor'][Math.floor(Math.random() * 3)],
      description: getRandomIncidentDescription(apiConfig),
      resolved: i > 0, // Latest incident might be ongoing
      duration: Math.floor(Math.random() * 120) + 15 // 15-135 minutes
    });
  }
  
  return incidents;
}

function getRandomIncidentDescription(apiConfig) {
  const descriptions = {
    'critical-unstable': [
      'Authentication service complete outage',
      'Database connection failures',
      'Memory leak causing service crashes'
    ],
    'performance-degraded': [
      'Query performance degradation',
      'High CPU usage causing slowdowns',
      'Cache invalidation storm'
    ],
    'security-issues': [
      'DDoS attack mitigated',
      'Suspicious login attempts blocked',
      'Security patch deployment'
    ],
    'external-dependency': [
      'Third-party API outage',
      'Network connectivity issues',
      'External rate limits exceeded'
    ],
    'data-consistency': [
      'Data synchronization delays',
      'Schema migration issues',
      'Replication lag detected'
    ],
    'messaging-failures': [
      'Message queue overflow',
      'Webhook delivery failures',
      'Event processing backlog'
    ]
  };
  
  const options = descriptions[apiConfig.healthPattern] || descriptions['critical-unstable'];
  return options[Math.floor(Math.random() * options.length)];
}

function generateDependencyStatus(apiConfig, currentState) {
  const dependencies = {
    database: currentState === 'error' ? 'unavailable' : 'available',
    redis: Math.random() > 0.9 ? 'degraded' : 'available'
  };
  
  // Add API-specific dependencies
  if (apiConfig.name.includes('Payment')) {
    dependencies.paymentGateway = currentState === 'unhealthy' ? 'timeout' : 'available';
  } else if (apiConfig.name.includes('Weather')) {
    dependencies.weatherAPI = currentState === 'error' ? 'unavailable' : 'available';
  } else if (apiConfig.name.includes('Notifications')) {
    dependencies.messageQueue = currentState === 'unhealthy' ? 'overloaded' : 'available';
  }
  
  return dependencies;
}

// Enhanced startup with better patterns
async function startEnhancedDemo() {
  console.log('\n🎓 APILens Enhanced Mock Universe - University Demo');
  console.log('==================================================');
  console.log('🎯 Features: Realistic health patterns, error scenarios, severity levels');
  console.log('📊 Patterns: Critical issues, performance problems, security alerts');
  console.log('⏰ Timeline: APIs will flip versions showing breaking changes');
  console.log('');
  
  console.log('📋 Enhanced API Configuration:');
  enhancedAPIConfigs.forEach(config => {
    console.log(`   • ${config.name.padEnd(25)} :${config.port} - ${config.description}`);
    console.log(`     Health Pattern: ${config.healthPattern.padEnd(20)} Spec: :${config.specPort}`);
  });
  console.log('');
  
  // Start all enhanced APIs
  log('🚀 Starting enhanced mock APIs...');
  
  for (const apiConfig of enhancedAPIConfigs) {
    // Start Prism mock server
    startPrism(apiConfig.name, apiConfig.port, apiConfig.v1, 'v1');
    
    // Start enhanced spec server
    createEnhancedSpecServer(apiConfig);
    
    // Setup version switching
    setupVersionSwitching(apiConfig);
  }
  
  log('');
  log('✅ All enhanced APIs started successfully!');
  log('📊 Health patterns will cycle every 30 seconds');
  log('🔄 Version flips scheduled at different intervals');
  log('⚠️  Monitor for critical, major, and minor issues');
  log('');
  
  // Print demo timeline
  console.log('⏰ Demo Timeline:');
  enhancedAPIConfigs.forEach(config => {
    const minutes = Math.floor(config.flipAfterMs / 60000);
    console.log(`   ${minutes}:00 - ${config.name} flips to v2 (breaking changes)`);
  });
  console.log('');
  console.log('🎬 Demo is ready! Monitor APILens dashboard for comprehensive scenarios.');
}

// Standard Prism functions (reused from original)
function startPrism(name, port, specPath, version = 'v1') {
  const args = [...PRISM_ARGS, r(specPath), '-h', '0.0.0.0', '-p', String(port)];
  
  const child = spawn(BIN, args, { 
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false
  });
  
  processes.set(name, child);
  
  const specName = path.basename(specPath);
  log(`🚀 ${name} started on :${port} (${version}) → ${specName}`);
  
  child.on('exit', (code, signal) => {
    if (code !== null && code !== 0) {
      console.error(`[${name}] exited with code ${code}`);
    }
  });
  
  return child;
}

function killPrism(name) {
  const child = processes.get(name);
  if (!child) return;
  
  try {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', child.pid, '/f', '/t'], { stdio: 'ignore' });
    } else {
      child.kill('SIGTERM');
      setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGKILL');
        }
      }, 2000);
    }
  } catch (e) {
    console.error(`[${name}] kill error:`, e.message);
  }
  
  processes.delete(name);
}

function updateSpecServer(name, newSpecPath) {
  const specServer = specServers.get(name);
  if (specServer) {
    specServer.currentSpecPath = newSpecPath;
    log(`📄 ${name} spec server updated to ${path.basename(newSpecPath)}`);
  }
}

function setupVersionSwitching(apiConfig) {
  if (apiConfig.flipAfterMs && apiConfig.flipAfterMs > 0) {
    setTimeout(() => {
      log(`🔄 ${apiConfig.name} flipping to v2 (${apiConfig.description})...`);
      killPrism(apiConfig.name);
      setTimeout(() => {
        startPrism(apiConfig.name, apiConfig.port, apiConfig.v2, 'v2');
        updateSpecServer(apiConfig.name, apiConfig.v2);
      }, 1000);
    }, apiConfig.flipAfterMs);
  }
}

// Graceful shutdown
function setupShutdownHandlers() {
  function shutdown(signal) {
    log(`\n🛑 Received ${signal}, shutting down enhanced demo...`);
    
    for (const [name] of processes) {
      log(`🛑 Stopping ${name}...`);
      killPrism(name);
    }
    
    for (const [name, { server }] of specServers) {
      log(`🛑 Stopping ${name} spec server...`);
      server.close();
    }
    
    setTimeout(() => {
      log('✅ Enhanced demo stopped. Goodbye!');
      process.exit(0);
    }, 2000);
  }
  
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

// Main execution
async function run() {
  setupShutdownHandlers();
  await startEnhancedDemo();
}

// Start the enhanced orchestrator
if (require.main === module) {
  run().catch(error => {
    console.error('❌ Failed to start enhanced demo:', error.message);
    process.exit(1);
  });
}

module.exports = { run, enhancedAPIConfigs, healthPatterns };
