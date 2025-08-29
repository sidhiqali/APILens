# APILens Mock Universe

Comprehensive mock API ecosystem for demonstrating APILens monitoring capabilities.

## Overview

This mock universe provides realistic API scenarios including:

- **Dynamic API Changes**: Automatic version transitions with breaking/non-breaking changes
- **Health Monitoring**: APIs with varying health states and error patterns
- **Security Scenarios**: Vulnerability detection and compliance monitoring
- **Performance Testing**: Response time degradation and resource exhaustion

## Components

### Mock Servers
- **6 Core APIs**: Users, Orders, Weather, Payments, Inventory, Notifications
- **Dynamic Versioning**: Automatic transitions between API versions
- **Realistic Errors**: HTTP error codes, timeouts, and service degradation

### Enhanced Demo APIs
- **29 Total APIs**: Comprehensive coverage across industries
- **Severity Levels**: Critical, High, Medium, Low, and Healthy scenarios
- **Production Scenarios**: Real-world error patterns and incident types

## Quick Start

### 1. Start Mock Servers
```bash
npm run mocks
```

### 2. Register APIs with APILens
```bash
# Basic 6 APIs
node scripts/register-apis.js

# Enhanced demo (29 APIs)
node scripts/enhanced-jwt-register.js
```

### 3. Validate Setup
```bash
node scripts/validate-demo.js
```

## API Categories

- **Identity & Access**: Authentication and user management
- **Financial Services**: Payment processing and compliance
- **E-commerce**: Order management and inventory
- **Communication**: Messaging and notifications
- **Infrastructure**: Storage, CDN, and monitoring
- **Analytics**: Data processing and business intelligence
- **External Integrations**: Third-party service dependencies

## Documentation

- [Enhanced Demo Guide](ENHANCED-DEMO-GUIDE.md)
- [Quick Setup Guide](ENHANCED-DEMO-QUICK-START.md)
- [Postman Collections](postman/)
- [OpenAPI Specifications](openapi/)

## Architecture

The mock universe simulates enterprise API ecosystems with:

- **Version Management**: Controlled API evolution scenarios
- **Health Simulation**: Realistic failure patterns
- **Change Detection**: Breaking and non-breaking change scenarios
- **Monitoring Integration**: Full APILens compatibility