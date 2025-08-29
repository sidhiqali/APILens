# 🚀 APILens Enhanced Demo - Quick Setup Guide

## Automated Database Population for University Demo

This guide helps you quickly populate your APILens database with **18 comprehensive APIs** featuring realistic production issues.

## 🎯 What You'll Get

- **18 APIs** with diverse error scenarios
- **Critical/Major/Minor** severity levels
- **Realistic Production Issues:**
  - Security breaches & vulnerabilities
  - Performance degradation & timeouts
  - Infrastructure failures & overloads
  - Data corruption & pipeline failures
  - Network connectivity storms
  - Resource exhaustion (GPU, memory, storage)

## ⚡ Quick Start (3 Steps)

### 1. Start APILens Backend
```bash
cd /Users/sidhiqali/Desktop/Rep/APILens/api
npm run dev
```

### 2. Run Auto-Registration Script
```bash
cd /Users/sidhiqali/Desktop/Rep/APILens/api/mocks
node scripts/enhanced-register-apis.js
```

### 3. Start Enhanced Mock Servers
```bash
# In the same directory
node orchestrator/enhanced-start-mocks.js
```

## 🔧 Troubleshooting

### If Registration Fails:
1. **Create User Account First:**
   - Open `http://localhost:3000` in browser
   - Sign up with any email/password
   - Then re-run the registration script

2. **Manual Registration:**
   - Use the APILens dashboard "Add API" button
   - Add each API manually using these URLs:
     ```
     User Management: http://localhost:4101/openapi.json
     Payment Gateway: http://localhost:4104/openapi.json
     Real-time Chat: http://localhost:4107/openapi.json
     ML Platform: http://localhost:4109/openapi.json
     IoT Devices: http://localhost:4111/openapi.json
     # ... and 13 more (see script for full list)
     ```

3. **Check Backend Connection:**
   ```bash
   curl http://localhost:3000/api/health
   ```

## 🎓 University Demo Features

Once setup is complete, your demo will showcase:

### 🔴 Critical Issues (5 APIs)
- **Security breaches** with unauthorized access
- **System overloads** with 500% CPU usage
- **Data loss** with 2.3M points lost
- **Connection storms** with 15K+ disconnections
- **Model drift** with 15% accuracy degradation

### 🟠 Major Issues (9 APIs)
- **Performance degradation** with 8.5s response times
- **Service failures** with 67% failure rates
- **Resource exhaustion** with storage near capacity
- **Pipeline failures** with data processing errors
- **Network issues** with CDN failures

### 🟡 Minor Issues (4 APIs)
- **Data staleness** with forecast delays
- **Quality degradation** with accuracy drops
- **Maintenance windows** with planned downtime

## 📊 Demo Scenarios Included

| Category | API Name | Primary Issue | Severity | Impact |
|----------|----------|---------------|----------|---------|
| Security | User Management | Data breach detected | Critical | 1000+ failed logins/min |
| Finance | Payment Gateway | Fraud overload | Critical | 45% false positive rate |
| Communication | Real-time Chat | Connection storm | Critical | 10K+ connections, memory leak |
| AI/ML | ML Platform | Model drift | Critical | 15% accuracy drop |
| IoT | Device Management | Connectivity crisis | Critical | 15K+ devices offline |
| E-commerce | Order Processing | Fulfillment delays | Major | 3+ hour delays |
| Infrastructure | File Storage | Storage critical | Major | 95% quota utilization |
| Media | Video Streaming | CDN failures | Major | Buffering storms |
| Blockchain | Network API | Consensus issues | Major | 30+ min transaction delays |
| Communication | Email Service | Delivery issues | Major | 78% delivery rate |
| Data | Search Engine | Index corruption | Major | 5s+ query times |
| Database | Cluster API | Connection exhausted | Critical | 500/500 connections used |
| External | Weather API | Data staleness | Minor | 4+ hour forecast delays |
| Supply Chain | Inventory | Stock discrepancies | Major | 847 SKUs affected |
| Messaging | Notifications | Delivery degraded | Major | 67% success rate |

## 🎯 University Presentation Tips

1. **Start with Dashboard Overview:** Show all 18 APIs with mixed health statuses
2. **Drill into Critical Issues:** Focus on security breaches and system overloads
3. **Demonstrate Severity Levels:** Show how different issues are prioritized
4. **Real-world Relevance:** Explain how these mirror actual production problems
5. **Scalability Showcase:** Highlight enterprise-scale numbers (10K+ users, 15K+ devices)

## 🌐 Access URLs

- **APILens Dashboard:** http://localhost:3000
- **VS Code Extension:** Install APILens.vsix from vscode folder
- **Mock API Status:** Check logs in `orchestrator/mock-servers.log`

## 📱 Complete Demo Flow

1. **Show Empty Dashboard** → Run registration script → **18 APIs appear**
2. **Point out Critical Issues** → Click into details → **Show realistic error scenarios**
3. **Navigate to Changes Tab** → **Show degradation history**
4. **Check Issues Tab** → **Demonstrate severity-based prioritization**
5. **VS Code Integration** → **Show developer workflow**

Your comprehensive university demo is now ready! 🎉
