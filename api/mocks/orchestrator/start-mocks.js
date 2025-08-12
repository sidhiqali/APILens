/**
 * APILens Mock Universe Orchestrator
 * 
 * Orchestrates 6 Prism mock servers and flips some from v1->v2 on a timer.
 * Enhanced with port checking, better error handling, and robust cleanup.
 * Now includes OpenAPI spec servers for APILens integration.
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
const specServers = new Map(); // For OpenAPI spec servers
const startTime = Date.now();

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

// Check if port is available
function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.once('close', () => resolve(true));
      server.close();
    });
    server.on('error', () => resolve(false));
  });
}

// Check if Prism CLI is available
function checkPrismCli() {
  return new Promise((resolve) => {
    exec(`${BIN} prism --version`, (error) => {
      resolve(!error);
    });
  });
}

// Validate all spec files exist
function ensureSpecsExist() {
  let ok = true;
  log('Validating OpenAPI spec files...');
  
  for (const c of config) {
    for (const [version, specPath] of [['v1', c.v1], ['v2', c.v2]]) {
      const abs = r(specPath);
      if (!fs.existsSync(abs)) {
        console.error(`❌ Missing ${c.name} ${version} spec: ${abs}`);
        ok = false;
      } else {
        log(`✅ Found ${c.name} ${version}: ${path.basename(specPath)}`);
      }
    }
  }
  
  if (!ok) {
    console.error('\n❌ One or more OpenAPI files are missing. Aborting.');
    console.error('💡 Make sure all v1.yaml and v2.yaml files are created in mocks/openapi/*/');
    process.exit(1);
  }
  
  log('✅ All spec files validated');
}

// Check port availability for all configured ports
async function checkAllPorts() {
  log('Checking port availability...');
  
  for (const c of config) {
    const available = await checkPort(c.port);
    if (!available) {
      console.error(`❌ Port ${c.port} is already in use (needed for ${c.name} API)`);
      console.error(`💡 Stop the process using port ${c.port} or change the port in prismauto.config.js`);
      process.exit(1);
    }
    log(`✅ Port ${c.port} available for ${c.name}`);
  }
}

// Start a Prism mock server
function startPrism(name, port, specPath, version = 'v1') {
  const args = [...PRISM_ARGS, r(specPath), '-h', '0.0.0.0', '-p', String(port)];
  
  const child = spawn(BIN, args, { 
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false
  });
  
  processes.set(name, child);
  
  const specName = path.basename(specPath);
  log(`🚀 ${name} API started on :${port} (${version}) → ${specName}`);
  
  // Handle process output (optional: can be commented out to reduce noise)
  child.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output && !output.includes('Prism is listening')) {
      log(`[${name}] ${output}`);
    }
  });
  
  child.stderr.on('data', (data) => {
    const error = data.toString().trim();
    if (error) {
      console.error(`[${name}] ERROR: ${error}`);
    }
  });
  
  child.on('exit', (code, signal) => {
    if (code !== null && code !== 0) {
      console.error(`[${name}] exited with code ${code}`);
    }
    if (signal) {
      log(`[${name}] killed with signal ${signal}`);
    }
  });
  
  child.on('error', (err) => {
    console.error(`[${name}] spawn error:`, err.message);
  });
  
  return child;
}

