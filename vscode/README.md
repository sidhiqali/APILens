# APILens VS Code Extension - Phase 2 Complete

A VS Code extension that brings your APILens dashboard directly into VS Code.

## Phase 2 Features ✅ + Critical Fixes

✅ **FIXED: Authentication & Navigation Security**
- ✅ Navigation buttons now hidden when not logged in
- ✅ Route protection - redirects to login for unauthorized access  
- ✅ Proper authentication state management
- ✅ Token-based authentication (resolves session expiry)

✅ **FIXED: API Endpoint Integration**
- ✅ Updated all endpoints to match your actual NestJS backend
- ✅ Dashboard: `/dashboard/stats` and `/dashboard/overview`
- ✅ Notifications: `/notifications` with proper params
- ✅ Changelogs: `/changelogs` endpoint  
- ✅ Settings: Uses `/auth/profile` and `/auth/notification-preferences`

✅ **Complete Route System**
- Dashboard with API statistics
- APIs list with management actions  
- Add API form
- Analytics with dashboard overview data
- Notifications center with read/unread status
- Changes/Changelog viewer  
- Issues & Alerts page
- Settings page with user preferences

## Installation & Setup

1. **Install Dependencies**
   ```bash
   cd vscode-extension
   npm install
   ```

2. **Compile TypeScript**
   ```bash
   npm run compile
   ```

3. **Open in VS Code**
   - Open the `vscode-extension` folder in VS Code
   - Press `F5` to launch Extension Development Host
   - This opens a new VS Code window with your extension loaded

4. **Start Your Backend**
   Make sure your NestJS backend is running:
   ```bash
   cd api
   npm start
   ```

5. **Use the Extension**
   - In the Extension Development Host, look for "APILens" in the Activity Bar (left sidebar)
   - Click it to open the panel
   - Login with your existing credentials
   - Start managing your APIs!

## Available Commands

- `APILens: Open Panel` - Open the main APILens panel
- `APILens: Refresh Data` - Refresh the current view
- `APILens: Add API` - Navigate to Add API form
- **NEW**: `APILens: View Analytics` - View performance analytics
- **NEW**: `APILens: View Notifications` - View notifications center
- **NEW**: `APILens: View Changes` - View API changes/changelog

## Configuration

In VS Code settings (`settings.json`):

```json
{
  "apilens.apiUrl": "http://localhost:3000",
  "apilens.autoRefresh": true
}
```

## Development

### Watch Mode
```bash
npm run watch
```

### Packaging
```bash
npm run package
```

## What's Working in Phase 2 + Fixes

- ✅ **CRITICAL FIXES Applied:**
  - ✅ Authentication state properly managed
  - ✅ Navigation hidden when not logged in  
  - ✅ All API endpoints corrected to match backend
  - ✅ Route protection working correctly

- ✅ **All 8 Routes Working:** Dashboard, APIs, Add API, Analytics, Notifications, Changes, Issues, Settings
- ✅ **Enhanced Security:** Proper authentication flow and route guards
- ✅ **Correct API Integration:** All endpoints match your NestJS backend
- ✅ **Real User Data:** Settings shows actual user profile and preferences
- ✅ **Complete API Management** with all CRUD operations
- ✅ **VS Code Integration** with commands and proper theming

## What's Next (Phase 3)

- 🔄 **Real-time WebSocket** notifications from backend
- 🔄 **File Integration** - OpenAPI specs in workspace
- 🔄 **Enhanced API Details** with diff views and version history  
- 🔄 **Status Bar Integration** with quick stats
- 🔄 **Context Menus** for file operations
- 🔄 **Advanced Search** and filtering capabilities

## Troubleshooting

**Extension not loading?**
- Check VS Code Developer Console (`Help > Toggle Developer Tools`)
- Ensure backend is running on port 3000
- Try reloading the Extension Development Host

**Authentication issues?**
- **FIXED in Phase 2**: Now uses token-based auth instead of cookies
- If still having issues, clear VS Code storage: `Developer: Reload Window`
- Check backend CORS settings for your VS Code extension
- Verify backend is accessible at configured URL

**API calls failing?**
- Check network connectivity to backend
- Verify backend is running and healthy at http://localhost:3000
- Check VS Code console for detailed error messages
- Ensure your backend accepts Bearer token authentication

## Architecture

```
src/
├── extension.ts          # Main extension entry point
├── providers/
│   └── WebviewProvider.ts # Webview panel management
├── services/
│   └── APIService.ts     # Backend API communication
└── lib/
    └── router.ts         # Client-side routing
```

The extension uses:
- **WebView API** for rendering the UI
- **VS Code Storage API** for persistent auth state  
- **Message Passing** for webview-extension communication
- **Axios** for HTTP requests to your backend
- **Custom Router** for SPA-like navigation within webview

## Next Steps

Once Phase 1 is working well, we'll move to Phase 2 which adds:
- Complete route coverage
- Advanced VS Code integrations
- Real-time features
- File operations
- Enhanced UI/UX
