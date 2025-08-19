# APILens VS Code Extension

VS Code extension that embeds the APILens dashboard for API monitoring and management.

## Features

- Access APILens dashboard directly in VS Code
- Activity bar integration with APILens icon
- Command palette support
- Status bar quick access

## Usage

1. Start your APILens development server:
   ```bash
   cd client && npm run dev
   ```

2. Install and activate the extension

3. Click the APILens icon in the activity bar or use Command Palette (`Cmd+Shift+P` → "APILens: Open Dashboard")

## Commands

- `APILens: Open Dashboard` - Opens the main dashboard
- `APILens: Open Analytics` - Opens dashboard (navigate to Analytics)
- `APILens: View Notifications` - Opens dashboard (navigate to Notifications)
- `APILens: Add API` - Opens dashboard (use Add API button)
- `APILens: Refresh` - Refreshes the dashboard

## Development

```bash
npm install
npm run compile
code . # then press F5 to run extension
```

## Architecture

Uses iframe approach to embed the existing React application at `http://localhost:3001`.