// Kill a Prism process with enhanced cleanup
function killPrism(name) {
  const child = processes.get(name);
  if (!child) return;
  
  try {
    if (process.platform === 'win32') {
      // Windows: kill process tree
      spawn('taskkill', ['/pid', child.pid, '/f', '/t'], { stdio: 'ignore' });
    } else {
      // Unix: send SIGTERM first, then SIGKILL if needed
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

// Create a simple HTTP server to serve OpenAPI specs
function createSpecServer(name, port, currentSpecPath) {
  const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    
    // Enable CORS for APILens
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
        // Get the current spec path dynamically from the specServers map
        const serverInfo = specServers.get(name);
        const activeSpecPath = serverInfo ? serverInfo.currentSpecPath : currentSpecPath;
        const specContent = fs.readFileSync(r(activeSpecPath), 'utf8');
        
        if (parsedUrl.pathname === '/openapi.json') {
          // Convert YAML to JSON if requested
          const yaml = require('js-yaml');
          const jsonSpec = yaml.load(specContent);
          res.setHeader('Content-Type', 'application/json');
          res.writeHead(200);
          res.end(JSON.stringify(jsonSpec, null, 2));
        } else {
          // Serve YAML directly
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
      res.writeHead(200);
      // Get the current spec path dynamically from the specServers map
      const serverInfo = specServers.get(name);
      const activeSpecPath = serverInfo ? serverInfo.currentSpecPath : currentSpecPath;
      res.end(JSON.stringify({ 
        status: 'healthy', 
        api: name, 
        currentSpec: path.basename(activeSpecPath),
        timestamp: new Date().toISOString()
      }));
    } else {
      res.writeHead(404);
      res.end('Not Found - Available endpoints: /openapi.json, /openapi.yaml, /health');
    }
  });
  
  const specPort = port + 1000; // Use port+1000 for spec servers (5101, 5102, etc.)
  server.listen(specPort, '0.0.0.0', () => {
    log(`📄 ${name} OpenAPI spec server started on :${specPort}`);
  });
  
  specServers.set(name, { server, port: specPort, currentSpecPath });
  return server;
}

// Update spec server to point to new version
function updateSpecServer(name, newSpecPath) {
  const specServer = specServers.get(name);
  if (specServer) {
    specServer.currentSpecPath = newSpecPath;
    log(`📄 ${name} spec server updated to ${path.basename(newSpecPath)}`);
  }
}

// Setup version switching logic
function setupVersionSwitching(apiConfig) {
  const { name, port, v1, v2, flipAfterMs, flipBackEveryMs, description } = apiConfig;
  
  // One-time flip to v2
  if (flipAfterMs && flipAfterMs > 0) {
    setTimeout(() => {
      log(`🔄 ${name} flipping to v2 (${description})...`);
      killPrism(name);
      setTimeout(() => {
        startPrism(name, port, v2, 'v2');
        updateSpecServer(name, v2); // Update spec server too
      }, 1000);
    }, flipAfterMs);
  }
  
  // Periodic flip back and forth (optional feature)
  if (flipBackEveryMs && flipBackEveryMs > 0) {
    let currentVersion = 'v1';
    setInterval(() => {
      currentVersion = currentVersion === 'v1' ? 'v2' : 'v1';
      const specPath = currentVersion === 'v1' ? v1 : v2;
      
      log(`🔄 ${name} toggling to ${currentVersion}...`);
      killPrism(name);
      setTimeout(() => {
        startPrism(name, port, specPath, currentVersion);
        updateSpecServer(name, specPath);
      }, 1000);
    }, flipBackEveryMs);
  }
}

// Graceful shutdown handler
function setupShutdownHandlers() {
  function shutdown(signal) {
    log(`\n🛑 Received ${signal}, shutting down mock servers...`);
    
    // Stop Prism processes
    for (const [name] of processes) {
      log(`🛑 Stopping ${name}...`);
      killPrism(name);
    }
    
    // Stop spec servers
    for (const [name, { server }] of specServers) {
      log(`🛑 Stopping ${name} spec server...`);
      server.close();
    }
    
    // Give processes time to clean up
    setTimeout(() => {
      log('✅ All mock servers stopped. Goodbye!');
      process.exit(0);
    }, 2000);
  }
  
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    shutdown('EXCEPTION');
  });
}

// Print startup banner
function printBanner() {
  console.log('\n🚀 APILens Mock Universe Starting...\n');
  console.log('📋 Configuration:');
  
  config.forEach(c => {
    const flipInfo = c.flipAfterMs > 0 
      ? `flips to v2 after ${c.flipAfterMs/1000}s` 
      : 'stays on v1';
    console.log(`   • ${c.name.padEnd(12)} :${c.port} - ${c.description} (${flipInfo})`);
  });
  
  console.log('\n🌐 Mock API Endpoints:');
  config.forEach(c => {
    console.log(`   • ${c.name.padEnd(12)} http://localhost:${c.port}`);
  });
  
  console.log('\n📄 OpenAPI Spec Endpoints (for APILens):');
  config.forEach(c => {
    const specPort = c.port + 1000;
    console.log(`   • ${c.name.padEnd(12)} http://localhost:${specPort}/openapi.json`);
  });
  
  console.log('\n💡 Stop with CTRL+C\n');
}

// Main orchestrator function
async function run() {
  try {
    printBanner();
    
    // Pre-flight checks
    log('🔍 Running pre-flight checks...');
    
    const hasPrism = await checkPrismCli();
    if (!hasPrism) {
      console.error('❌ Prism CLI not found!');
      console.error('💡 Run: npm run mocks:install');
      process.exit(1);
    }
    log('✅ Prism CLI detected');
    
    await checkAllPorts();
    ensureSpecsExist();
    
    // Setup graceful shutdown
    setupShutdownHandlers();
    
    log('🚀 Starting mock servers...\n');
    
    // Start all APIs on v1
    for (const apiConfig of config) {
      startPrism(apiConfig.name, apiConfig.port, apiConfig.v1, 'v1');
      createSpecServer(apiConfig.name, apiConfig.port, apiConfig.v1);
      setupVersionSwitching(apiConfig);
    }
    
    log('\n✅ All mock servers started successfully!');
    log('📊 Watch the logs below for version switches...\n');
    
  } catch (error) {
    console.error('❌ Failed to start mock universe:', error.message);
    process.exit(1);
  }
}

// Start the orchestrator
if (require.main === module) {
  run();
}
