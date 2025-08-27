import * as vscode from 'vscode';
import { APIService, ApiData, DashboardStats } from '../services/APIService';
import { router, RouteParams } from '../lib/router';

export class APILensWebviewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'apilens.main';
    private _view?: vscode.WebviewView;

    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly apiService: APIService
    ) {
        this.apiService.setContext(context);
        router.onRouteChange((route, params) => {
            this.handleRouteChange(route, params);
        });
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.context.extensionUri]
        };

        webviewView.webview.html = this.getHtmlForWebview();

        webviewView.webview.onDidReceiveMessage(
            async (message) => {
                await this.handleMessage(message);
            },
            undefined,
            this.context.subscriptions
        );

        setTimeout(() => {
            this.checkAuthAndNavigate();
        }, 100);
    }

    public show() {
        if (this._view) {
            this._view.show(true);
        }
    }

    public refresh() {
        this.handleGetDashboard().catch(() => {
            // Dashboard refresh failed - user might need to login
        });
    }

    public navigateTo(path: string) {
        router.navigate(path);
    }

    private handleRouteChange(route: string, params: RouteParams) {
        this.sendMessage({ type: 'routeChanged', route, params });
    }

    private sendMessage(message: any) {
        if (this._view) {
            this._view.webview.postMessage(message);
        }
    }

    private async checkAuthAndNavigate() {
        try {
            const isAuthenticated = await this.apiService.isAuthenticated();
            
            if (isAuthenticated) {
                this.sendMessage({ type: 'authStatus', data: { isAuthenticated: true } });
                this.handleGetDashboard();
            } else {
                this.sendMessage({ type: 'authStatus', data: { isAuthenticated: false } });
            }
        } catch (error) {
            this.sendMessage({ type: 'authStatus', data: { isAuthenticated: false } });
        }
    }

    private async handleMessage(message: any) {
        switch (message.type) {
            case 'test':
                break;
            case 'login':
                await this.handleLogin(message.data);
                break;
                break;
            case 'getDashboard':
                await this.handleGetDashboard();
                break;
            case 'addApi':
                await this.handleAddApi();
                break;
            case 'logout':
                await this.handleLogout();
                break;
            case 'navigate':
                router.navigate(message.path);
                break;
            case 'getDashboardStats':
                await this.handleGetDashboardStats();
                break;
            case 'getApis':
                await this.handleGetApis(message.params);
                break;
            case 'createApi':
                await this.handleCreateApi(message.data);
                break;
            case 'toggleApiStatus':
                await this.handleToggleApiStatus(message.id);
                break;
            case 'deleteApi':
                await this.handleDeleteApi(message.id);
                break;
            case 'checkApiNow':
                await this.handleCheckApiNow(message.id);
                break;
            case 'getAnalytics':
                await this.handleGetAnalytics(message.params);
                break;
            case 'getNotifications':
                await this.handleGetNotifications(message.params);
                break;
            case 'markNotificationRead':
                await this.handleMarkNotificationRead(message.id);
                break;
            case 'getChangelogs':
                await this.handleGetChangelogs(message.params);
                break;
            case 'updateSettings':
                await this.handleUpdateSettings(message.data);
                break;
        }
    }

    private async handleLogin(credentials: { email: string; password: string }) {
        try {
            await this.apiService.login(credentials.email, credentials.password);
            this.sendMessage({ 
                type: 'loginResponse', 
                data: { success: true } 
            });
            this.sendMessage({ type: 'authStatus', data: { isAuthenticated: true } });
            this.handleGetDashboard();
        } catch (error: any) {
            this.sendMessage({ 
                type: 'loginResponse', 
                data: { 
                    success: false, 
                    error: error.message || 'Login failed' 
                }
            });
        }
    }

    private async handleGetDashboard() {
        try {
            const [stats, apis] = await Promise.all([
                this.apiService.getDashboardStats(),
                this.apiService.getApis()
            ]);
            
            this.sendMessage({ 
                type: 'dashboardData', 
                data: { stats, apis } 
            });
        } catch (error: any) {
            this.sendMessage({ 
                type: 'error', 
                error: error.message 
            });
        }
    }

    private async handleAddApi() {
        // Open VS Code input for API URL
        const url = await vscode.window.showInputBox({
            prompt: 'Enter API URL (e.g., https://api.example.com/openapi.json)',
            placeHolder: 'https://api.example.com/openapi.json',
            validateInput: (value) => {
                if (!value) return 'URL is required';
                try {
                    new URL(value);
                    return null;
                } catch {
                    return 'Please enter a valid URL';
                }
            }
        });

        if (!url) return;

        const name = await vscode.window.showInputBox({
            prompt: 'Enter API name',
            placeHolder: 'My API',
            validateInput: (value) => {
                if (!value) return 'API name is required';
                return null;
            }
        });

        if (!name) return;

        try {
            await this.apiService.createApi({ name, url });
            vscode.window.showInformationMessage('API added successfully!');
            // Refresh dashboard
            await this.handleGetDashboard();
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to add API: ${error.message}`);
        }
    }

    private async handleLogout() {
        try {
            await this.apiService.logout();
            this.sendMessage({ type: 'logoutSuccess' });
            this.sendMessage({ type: 'authStatus', data: { isAuthenticated: false } });
            router.navigate('/login');
        } catch (error: any) {
            this.sendMessage({ 
                type: 'logoutError', 
                error: error.message 
            });
        }
    }

    private async handleGetDashboardStats() {
        try {
            const stats = await this.apiService.getDashboardStats();
            this.sendMessage({ 
                type: 'dashboardStats', 
                data: stats 
            });
        } catch (error: any) {
            this.sendMessage({ 
                type: 'error', 
                error: error.message 
            });
        }
    }

    private async handleGetApis(params: any) {
        try {
            const apis = await this.apiService.getApis(params);
            this.sendMessage({ 
                type: 'apisData', 
                data: apis 
            });
        } catch (error: any) {
            this.sendMessage({ 
                type: 'error', 
                error: error.message 
            });
        }
    }

    private async handleCreateApi(data: any) {
        try {
            const api = await this.apiService.createApi(data);
            this.sendMessage({ 
                type: 'apiCreated', 
                data: api 
            });
            await this.handleGetApis({});
        } catch (error: any) {
            this.sendMessage({ 
                type: 'error', 
                error: error.message 
            });
        }
    }

    private async handleToggleApiStatus(id: string) {
        try {
            await this.apiService.toggleApiStatus(id);
            this.sendMessage({ type: 'apiStatusToggled', id });
            await this.handleGetApis({});
        } catch (error: any) {
            this.sendMessage({ 
                type: 'error', 
                error: error.message 
            });
        }
    }

    private async handleDeleteApi(id: string) {
        try {
            await this.apiService.deleteApi(id);
            this.sendMessage({ type: 'apiDeleted', id });
            await this.handleGetApis({});
        } catch (error: any) {
            this.sendMessage({ 
                type: 'error', 
                error: error.message 
            });
        }
    }

    private async handleCheckApiNow(id: string) {
        try {
            await this.apiService.checkApiNow(id);
            this.sendMessage({ type: 'apiChecked', id });
            vscode.window.showInformationMessage('API check initiated successfully!');
        } catch (error: any) {
            this.sendMessage({ 
                type: 'error', 
                error: error.message 
            });
        }
    }

    private async handleGetAnalytics(params: any) {
        try {
            const analytics = await this.apiService.getAnalytics(params);
            this.sendMessage({ 
                type: 'analyticsData', 
                data: analytics 
            });
        } catch (error: any) {
            this.sendMessage({ 
                type: 'error', 
                error: error.message 
            });
        }
    }

    private async handleGetNotifications(params: any) {
        try {
            const notifications = await this.apiService.getNotifications(params);
            this.sendMessage({ 
                type: 'notificationsData', 
                data: notifications 
            });
        } catch (error: any) {
            this.sendMessage({ 
                type: 'error', 
                error: error.message 
            });
        }
    }

    private async handleMarkNotificationRead(id: string) {
        try {
            await this.apiService.markNotificationAsRead(id);
            this.sendMessage({ type: 'notificationMarkedRead', id });
        } catch (error: any) {
            this.sendMessage({ 
                type: 'error', 
                error: error.message 
            });
        }
    }

    private async handleGetChangelogs(params: any) {
        try {
            const changelogs = await this.apiService.getChangelogs(params);
            this.sendMessage({ 
                type: 'changelogsData', 
                data: changelogs 
            });
        } catch (error: any) {
            this.sendMessage({ 
                type: 'error', 
                error: error.message 
            });
        }
    }

    private async handleUpdateSettings(data: any) {
        try {
            await this.apiService.updateUserSettings(data);
            this.sendMessage({ type: 'settingsUpdated' });
            vscode.window.showInformationMessage('Settings updated successfully!');
        } catch (error: any) {
            this.sendMessage({ 
                type: 'error', 
                error: error.message 
            });
        }
    }

    private getHtmlForWebview(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>APILens</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            height: 100vh;
            overflow: hidden;
        }
        
        /* Login Screen */
        .login-container {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background: var(--vscode-editor-background);
        }
        
        .login-box {
            background: var(--vscode-sideBar-background);
            padding: 2rem 2.5rem;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            min-width: 320px;
            border: 1px solid var(--vscode-panel-border);
        }
        
        .login-box h2 {
            margin-bottom: 1.5rem;
            text-align: center;
            color: var(--vscode-foreground);
        }
        
        .login-box input {
            width: 100%;
            padding: 0.75rem;
            margin-bottom: 1rem;
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
        }
        
        .login-box button {
            width: 100%;
            padding: 0.75rem;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            font-weight: bold;
            cursor: pointer;
            font-size: 0.9rem;
        }
        
        .login-box button:hover {
            background: var(--vscode-button-hoverBackground);
        }
        
        .error {
            color: var(--vscode-errorForeground);
            margin-bottom: 1rem;
            text-align: center;
            font-size: 0.85rem;
        }
        
        /* Main App Layout */
        .app-container {
            display: flex;
            height: 100vh;
        }
        
        /* Sidebar Navigation */
        .sidebar {
            width: 240px;
            background: var(--vscode-sideBar-background);
            border-right: 1px solid var(--vscode-sideBar-border);
            display: flex;
            flex-direction: column;
            overflow-y: auto;
        }
        
        .sidebar-header {
            padding: 1rem;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        
        .sidebar-title {
            font-size: 1.1rem;
            font-weight: bold;
            color: var(--vscode-foreground);
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .sidebar-nav {
            flex: 1;
            padding: 0.5rem 0;
        }
        
        .nav-item {
            display: flex;
            align-items: center;
            padding: 0.75rem 1rem;
            cursor: pointer;
            color: var(--vscode-sideBarTitle-foreground);
            text-decoration: none;
            transition: background-color 0.2s;
            gap: 0.75rem;
        }
        
        .nav-item:hover {
            background: var(--vscode-list-hoverBackground);
        }
        
        .nav-item.active {
            background: var(--vscode-list-activeSelectionBackground);
            color: var(--vscode-list-activeSelectionForeground);
            border-right: 2px solid var(--vscode-button-background);
        }
        
        .nav-icon {
            width: 16px;
            height: 16px;
            opacity: 0.8;
        }
        
        .nav-text {
            font-size: 0.9rem;
        }
        
        /* Main Content Area */
        .main-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        
        .content-header {
            padding: 1rem 1.5rem;
            border-bottom: 1px solid var(--vscode-panel-border);
            background: var(--vscode-editor-background);
        }
        
        .content-title {
            font-size: 1.4rem;
            font-weight: bold;
            color: var(--vscode-foreground);
            margin-bottom: 0.25rem;
        }
        
        .content-subtitle {
            font-size: 0.85rem;
            color: var(--vscode-descriptionForeground);
        }
        
        .content-body {
            flex: 1;
            padding: 1.5rem;
            overflow-y: auto;
            background: var(--vscode-editor-background);
        }
        
        /* Dashboard Styles */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        
        .stat-card {
            background: var(--vscode-sideBar-background);
            padding: 1.25rem;
            border-radius: 6px;
            border: 1px solid var(--vscode-panel-border);
            position: relative;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .stat-card:hover {
            background: var(--vscode-list-hoverBackground);
        }
        
        .stat-card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.75rem;
        }
        
        .stat-title {
            font-size: 0.8rem;
            color: var(--vscode-descriptionForeground);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 500;
        }
        
        .stat-icon {
            width: 20px;
            height: 20px;
            opacity: 0.6;
        }
        
        .stat-value {
            font-size: 2rem;
            font-weight: bold;
            color: var(--vscode-foreground);
            line-height: 1;
        }
        
        .stat-change {
            font-size: 0.75rem;
            margin-top: 0.5rem;
            color: var(--vscode-descriptionForeground);
        }
        
        .apis-section {
            background: var(--vscode-sideBar-background);
            border-radius: 6px;
            border: 1px solid var(--vscode-panel-border);
            overflow: hidden;
        }
        
        .section-header {
            padding: 1rem 1.25rem;
            border-bottom: 1px solid var(--vscode-panel-border);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .section-title {
            font-size: 1rem;
            font-weight: 600;
            color: var(--vscode-foreground);
        }
        
        .add-btn {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.8rem;
            font-weight: 500;
        }
        
        .add-btn:hover {
            background: var(--vscode-button-hoverBackground);
        }
        
        .apis-list {
            max-height: 300px;
            overflow-y: auto;
        }
        
        .api-item {
            padding: 1rem 1.25rem;
            border-bottom: 1px solid var(--vscode-panel-border);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .api-item:last-child {
            border-bottom: none;
        }
        
        .api-info h4 {
            margin: 0 0 0.25rem 0;
            color: var(--vscode-foreground);
            font-size: 0.9rem;
        }
        
        .api-info .url {
            font-size: 0.75rem;
            color: var(--vscode-descriptionForeground);
            font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
        }
        
        .api-status {
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.7rem;
            font-weight: 500;
            text-transform: uppercase;
        }
        
        .status-active {
            background: rgba(22, 163, 74, 0.1);
            color: rgb(22, 163, 74);
            border: 1px solid rgba(22, 163, 74, 0.2);
        }
        
        .status-inactive {
            background: rgba(239, 68, 68, 0.1);
            color: rgb(239, 68, 68);
            border: 1px solid rgba(239, 68, 68, 0.2);
        }
        
        .empty-state {
            text-align: center;
            padding: 2rem;
            color: var(--vscode-descriptionForeground);
        }
        
        .empty-state-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
            opacity: 0.3;
        }
        
        .placeholder-content {
            text-align: center;
            padding: 3rem;
            color: var(--vscode-descriptionForeground);
        }
        
        .placeholder-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
            opacity: 0.4;
        }
        
        .hidden {
            display: none !important;
        }
        
        /* Notifications Styles */
        .notifications-container {
            padding: 1.5rem;
        }

        .notifications-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
            gap: 1rem;
        }

        .notifications-filters {
            display: flex;
            gap: 1rem;
            align-items: center;
            flex-wrap: wrap;
        }

        .notification-actions {
            display: flex;
            gap: 0.5rem;
        }

        .notifications-stats {
            display: flex;
            gap: 1rem;
        }

        .stat-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 1rem;
            border: 1px solid var(--vscode-widget-border);
            border-radius: 6px;
            min-width: 80px;
        }

        .stat-card.unread {
            border-color: var(--vscode-charts-blue);
            background: rgba(59, 130, 246, 0.1);
        }

        .stat-card.critical {
            border-color: var(--vscode-errorForeground);
            background: rgba(239, 68, 68, 0.1);
        }

        .stat-number {
            font-size: 1.5rem;
            font-weight: bold;
            color: var(--vscode-foreground);
        }

        .stat-label {
            font-size: 0.8rem;
            color: var(--vscode-descriptionForeground);
        }

        .notifications-list {
            space-y: 1rem;
        }

        .notification-item {
            border: 1px solid var(--vscode-widget-border);
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1rem;
            background: var(--vscode-editor-background);
        }

        .notification-item.unread {
            border-left: 4px solid var(--vscode-charts-blue);
            background: rgba(59, 130, 246, 0.05);
        }

        .notification-item.critical {
            border-left: 4px solid var(--vscode-errorForeground);
        }

        .notification-item.high {
            border-left: 4px solid var(--vscode-charts-orange);
        }

        .notification-header {
            display: flex;
            align-items: flex-start;
            gap: 1rem;
            margin-bottom: 0.5rem;
        }

        .notification-icon {
            font-size: 1.2rem;
            flex-shrink: 0;
        }

        .notification-meta {
            flex: 1;
        }

        .notification-title {
            font-weight: 600;
            margin-bottom: 0.25rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .unread-dot {
            color: var(--vscode-charts-blue);
            font-size: 0.8rem;
        }

        .notification-details {
            display: flex;
            gap: 1rem;
            font-size: 0.8rem;
            color: var(--vscode-descriptionForeground);
            flex-wrap: wrap;
        }

        .notification-priority-badge {
            padding: 0.2rem 0.5rem;
            border-radius: 4px;
            font-size: 0.7rem;
            font-weight: bold;
            color: white;
        }

        .notification-priority-badge.critical {
            background: var(--vscode-errorForeground);
        }

        .notification-priority-badge.high {
            background: var(--vscode-charts-orange);
        }

        .notification-priority-badge.medium {
            background: var(--vscode-charts-blue);
        }

        .notification-priority-badge.low {
            background: var(--vscode-descriptionForeground);
        }

        .notification-actions-quick {
            display: flex;
            gap: 0.25rem;
        }

        .notification-content {
            margin: 0.5rem 0;
        }

        .notification-description {
            margin-bottom: 0.5rem;
        }

        .notification-changes ul {
            margin: 0.5rem 0;
            padding-left: 1.5rem;
        }

        .notification-action-required {
            padding: 0.75rem;
            background: rgba(239, 68, 68, 0.1);
            border-left: 4px solid var(--vscode-errorForeground);
            border-radius: 4px;
            margin-top: 0.5rem;
        }

        .notification-actions {
            display: flex;
            gap: 0.5rem;
            margin-top: 1rem;
            flex-wrap: wrap;
        }

        /* Analytics Styles */
        .analytics-container {
            padding: 1.5rem;
        }

        .analytics-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            gap: 1rem;
        }

        .analytics-filters {
            display: flex;
            gap: 1rem;
            align-items: center;
            flex-wrap: wrap;
        }

        .analytics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 1.5rem;
        }

        .analytics-card {
            border: 1px solid var(--vscode-widget-border);
            border-radius: 8px;
            padding: 1.5rem;
            background: var(--vscode-editor-background);
        }

        .analytics-card h3 {
            margin: 0 0 1rem 0;
            color: var(--vscode-foreground);
            font-size: 1.1rem;
        }

        .analytics-card.overview {
            grid-column: 1 / -1;
        }

        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
        }

        .metric-item {
            text-align: center;
            padding: 1rem;
            border: 1px solid var(--vscode-widget-border);
            border-radius: 6px;
        }

        .metric-value {
            font-size: 2rem;
            font-weight: bold;
            color: var(--vscode-foreground);
        }

        .metric-label {
            font-size: 0.9rem;
            color: var(--vscode-descriptionForeground);
            margin: 0.5rem 0;
        }

        .metric-change {
            font-size: 0.8rem;
            font-weight: bold;
        }

        .metric-change.positive {
            color: var(--vscode-charts-green);
        }

        .metric-change.negative {
            color: var(--vscode-errorForeground);
        }

        .chart-container {
            height: 200px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .simple-chart {
            display: flex;
            align-items: end;
            justify-content: space-around;
            height: 150px;
            width: 100%;
            gap: 0.5rem;
        }

        .chart-bar {
            display: flex;
            flex-direction: column;
            align-items: center;
            flex: 1;
            max-width: 60px;
        }

        .bar-value {
            font-size: 0.8rem;
            margin-bottom: 0.25rem;
            color: var(--vscode-foreground);
        }

        .bar {
            width: 100%;
            background: var(--vscode-charts-blue);
            border-radius: 4px 4px 0 0;
            min-height: 4px;
            transition: all 0.3s;
        }

        .bar:hover {
            background: var(--vscode-charts-purple);
        }

        .bar-label {
            font-size: 0.7rem;
            margin-top: 0.25rem;
            color: var(--vscode-descriptionForeground);
        }

        .top-apis-list {
            space-y: 1rem;
        }

        .top-api-item {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 0.75rem;
            border: 1px solid var(--vscode-widget-border);
            border-radius: 6px;
            margin-bottom: 0.5rem;
        }

        .api-rank {
            font-weight: bold;
            color: var(--vscode-charts-blue);
            min-width: 1.5rem;
        }

        .api-info {
            flex: 1;
        }

        .api-name {
            font-weight: 600;
            margin-bottom: 0.25rem;
        }

        .api-changes {
            font-size: 0.8rem;
            color: var(--vscode-descriptionForeground);
        }

        .api-status {
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: bold;
            text-transform: capitalize;
        }

        .api-status.healthy {
            background: rgba(16, 185, 129, 0.2);
            color: var(--vscode-charts-green);
        }

        .api-status.warning {
            background: rgba(245, 158, 11, 0.2);
            color: var(--vscode-charts-orange);
        }

        .api-status.error {
            background: rgba(239, 68, 68, 0.2);
            color: var(--vscode-errorForeground);
        }

        .activity-timeline {
            space-y: 1rem;
        }

        .activity-item {
            display: flex;
            gap: 1rem;
            padding: 0.75rem;
            border-left: 3px solid var(--vscode-widget-border);
            margin-bottom: 1rem;
        }

        .activity-icon {
            font-size: 1.1rem;
            flex-shrink: 0;
        }

        .activity-content {
            flex: 1;
        }

        .activity-message {
            margin-bottom: 0.25rem;
        }

        .activity-time {
            font-size: 0.8rem;
            color: var(--vscode-descriptionForeground);
        }

        .health-grid {
            display: flex;
            justify-content: space-around;
            gap: 1rem;
        }

        .health-item {
            text-align: center;
            padding: 1rem;
            border-radius: 6px;
            flex: 1;
        }

        .health-item.healthy {
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .health-item.warning {
            background: rgba(245, 158, 11, 0.1);
            border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .health-item.error {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .health-icon {
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
        }

        .health-count {
            font-size: 1.5rem;
            font-weight: bold;
            color: var(--vscode-foreground);
        }

        .health-label {
            font-size: 0.9rem;
            color: var(--vscode-descriptionForeground);
        }

        .change-types-list {
            space-y: 1rem;
        }

        .change-type-item {
            margin-bottom: 1rem;
        }

        .change-type-bar {
            height: 24px;
            background: var(--vscode-widget-border);
            border-radius: 12px;
            overflow: hidden;
            margin-bottom: 0.5rem;
        }

        .change-type-fill {
            height: 100%;
            border-radius: 12px;
            transition: width 0.5s ease;
        }

        .change-type-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .change-type-label {
            color: var(--vscode-foreground);
        }

        .change-type-count {
            color: var(--vscode-descriptionForeground);
            font-weight: bold;
        }

        .performance-grid {
            space-y: 1rem;
        }

        .performance-metric {
            margin-bottom: 1rem;
        }

        .performance-metric .metric-label {
            font-size: 0.9rem;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 0.5rem;
        }

        .performance-metric .metric-value {
            font-size: 1.2rem;
            font-weight: bold;
            color: var(--vscode-foreground);
            margin-bottom: 0.5rem;
        }

        .metric-bar {
            height: 8px;
            background: var(--vscode-widget-border);
            border-radius: 4px;
            overflow: hidden;
        }

        .metric-fill {
            height: 100%;
            background: var(--vscode-charts-blue);
            border-radius: 4px;
            transition: width 0.5s ease;
        }

        .metric-fill.success {
            background: var(--vscode-charts-green);
        }

        .metric-fill.error {
            background: var(--vscode-errorForeground);
        }

        /* Settings Styles */
        .settings-container {
            padding: 1.5rem;
            max-width: 1200px;
            margin: 0 auto;
        }

        .settings-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            gap: 1rem;
            flex-wrap: wrap;
        }

        .settings-header h2 {
            margin: 0;
            color: var(--vscode-foreground);
        }

        .settings-actions {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
        }

        .settings-sections {
            space-y: 2rem;
        }

        .settings-section {
            border: 1px solid var(--vscode-widget-border);
            border-radius: 8px;
            padding: 1.5rem;
            margin-bottom: 2rem;
            background: var(--vscode-editor-background);
        }

        .settings-section h3 {
            margin: 0 0 1.5rem 0;
            color: var(--vscode-foreground);
            font-size: 1.1rem;
            border-bottom: 1px solid var(--vscode-widget-border);
            padding-bottom: 0.5rem;
        }

        .settings-group {
            space-y: 1.5rem;
        }

        .setting-item {
            margin-bottom: 1.5rem;
        }

        .setting-item label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
            color: var(--vscode-foreground);
        }

        .setting-item.checkbox {
            display: flex;
            align-items: flex-start;
            gap: 0.5rem;
        }

        .setting-item.checkbox label {
            margin-bottom: 0;
            flex: 1;
        }

        .setting-item.checkbox input[type="checkbox"] {
            margin-top: 0.2rem;
        }

        .setting-item input,
        .setting-item select {
            width: 100%;
            max-width: 400px;
            padding: 0.5rem;
            border: 1px solid var(--vscode-widget-border);
            border-radius: 4px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            font-size: 0.9rem;
        }

        .setting-item input[type="checkbox"] {
            width: auto;
            margin-right: 0.5rem;
        }

        .setting-item input:focus,
        .setting-item select:focus {
            outline: 1px solid var(--vscode-focusBorder);
            outline-offset: -1px;
        }

        .setting-description {
            font-size: 0.8rem;
            color: var(--vscode-descriptionForeground);
            margin-top: 0.25rem;
            line-height: 1.4;
        }

        .settings-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 3rem;
            padding-top: 2rem;
            border-top: 1px solid var(--vscode-widget-border);
            gap: 1rem;
            flex-wrap: wrap;
        }

        .settings-info {
            color: var(--vscode-descriptionForeground);
            font-size: 0.8rem;
        }

        .empty-state-small {
            text-align: center;
            color: var(--vscode-descriptionForeground);
            font-style: italic;
            padding: 2rem;
        }

        /* Loading Styles */
        .loading-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 3rem;
            color: var(--vscode-descriptionForeground);
        }

        .loading-spinner {
            font-size: 2rem;
            margin-bottom: 1rem;
            animation: spin 2s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div id="app">
        <!-- Login Screen -->
        <div id="login-screen" class="login-container">
            <div class="login-box">
                <h2>APILens Login</h2>
                <div id="error" class="error"></div>
                <input id="email" type="email" placeholder="Email" autocomplete="username" value="sidhiq@gmail.com" />
                <input id="password" type="password" placeholder="Password" autocomplete="current-password" value="alialiali" />
                <button id="loginBtn">Login</button>
            </div>
        </div>
        
        <!-- Main App -->
        <div id="main-app" class="app-container hidden">
            <!-- Sidebar Navigation -->
            <nav class="sidebar">
                <div class="sidebar-header">
                    <div class="sidebar-title">
                        <span>🌐</span>
                        APILens
                    </div>
                </div>
                <div class="sidebar-nav">
                    <a href="#" class="nav-item active" data-tab="dashboard">
                        <span class="nav-icon">📊</span>
                        <span class="nav-text">Dashboard</span>
                    </a>
                    <a href="#" class="nav-item" data-tab="add-api">
                        <span class="nav-icon">➕</span>
                        <span class="nav-text">Add API</span>
                    </a>
                    <a href="#" class="nav-item" data-tab="apis">
                        <span class="nav-icon">🔗</span>
                        <span class="nav-text">APIs</span>
                    </a>
                    <a href="#" class="nav-item" data-tab="changes">
                        <span class="nav-icon">🔄</span>
                        <span class="nav-text">Changes</span>
                    </a>
                    <a href="#" class="nav-item" data-tab="issues">
                        <span class="nav-icon">⚠️</span>
                        <span class="nav-text">Issues & Alerts</span>
                    </a>
                    <a href="#" class="nav-item" data-tab="notifications">
                        <span class="nav-icon">🔔</span>
                        <span class="nav-text">Notifications</span>
                    </a>
                    <a href="#" class="nav-item" data-tab="analytics">
                        <span class="nav-icon">📈</span>
                        <span class="nav-text">Analytics</span>
                    </a>
                    <a href="#" class="nav-item" data-tab="settings">
                        <span class="nav-icon">⚙️</span>
                        <span class="nav-text">Settings</span>
                    </a>
                </div>
            </nav>
            
            <!-- Main Content -->
            <main class="main-content">
                <div class="content-header">
                    <div class="content-title" id="content-title">Dashboard</div>
                    <div class="content-subtitle" id="content-subtitle">Monitor your APIs and track changes</div>
                </div>
                <div class="content-body" id="content-body">
                    <!-- Content will be injected here -->
                </div>
            </main>
        </div>
    </div>
    
    <script>
        const vscode = acquireVsCodeApi();
        let currentTab = 'dashboard';
        let appData = {};
        
        // Listen for messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.type) {
                case 'authStatus':
                    handleAuthStatus(message.data.isAuthenticated || message.isAuthenticated);
                    break;
                case 'loginResponse':
                    handleLoginResponse(message.data);
                    break;
                case 'dashboardData':
                    appData.dashboard = message.data;
                    if (currentTab === 'dashboard') {
                        renderDashboard(message.data);
                    }
                    break;
                case 'apisData':
                    appData.apis = message.data;
                    if (currentTab === 'apis') {
                        renderApis(message.data);
                    }
                    break;
            }
        });
        
        function handleLoginResponse(data) {
            if (data.success) {
                document.getElementById('login-screen').classList.add('hidden');
                document.getElementById('main-app').classList.remove('hidden');
                // Request initial dashboard data
                vscode.postMessage({ type: 'getDashboard' });
            } else {
                document.getElementById('error').textContent = data.error || 'Login failed';
            }
        }
        
        function switchTab(tabName) {
            // Update active nav item
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            document.querySelector(\`[data-tab="\${tabName}"]\`).classList.add('active');
            
            currentTab = tabName;
            
            // Update content header and body based on tab
            switch (tabName) {
                case 'dashboard':
                    updateContentHeader('Dashboard', 'Monitor your APIs and track changes');
                    if (appData.dashboard) {
                        renderDashboard(appData.dashboard);
                    } else {
                        vscode.postMessage({ type: 'getDashboard' });
                    }
                    break;
                case 'add-api':
                    updateContentHeader('Add New API', 'Configure monitoring for a new API endpoint');
                    renderAddApiForm();
                    break;
                case 'apis':
                    updateContentHeader('APIs', 'Manage and monitor your API endpoints');
                    renderApisList();
                    break;
                case 'changes':
                    updateContentHeader('API Changes', 'Track all changes across your APIs with detailed history');
                    renderChanges();
                    break;
                case 'issues':
                    updateContentHeader('Issues & Alerts', 'Monitor critical issues, health problems, and performance alerts');
                    renderIssues();
                    break;
                case 'notifications':
                    updateContentHeader('Notifications', 'View and manage your API notifications');
                    renderNotifications();
                    break;
                case 'analytics':
                    updateContentHeader('Analytics Dashboard', 'Comprehensive insights into your API ecosystem');
                    renderAnalytics();
                    break;
                case 'settings':
                    updateContentHeader('Settings', 'Manage your account and notification preferences');
                    renderSettings();
                    break;
            }
        }
        
        function updateContentHeader(title, subtitle) {
            document.getElementById('content-title').textContent = title;
            document.getElementById('content-subtitle').textContent = subtitle;
        }
        
        function renderDashboard(data) {
            const content = \`
                <div class="stats-grid">
                    <div class="stat-card" onclick="switchTab('apis')">
                        <div class="stat-card-header">
                            <span class="stat-title">Total APIs</span>
                            <span class="stat-icon">📊</span>
                        </div>
                        <div class="stat-value">\${data.stats?.totalApis || 0}</div>
                        <div class="stat-change">Click to view all APIs →</div>
                    </div>
                    <div class="stat-card" onclick="switchTab('apis')">
                        <div class="stat-card-header">
                            <span class="stat-title">Active Monitoring</span>
                            <span class="stat-icon">✅</span>
                        </div>
                        <div class="stat-value">\${data.stats?.activeApis || 0}</div>
                        <div class="stat-change">Click to view active APIs →</div>
                    </div>
                    <div class="stat-card" onclick="switchTab('changes')">
                        <div class="stat-card-header">
                            <span class="stat-title">Total Changes</span>
                            <span class="stat-icon">🔄</span>
                        </div>
                        <div class="stat-value">\${data.stats?.recentChanges || 0}</div>
                        <div class="stat-change">Click to view all changes →</div>
                    </div>
                    <div class="stat-card" onclick="switchTab('issues')">
                        <div class="stat-card-header">
                            <span class="stat-title">Critical Issues</span>
                            <span class="stat-icon">⚠️</span>
                        </div>
                        <div class="stat-value">\${data.stats?.notifications || 0}</div>
                        <div class="stat-change">Click to view issues & alerts →</div>
                    </div>
                </div>
                
                <div class="apis-section">
                    <div class="section-header">
                        <span class="section-title">Your APIs</span>
                        <button class="add-btn" onclick="switchTab('add-api')">+ Add New API</button>
                    </div>
                    <div class="apis-list">
                        \${renderApiItems(data.apis || [])}
                    </div>
                </div>
            \`;
            document.getElementById('content-body').innerHTML = content;
        }
        
        function renderApiItems(apis) {
            if (!apis || apis.length === 0) {
                return \`
                    <div class="empty-state">
                        <div class="empty-state-icon">🔗</div>
                        <div>No APIs registered yet</div>
                        <div style="margin-top: 0.5rem; font-size: 0.8rem;">Click "Add New API" to get started!</div>
                    </div>
                \`;
            }
            
            return apis.map(api => \`
                <div class="api-item">
                    <div class="api-info">
                        <h4>\${api.apiName || api.name || 'Unnamed API'}</h4>
                        <div class="url">\${api.openApiUrl || api.url || 'No URL'}</div>
                    </div>
                    <div class="api-status \${api.isActive ? 'status-active' : 'status-inactive'}">
                        \${api.isActive ? 'Active' : 'Inactive'}
                    </div>
                </div>
            \`).join('');
        }
        
        function renderAddApiForm() {
            document.getElementById('content-body').innerHTML = \`
                <div class="add-api-container">
                    <div class="form-section">
                        <h3>Add New API</h3>
                        <p class="form-description">Register a new API endpoint for monitoring and change detection.</p>
                        
                        <form id="add-api-form" class="api-form">
                            <div class="form-group">
                                <label for="api-name">API Name *</label>
                                <input type="text" id="api-name" name="apiName" placeholder="e.g., User Management API" required>
                                <small>A descriptive name for your API</small>
                            </div>
                            
                            <div class="form-group">
                                <label for="api-url">OpenAPI Specification URL *</label>
                                <input type="url" id="api-url" name="openApiUrl" placeholder="https://api.example.com/openapi.json" required>
                                <small>URL to your OpenAPI/Swagger JSON specification</small>
                            </div>
                            
                            <div class="form-group">
                                <label for="api-type">API Type</label>
                                <select id="api-type" name="type">
                                    <option value="rest">REST API</option>
                                    <option value="graphql">GraphQL</option>
                                    <option value="grpc">gRPC</option>
                                    <option value="websocket">WebSocket</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="api-description">Description</label>
                                <textarea id="api-description" name="description" placeholder="Brief description of what this API does..." rows="3"></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label for="check-frequency">Check Frequency</label>
                                <select id="check-frequency" name="checkFrequency">
                                    <option value="5m">Every 5 minutes</option>
                                    <option value="15m">Every 15 minutes</option>
                                    <option value="1h" selected>Every hour</option>
                                    <option value="6h">Every 6 hours</option>
                                    <option value="1d">Daily</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="api-tags">Tags</label>
                                <input type="text" id="api-tags" name="tags" placeholder="production, v1, core, external">
                                <small>Comma-separated tags for organization</small>
                            </div>
                            
                            <div class="form-actions">
                                <button type="button" class="btn-secondary" onclick="switchTab('dashboard')">Cancel</button>
                                <button type="submit" class="btn-primary">Add API</button>
                            </div>
                        </form>
                    </div>
                    
                    <div class="help-section">
                        <h4>💡 Tips</h4>
                        <ul>
                            <li>Ensure your OpenAPI URL is publicly accessible</li>
                            <li>Use descriptive names and tags for better organization</li>
                            <li>Start with hourly checks for new APIs</li>
                            <li>Test your API URL before adding</li>
                        </ul>
                        
                        <h4>📋 Supported Formats</h4>
                        <ul>
                            <li>OpenAPI 3.0/3.1 (JSON/YAML)</li>
                            <li>Swagger 2.0 (JSON/YAML)</li>
                            <li>API Blueprint</li>
                            <li>RAML</li>
                        </ul>
                    </div>
                </div>
            \`;
            
            // Add form submission handler
            document.getElementById('add-api-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const apiData = {
                    apiName: formData.get('apiName'),
                    openApiUrl: formData.get('openApiUrl'),
                    type: formData.get('type'),
                    description: formData.get('description'),
                    checkFrequency: formData.get('checkFrequency'),
                    tags: formData.get('tags') ? formData.get('tags').split(',').map(tag => tag.trim()) : []
                };
                
                try {
                    vscode.postMessage({ type: 'createApi', data: apiData });
                    // Form will be reset after successful creation
                } catch (error) {
                    console.error('Error creating API:', error);
                }
            });
        }
        
        function renderApisList() {
            if (!appData.apis) {
                vscode.postMessage({ type: 'getApis', params: {} });
                document.getElementById('content-body').innerHTML = \`
                    <div class="loading-content">
                        <div class="loading-spinner">⏳</div>
                        <div>Loading APIs...</div>
                    </div>
                \`;
                return;
            }
            
            document.getElementById('content-body').innerHTML = \`
                <div class="apis-management">
                    <div class="apis-header">
                        <div class="apis-controls">
                            <div class="search-filter">
                                <input type="text" id="api-search" placeholder="Search APIs..." class="search-input">
                                <select id="status-filter" class="filter-select">
                                    <option value="">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                                <select id="health-filter" class="filter-select">
                                    <option value="">All Health</option>
                                    <option value="healthy">Healthy</option>
                                    <option value="unhealthy">Unhealthy</option>
                                    <option value="checking">Checking</option>
                                    <option value="unknown">Unknown</option>
                                </select>
                            </div>
                            <div class="bulk-actions">
                                <button class="btn-secondary" onclick="selectAllApis()">Select All</button>
                                <button class="btn-secondary" onclick="bulkToggleStatus()">Toggle Status</button>
                                <button class="btn-danger" onclick="bulkDeleteApis()">Delete Selected</button>
                            </div>
                        </div>
                        <div class="apis-stats">
                            <span class="stat">Total: \${appData.apis.length}</span>
                            <span class="stat">Active: \${appData.apis.filter(api => api.isActive).length}</span>
                            <span class="stat">Healthy: \${appData.apis.filter(api => api.healthStatus === 'healthy').length}</span>
                        </div>
                    </div>
                    
                    <div class="apis-table">
                        \${renderApisTable(appData.apis)}
                    </div>
                </div>
            \`;
            
            // Add event listeners
            document.getElementById('api-search').addEventListener('input', filterApis);
            document.getElementById('status-filter').addEventListener('change', filterApis);
            document.getElementById('health-filter').addEventListener('change', filterApis);
        }
        
        function renderApisTable(apis) {
            if (!apis || apis.length === 0) {
                return \`
                    <div class="empty-state">
                        <div class="empty-state-icon">🔗</div>
                        <div>No APIs found</div>
                        <button class="btn-primary" onclick="switchTab('add-api')" style="margin-top: 1rem;">Add Your First API</button>
                    </div>
                \`;
            }
            
            return \`
                <table class="apis-table-content">
                    <thead>
                        <tr>
                            <th><input type="checkbox" id="select-all-checkbox"></th>
                            <th>Name</th>
                            <th>URL</th>
                            <th>Type</th>
                            <th>Status</th>
                            <th>Health</th>
                            <th>Last Checked</th>
                            <th>Changes</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        \${apis.map(api => \`
                            <tr data-api-id="\${api._id || api.id}">
                                <td><input type="checkbox" class="api-checkbox" value="\${api._id || api.id}"></td>
                                <td>
                                    <div class="api-name">
                                        <strong>\${api.apiName || api.name || 'Unnamed API'}</strong>
                                        \${api.description ? \`<div class="api-description">\${api.description}</div>\` : ''}
                                        \${api.tags && api.tags.length ? \`<div class="api-tags">\${api.tags.map(tag => \`<span class="tag">\${tag}</span>\`).join('')}</div>\` : ''}
                                    </div>
                                </td>
                                <td>
                                    <div class="api-url">
                                        <a href="\${api.openApiUrl || api.url}" target="_blank" title="Open in new tab">
                                            \${(api.openApiUrl || api.url || '').substring(0, 50)}...
                                        </a>
                                    </div>
                                </td>
                                <td><span class="api-type">\${api.type || 'REST'}</span></td>
                                <td>
                                    <span class="status-badge \${api.isActive ? 'status-active' : 'status-inactive'}">
                                        \${api.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>
                                    <span class="health-badge health-\${api.healthStatus || 'unknown'}">
                                        \${getHealthIcon(api.healthStatus)} \${(api.healthStatus || 'unknown').charAt(0).toUpperCase() + (api.healthStatus || 'unknown').slice(1)}
                                    </span>
                                </td>
                                <td>
                                    <div class="last-checked">
                                        \${api.lastChecked ? formatDate(api.lastChecked) : 'Never'}
                                        \${api.checkFrequency ? \`<div class="check-frequency">Every \${api.checkFrequency}</div>\` : ''}
                                    </div>
                                </td>
                                <td>
                                    <span class="change-count">\${api.changeCount || 0}</span>
                                </td>
                                <td>
                                    <div class="api-actions">
                                        <button class="btn-icon" onclick="toggleApiStatus('\${api._id || api.id}')" title="Toggle Status">
                                            \${api.isActive ? '⏸️' : '▶️'}
                                        </button>
                                        <button class="btn-icon" onclick="checkApiNow('\${api._id || api.id}')" title="Check Now">🔄</button>
                                        <button class="btn-icon" onclick="viewApiDetails('\${api._id || api.id}')" title="View Details">👁️</button>
                                        <button class="btn-icon btn-danger" onclick="deleteApi('\${api._id || api.id}')" title="Delete">🗑️</button>
                                    </div>
                                </td>
                            </tr>
                        \`).join('')}
                    </tbody>
                </table>
            \`;
        }
        
        function getHealthIcon(status) {
            switch(status) {
                case 'healthy': return '✅';
                case 'unhealthy': return '❌';
                case 'checking': return '⏳';
                case 'unknown': default: return '❓';
            }
        }
        
        function formatDate(dateString) {
            try {
                const date = new Date(dateString);
                return date.toLocaleString();
            } catch {
                return 'Invalid date';
            }
        }
        
        function filterApis() {
            const searchTerm = document.getElementById('api-search').value.toLowerCase();
            const statusFilter = document.getElementById('status-filter').value;
            const healthFilter = document.getElementById('health-filter').value;
            
            const rows = document.querySelectorAll('.apis-table-content tbody tr');
            rows.forEach(row => {
                const apiData = appData.apis.find(api => (api._id || api.id) === row.dataset.apiId);
                if (!apiData) return;
                
                const matchesSearch = !searchTerm || 
                    (apiData.apiName || apiData.name || '').toLowerCase().includes(searchTerm) ||
                    (apiData.description || '').toLowerCase().includes(searchTerm) ||
                    (apiData.openApiUrl || apiData.url || '').toLowerCase().includes(searchTerm);
                
                const matchesStatus = !statusFilter || 
                    (statusFilter === 'active' && apiData.isActive) ||
                    (statusFilter === 'inactive' && !apiData.isActive);
                
                const matchesHealth = !healthFilter || apiData.healthStatus === healthFilter;
                
                row.style.display = matchesSearch && matchesStatus && matchesHealth ? '' : 'none';
            });
        }
        
        function toggleApiStatus(apiId) {
            vscode.postMessage({ type: 'toggleApiStatus', id: apiId });
        }
        
        function checkApiNow(apiId) {
            vscode.postMessage({ type: 'checkApiNow', id: apiId });
        }
        
        function deleteApi(apiId) {
            if (confirm('Are you sure you want to delete this API? This action cannot be undone.')) {
                vscode.postMessage({ type: 'deleteApi', id: apiId });
            }
        }
        
        function viewApiDetails(apiId) {
            // Future implementation for API details view
        }
        
        function selectAllApis() {
            const checkboxes = document.querySelectorAll('.api-checkbox');
            const allChecked = Array.from(checkboxes).every(cb => cb.checked);
            checkboxes.forEach(cb => cb.checked = !allChecked);
        }
        
        function bulkToggleStatus() {
            const selectedIds = Array.from(document.querySelectorAll('.api-checkbox:checked')).map(cb => cb.value);
            if (selectedIds.length === 0) {
                alert('Please select APIs to toggle status.');
                return;
            }
            selectedIds.forEach(id => toggleApiStatus(id));
        }
        
        function bulkDeleteApis() {
            const selectedIds = Array.from(document.querySelectorAll('.api-checkbox:checked')).map(cb => cb.value);
            if (selectedIds.length === 0) {
                alert('Please select APIs to delete.');
                return;
            }
            if (confirm(\`Are you sure you want to delete \${selectedIds.length} APIs? This action cannot be undone.\`)) {
                selectedIds.forEach(id => deleteApi(id));
            }
        }
        
        function renderChanges() {
            if (!appData.changelogs) {
                vscode.postMessage({ type: 'getChangelogs', params: {} });
                document.getElementById('content-body').innerHTML = \`
                    <div class="loading-content">
                        <div class="loading-spinner">⏳</div>
                        <div>Loading changes...</div>
                    </div>
                \`;
                return;
            }
            
            document.getElementById('content-body').innerHTML = \`
                <div class="changes-container">
                    <div class="changes-header">
                        <div class="changes-filters">
                            <select id="api-filter" class="filter-select">
                                <option value="">All APIs</option>
                                \${(appData.apis || []).map(api => \`
                                    <option value="\${api._id || api.id}">\${api.apiName || api.name}</option>
                                \`).join('')}
                            </select>
                            <select id="change-type-filter" class="filter-select">
                                <option value="">All Changes</option>
                                <option value="breaking">Breaking Changes</option>
                                <option value="addition">Additions</option>
                                <option value="modification">Modifications</option>
                                <option value="deprecation">Deprecations</option>
                                <option value="removal">Removals</option>
                            </select>
                            <select id="severity-filter" class="filter-select">
                                <option value="">All Severity</option>
                                <option value="critical">Critical</option>
                                <option value="major">Major</option>
                                <option value="minor">Minor</option>
                                <option value="patch">Patch</option>
                            </select>
                            <input type="date" id="date-filter" class="filter-input">
                        </div>
                        <div class="changes-stats">
                            <div class="stat-card">
                                <span class="stat-number">\${(appData.changelogs || []).length}</span>
                                <span class="stat-label">Total Changes</span>
                            </div>
                            <div class="stat-card">
                                <span class="stat-number">\${(appData.changelogs || []).filter(c => c.severity === 'critical').length}</span>
                                <span class="stat-label">Critical</span>
                            </div>
                            <div class="stat-card">
                                <span class="stat-number">\${(appData.changelogs || []).filter(c => c.type === 'breaking').length}</span>
                                <span class="stat-label">Breaking</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="changes-timeline">
                        \${renderChangesTimeline(appData.changelogs || [])}
                    </div>
                </div>
            \`;
            
            // Add event listeners
            document.getElementById('api-filter').addEventListener('change', filterChanges);
            document.getElementById('change-type-filter').addEventListener('change', filterChanges);
            document.getElementById('severity-filter').addEventListener('change', filterChanges);
            document.getElementById('date-filter').addEventListener('change', filterChanges);
        }
        
        function renderChangesTimeline(changes) {
            if (!changes || changes.length === 0) {
                return \`
                    <div class="empty-state">
                        <div class="empty-state-icon">🔄</div>
                        <div>No changes detected yet</div>
                        <div style="margin-top: 0.5rem; font-size: 0.8rem;">Changes will appear here when API modifications are detected</div>
                    </div>
                \`;
            }
            
            // Group changes by date
            const groupedChanges = changes.reduce((groups, change) => {
                const date = new Date(change.detectedAt || change.createdAt).toDateString();
                if (!groups[date]) groups[date] = [];
                groups[date].push(change);
                return groups;
            }, {});
            
            return Object.entries(groupedChanges).map(([date, dayChanges]) => \`
                <div class="timeline-day">
                    <div class="timeline-date">
                        <h4>\${formatDateHeader(date)}</h4>
                        <span class="day-count">\${dayChanges.length} changes</span>
                    </div>
                    <div class="timeline-changes">
                        \${dayChanges.map(change => \`
                            <div class="change-item \${change.severity || 'minor'}" data-change-id="\${change._id || change.id}">
                                <div class="change-header">
                                    <div class="change-title">
                                        <span class="api-name">\${getApiName(change.apiId)}</span>
                                        <span class="change-type-badge \${change.type || 'modification'}">\${(change.type || 'modification').toUpperCase()}</span>
                                        <span class="severity-badge \${change.severity || 'minor'}">\${(change.severity || 'minor').toUpperCase()}</span>
                                    </div>
                                    <div class="change-time">\${formatTime(change.detectedAt || change.createdAt)}</div>
                                </div>
                                
                                <div class="change-summary">
                                    \${change.summary || change.description || 'API modification detected'}
                                </div>
                                
                                \${change.changes && change.changes.length ? \`
                                    <div class="change-details">
                                        <div class="changes-list">
                                            \${change.changes.slice(0, 3).map(detail => \`
                                                <div class="change-detail-item">
                                                    <span class="change-path">\${detail.path || detail.field}</span>
                                                    <span class="change-operation">\${detail.operation || detail.type}</span>
                                                    \${detail.description ? \`<span class="change-description">\${detail.description}</span>\` : ''}
                                                </div>
                                            \`).join('')}
                                            \${change.changes.length > 3 ? \`
                                                <div class="change-more">
                                                    <button class="btn-link" onclick="expandChange('\${change._id || change.id}')">
                                                        +\${change.changes.length - 3} more changes
                                                    </button>
                                                </div>
                                            \` : ''}
                                        </div>
                                    </div>
                                \` : ''}
                                
                                <div class="change-actions">
                                    <button class="btn-secondary btn-sm" onclick="viewChangeDetails('\${change._id || change.id}')">View Details</button>
                                    \${change.diffUrl ? \`<button class="btn-secondary btn-sm" onclick="viewDiff('\${change.diffUrl}')">View Diff</button>\` : ''}
                                    <button class="btn-secondary btn-sm" onclick="markAsReviewed('\${change._id || change.id}')">Mark as Reviewed</button>
                                </div>
                            </div>
                        \`).join('')}
                    </div>
                </div>
            \`).join('');
        }
        
        function formatDateHeader(dateString) {
            const date = new Date(dateString);
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (date.toDateString() === today.toDateString()) {
                return 'Today';
            } else if (date.toDateString() === yesterday.toDateString()) {
                return 'Yesterday';
            } else {
                return date.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
            }
        }
        
        function formatTime(dateString) {
            try {
                return new Date(dateString).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
            } catch {
                return 'Unknown time';
            }
        }
        
        function getApiName(apiId) {
            if (!appData.apis || !apiId) return 'Unknown API';
            const api = appData.apis.find(a => (a._id || a.id) === apiId);
            return api ? (api.apiName || api.name || 'Unknown API') : 'Unknown API';
        }
        
        function filterChanges() {
            const apiFilter = document.getElementById('api-filter').value;
            const typeFilter = document.getElementById('change-type-filter').value;
            const severityFilter = document.getElementById('severity-filter').value;
            const dateFilter = document.getElementById('date-filter').value;
            
            const changeItems = document.querySelectorAll('.change-item');
            changeItems.forEach(item => {
                const changeId = item.dataset.changeId;
                const change = (appData.changelogs || []).find(c => (c._id || c.id) === changeId);
                if (!change) return;
                
                const matchesApi = !apiFilter || change.apiId === apiFilter;
                const matchesType = !typeFilter || change.type === typeFilter;
                const matchesSeverity = !severityFilter || change.severity === severityFilter;
                const matchesDate = !dateFilter || 
                    new Date(change.detectedAt || change.createdAt).toDateString() === new Date(dateFilter).toDateString();
                
                item.style.display = matchesApi && matchesType && matchesSeverity && matchesDate ? '' : 'none';
            });
        }
        
        function expandChange(changeId) {
            // Future implementation for expanding change details
        }
        
        function viewChangeDetails(changeId) {
            // Future implementation for change details modal
        }
        
        function viewDiff(diffUrl) {
            window.open(diffUrl, '_blank');
        }
        
        function markAsReviewed(changeId) {
            // Future implementation for marking changes as reviewed
        }
        
        function renderIssues() {
            if (!appData.notifications) {
                vscode.postMessage({ type: 'getNotifications', params: { type: 'alert' } });
                document.getElementById('content-body').innerHTML = \`
                    <div class="loading-content">
                        <div class="loading-spinner">⏳</div>
                        <div>Loading issues and alerts...</div>
                    </div>
                \`;
                return;
            }
            
            const alerts = (appData.notifications || []).filter(n => n.type === 'alert' || n.priority === 'high' || n.priority === 'critical');
            
            document.getElementById('content-body').innerHTML = \`
                <div class="issues-container">
                    <div class="issues-header">
                        <div class="issues-filters">
                            <select id="priority-filter" class="filter-select">
                                <option value="">All Priority</option>
                                <option value="critical">Critical</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                            <select id="issue-type-filter" class="filter-select">
                                <option value="">All Types</option>
                                <option value="api_error">API Errors</option>
                                <option value="health_check">Health Check Failures</option>
                                <option value="breaking_change">Breaking Changes</option>
                                <option value="performance">Performance Issues</option>
                                <option value="security">Security Alerts</option>
                            </select>
                            <select id="status-filter" class="filter-select">
                                <option value="">All Status</option>
                                <option value="unresolved">Unresolved</option>
                                <option value="resolved">Resolved</option>
                                <option value="investigating">Investigating</option>
                            </select>
                            <button class="btn-secondary" onclick="markAllAsRead()">Mark All as Read</button>
                        </div>
                        <div class="issues-stats">
                            <div class="stat-card critical">
                                <span class="stat-number">\${alerts.filter(a => a.priority === 'critical').length}</span>
                                <span class="stat-label">Critical</span>
                            </div>
                            <div class="stat-card high">
                                <span class="stat-number">\${alerts.filter(a => a.priority === 'high').length}</span>
                                <span class="stat-label">High</span>
                            </div>
                            <div class="stat-card medium">
                                <span class="stat-number">\${alerts.filter(a => a.priority === 'medium').length}</span>
                                <span class="stat-label">Medium</span>
                            </div>
                            <div class="stat-card unread">
                                <span class="stat-number">\${alerts.filter(a => !a.isRead).length}</span>
                                <span class="stat-label">Unread</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="issues-list">
                        \${renderIssuesList(alerts)}
                    </div>
                </div>
            \`;
            
            // Add event listeners
            document.getElementById('priority-filter').addEventListener('change', filterIssues);
            document.getElementById('issue-type-filter').addEventListener('change', filterIssues);
            document.getElementById('status-filter').addEventListener('change', filterIssues);
        }
        
        function renderIssuesList(issues) {
            if (!issues || issues.length === 0) {
                return \`
                    <div class="empty-state">
                        <div class="empty-state-icon">⚠️</div>
                        <div>No issues or alerts</div>
                        <div style="margin-top: 0.5rem; font-size: 0.8rem;">All your APIs are running smoothly! 🎉</div>
                    </div>
                \`;
            }
            
            // Sort by priority and date
            const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
            const sortedIssues = issues.sort((a, b) => {
                const priorityDiff = (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99);
                if (priorityDiff !== 0) return priorityDiff;
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
            
            return sortedIssues.map(issue => \`
                <div class="issue-item \${issue.priority || 'medium'} \${issue.isRead ? 'read' : 'unread'}" data-issue-id="\${issue._id || issue.id}">
                    <div class="issue-header">
                        <div class="issue-priority">
                            <span class="priority-badge \${issue.priority || 'medium'}">
                                \${getPriorityIcon(issue.priority)} \${(issue.priority || 'medium').toUpperCase()}
                            </span>
                        </div>
                        <div class="issue-meta">
                            <span class="issue-api">\${getApiName(issue.apiId)}</span>
                            <span class="issue-time">\${formatDate(issue.createdAt)}</span>
                            \${!issue.isRead ? '<span class="unread-indicator">NEW</span>' : ''}
                        </div>
                    </div>
                    
                    <div class="issue-content">
                        <h4 class="issue-title">\${issue.title || issue.message || 'API Issue Detected'}</h4>
                        <div class="issue-description">
                            \${issue.description || issue.content || 'No additional details available'}
                        </div>
                        
                        \${issue.details ? \`
                            <div class="issue-details">
                                <strong>Details:</strong>
                                <pre class="issue-details-content">\${JSON.stringify(issue.details, null, 2)}</pre>
                            </div>
                        \` : ''}
                        
                        \${issue.errorCode ? \`
                            <div class="issue-error-code">
                                <strong>Error Code:</strong> <code>\${issue.errorCode}</code>
                            </div>
                        \` : ''}
                        
                        \${issue.recommendation ? \`
                            <div class="issue-recommendation">
                                <strong>💡 Recommendation:</strong>
                                <div>\${issue.recommendation}</div>
                            </div>
                        \` : ''}
                    </div>
                    
                    <div class="issue-actions">
                        \${!issue.isRead ? \`
                            <button class="btn-secondary btn-sm" onclick="markIssueAsRead('\${issue._id || issue.id}')">
                                Mark as Read
                            </button>
                        \` : ''}
                        <button class="btn-secondary btn-sm" onclick="viewIssueDetails('\${issue._id || issue.id}')">
                            View Details
                        </button>
                        \${issue.apiId ? \`
                            <button class="btn-secondary btn-sm" onclick="goToApi('\${issue.apiId}')">
                                Go to API
                            </button>
                        \` : ''}
                        <button class="btn-secondary btn-sm" onclick="resolveIssue('\${issue._id || issue.id}')">
                            Resolve
                        </button>
                        <button class="btn-danger btn-sm" onclick="dismissIssue('\${issue._id || issue.id}')">
                            Dismiss
                        </button>
                    </div>
                </div>
            \`).join('');
        }
        
        function getPriorityIcon(priority) {
            switch(priority) {
                case 'critical': return '🔴';
                case 'high': return '🟠';
                case 'medium': return '🟡';
                case 'low': return '🟢';
                default: return '⚪';
            }
        }
        
        function filterIssues() {
            const priorityFilter = document.getElementById('priority-filter').value;
            const typeFilter = document.getElementById('issue-type-filter').value;
            const statusFilter = document.getElementById('status-filter').value;
            
            const issueItems = document.querySelectorAll('.issue-item');
            issueItems.forEach(item => {
                const issueId = item.dataset.issueId;
                const issue = (appData.notifications || []).find(n => (n._id || n.id) === issueId);
                if (!issue) return;
                
                const matchesPriority = !priorityFilter || issue.priority === priorityFilter;
                const matchesType = !typeFilter || issue.type === typeFilter;
                const matchesStatus = !statusFilter || 
                    (statusFilter === 'unresolved' && !issue.isResolved) ||
                    (statusFilter === 'resolved' && issue.isResolved) ||
                    (statusFilter === 'investigating' && issue.status === 'investigating');
                
                item.style.display = matchesPriority && matchesType && matchesStatus ? '' : 'none';
            });
        }
        
        function markIssueAsRead(issueId) {
            vscode.postMessage({ type: 'markNotificationRead', id: issueId });
            // Update UI immediately
            const issueElement = document.querySelector(\`[data-issue-id="\${issueId}"]\`);
            if (issueElement) {
                issueElement.classList.remove('unread');
                issueElement.classList.add('read');
                const unreadIndicator = issueElement.querySelector('.unread-indicator');
                if (unreadIndicator) unreadIndicator.remove();
            }
        }
        
        function markAllAsRead() {
            const unreadIssues = document.querySelectorAll('.issue-item.unread');
            unreadIssues.forEach(item => {
                markIssueAsRead(item.dataset.issueId);
            });
        }
        
        function viewIssueDetails(issueId) {
            // Future implementation for issue details modal
        }
        
        function goToApi(apiId) {
            // Switch to APIs tab and highlight the specific API
            switchTab('apis');
            setTimeout(() => {
                const apiRow = document.querySelector(\`[data-api-id="\${apiId}"]\`);
                if (apiRow) {
                    apiRow.scrollIntoView({ behavior: 'smooth' });
                    apiRow.style.backgroundColor = 'var(--vscode-list-highlightForeground)';
                    setTimeout(() => {
                        apiRow.style.backgroundColor = '';
                    }, 3000);
                }
            }, 500);
        }
        
        function resolveIssue(issueId) {
            if (confirm('Mark this issue as resolved?')) {
                // Future implementation for resolving issues
                const issueElement = document.querySelector(\`[data-issue-id="\${issueId}"]\`);
                if (issueElement) {
                    issueElement.style.opacity = '0.6';
                    issueElement.style.textDecoration = 'line-through';
                }
            }
        }
        
        function dismissIssue(issueId) {
            if (confirm('Dismiss this issue? It will be removed from the list.')) {
                const issueElement = document.querySelector(\`[data-issue-id="\${issueId}"]\`);
                if (issueElement) {
                    issueElement.style.display = 'none';
                }
            }
        }
        
        function renderNotifications() {
            if (!appData.notifications) {
                vscode.postMessage({ type: 'getNotifications', params: {} });
                document.getElementById('content-body').innerHTML = \`
                    <div class="loading-content">
                        <div class="loading-spinner">⏳</div>
                        <div>Loading notifications...</div>
                    </div>
                \`;
                return;
            }
            
            document.getElementById('content-body').innerHTML = \`
                <div class="notifications-container">
                    <div class="notifications-header">
                        <div class="notifications-filters">
                            <select id="notification-type-filter" class="filter-select">
                                <option value="">All Types</option>
                                <option value="alert">Alerts</option>
                                <option value="info">Information</option>
                                <option value="warning">Warnings</option>
                                <option value="success">Success</option>
                            </select>
                            <select id="notification-priority-filter" class="filter-select">
                                <option value="">All Priority</option>
                                <option value="critical">Critical</option>
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                            <select id="read-status-filter" class="filter-select">
                                <option value="">All</option>
                                <option value="unread">Unread</option>
                                <option value="read">Read</option>
                            </select>
                            <div class="notification-actions">
                                <button class="btn-secondary" onclick="markAllNotificationsAsRead()">Mark All as Read</button>
                                <button class="btn-secondary" onclick="clearReadNotifications()">Clear Read</button>
                            </div>
                        </div>
                        <div class="notifications-stats">
                            <div class="stat-card">
                                <span class="stat-number">\${(appData.notifications || []).length}</span>
                                <span class="stat-label">Total</span>
                            </div>
                            <div class="stat-card unread">
                                <span class="stat-number">\${(appData.notifications || []).filter(n => !n.isRead).length}</span>
                                <span class="stat-label">Unread</span>
                            </div>
                            <div class="stat-card critical">
                                <span class="stat-number">\${(appData.notifications || []).filter(n => n.priority === 'critical').length}</span>
                                <span class="stat-label">Critical</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="notifications-list">
                        \${renderNotificationsList(appData.notifications || [])}
                    </div>
                </div>
            \`;
            
            // Add event listeners
            document.getElementById('notification-type-filter').addEventListener('change', filterNotifications);
            document.getElementById('notification-priority-filter').addEventListener('change', filterNotifications);
            document.getElementById('read-status-filter').addEventListener('change', filterNotifications);
        }
        
        function renderNotificationsList(notifications) {
            if (!notifications || notifications.length === 0) {
                return \`
                    <div class="empty-state">
                        <div class="empty-state-icon">🔔</div>
                        <div>No notifications</div>
                        <div style="margin-top: 0.5rem; font-size: 0.8rem;">You're all caught up! 🎉</div>
                    </div>
                \`;
            }
            
            // Sort by date (newest first) and read status
            const sortedNotifications = notifications.sort((a, b) => {
                if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
            
            return sortedNotifications.map(notification => \`
                <div class="notification-item \${notification.type || 'info'} \${notification.priority || 'medium'} \${notification.isRead ? 'read' : 'unread'}" 
                     data-notification-id="\${notification._id || notification.id}">
                    <div class="notification-header">
                        <div class="notification-icon">
                            \${getNotificationIcon(notification.type, notification.priority)}
                        </div>
                        <div class="notification-meta">
                            <div class="notification-title">
                                \${notification.title || notification.message || 'Notification'}
                                \${!notification.isRead ? '<span class="unread-dot">●</span>' : ''}
                            </div>
                            <div class="notification-details">
                                <span class="notification-api">\${getApiName(notification.apiId)}</span>
                                <span class="notification-time">\${formatRelativeTime(notification.createdAt)}</span>
                                <span class="notification-priority-badge \${notification.priority || 'medium'}">
                                    \${(notification.priority || 'medium').toUpperCase()}
                                </span>
                            </div>
                        </div>
                        <div class="notification-actions-quick">
                            \${!notification.isRead ? \`
                                <button class="btn-icon" onclick="markNotificationAsRead('\${notification._id || notification.id}')" title="Mark as read">
                                    ✓
                                </button>
                            \` : ''}
                            <button class="btn-icon" onclick="deleteNotification('\${notification._id || notification.id}')" title="Delete">
                                ×
                            </button>
                        </div>
                    </div>
                    
                    <div class="notification-content">
                        \${notification.content || notification.description ? \`
                            <div class="notification-description">
                                \${notification.content || notification.description}
                            </div>
                        \` : ''}
                        
                        \${notification.changes && notification.changes.length ? \`
                            <div class="notification-changes">
                                <strong>Changes detected:</strong>
                                <ul>
                                    \${notification.changes.slice(0, 3).map(change => \`
                                        <li>\${change.description || change.summary || change}</li>
                                    \`).join('')}
                                    \${notification.changes.length > 3 ? \`
                                        <li><em>+\${notification.changes.length - 3} more changes</em></li>
                                    \` : ''}
                                </ul>
                            </div>
                        \` : ''}
                        
                        \${notification.actionRequired ? \`
                            <div class="notification-action-required">
                                <strong>⚠️ Action Required:</strong>
                                <div>\${notification.actionRequired}</div>
                            </div>
                        \` : ''}
                    </div>
                    
                    <div class="notification-actions">
                        \${notification.apiId ? \`
                            <button class="btn-secondary btn-sm" onclick="goToApi('\${notification.apiId}')">
                                View API
                            </button>
                        \` : ''}
                        \${notification.changelogId ? \`
                            <button class="btn-secondary btn-sm" onclick="viewChangeDetails('\${notification.changelogId}')">
                                View Changes
                            </button>
                        \` : ''}
                        \${notification.url ? \`
                            <button class="btn-secondary btn-sm" onclick="openUrl('\${notification.url}')">
                                Open Link
                            </button>
                        \` : ''}
                        <button class="btn-secondary btn-sm" onclick="archiveNotification('\${notification._id || notification.id}')">
                            Archive
                        </button>
                    </div>
                </div>
            \`).join('');
        }
        
        function getNotificationIcon(type, priority) {
            if (priority === 'critical') return '🔴';
            
            switch(type) {
                case 'alert': return '⚠️';
                case 'warning': return '⚠️';
                case 'error': return '❌';
                case 'success': return '✅';
                case 'info': return '💡';
                default: return '📢';
            }
        }
        
        function formatRelativeTime(dateString) {
            try {
                const date = new Date(dateString);
                const now = new Date();
                const diffMs = now - date;
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMs / 3600000);
                const diffDays = Math.floor(diffMs / 86400000);
                
                if (diffMins < 1) return 'Just now';
                if (diffMins < 60) return \`\${diffMins}m ago\`;
                if (diffHours < 24) return \`\${diffHours}h ago\`;
                if (diffDays < 7) return \`\${diffDays}d ago\`;
                return date.toLocaleDateString();
            } catch {
                return 'Unknown time';
            }
        }
        
        function filterNotifications() {
            const typeFilter = document.getElementById('notification-type-filter').value;
            const priorityFilter = document.getElementById('notification-priority-filter').value;
            const readStatusFilter = document.getElementById('read-status-filter').value;
            
            const notificationItems = document.querySelectorAll('.notification-item');
            notificationItems.forEach(item => {
                const notificationId = item.dataset.notificationId;
                const notification = (appData.notifications || []).find(n => (n._id || n.id) === notificationId);
                if (!notification) return;
                
                const matchesType = !typeFilter || notification.type === typeFilter;
                const matchesPriority = !priorityFilter || notification.priority === priorityFilter;
                const matchesReadStatus = !readStatusFilter || 
                    (readStatusFilter === 'read' && notification.isRead) ||
                    (readStatusFilter === 'unread' && !notification.isRead);
                
                item.style.display = matchesType && matchesPriority && matchesReadStatus ? '' : 'none';
            });
        }
        
        function markNotificationAsRead(notificationId) {
            vscode.postMessage({ type: 'markNotificationRead', id: notificationId });
            // Update UI immediately
            const notificationElement = document.querySelector(\`[data-notification-id="\${notificationId}"]\`);
            if (notificationElement) {
                notificationElement.classList.remove('unread');
                notificationElement.classList.add('read');
                const unreadDot = notificationElement.querySelector('.unread-dot');
                if (unreadDot) unreadDot.remove();
            }
        }
        
        function markAllNotificationsAsRead() {
            const unreadNotifications = document.querySelectorAll('.notification-item.unread');
            unreadNotifications.forEach(item => {
                markNotificationAsRead(item.dataset.notificationId);
            });
        }
        
        function clearReadNotifications() {
            if (confirm('Clear all read notifications? This action cannot be undone.')) {
                const readNotifications = document.querySelectorAll('.notification-item.read');
                readNotifications.forEach(item => {
                    deleteNotification(item.dataset.notificationId);
                });
            }
        }
        
        function deleteNotification(notificationId) {
            const notificationElement = document.querySelector(\`[data-notification-id="\${notificationId}"]\`);
            if (notificationElement) {
                notificationElement.style.display = 'none';
                // You could also send a message to backend to delete permanently
                // vscode.postMessage({ type: 'deleteNotification', id: notificationId });
            }
        }
        
        function archiveNotification(notificationId) {
            const notificationElement = document.querySelector(\`[data-notification-id="\${notificationId}"]\`);
            if (notificationElement) {
                notificationElement.style.opacity = '0.5';
                // You could also send a message to backend to archive
                // Archive notification implementation
            }
        }
        
        function openUrl(url) {
            window.open(url, '_blank');
        }
        
        function renderAnalytics() {
            if (!appData.analytics) {
                vscode.postMessage({ type: 'getAnalytics', params: {} });
                document.getElementById('content-body').innerHTML = \`
                    <div class="loading-content">
                        <div class="loading-spinner">📊</div>
                        <div>Loading analytics...</div>
                    </div>
                \`;
                return;
            }
            
            document.getElementById('content-body').innerHTML = \`
                <div class="analytics-container">
                    <div class="analytics-header">
                        <div class="analytics-filters">
                            <select id="analytics-period" class="filter-select">
                                <option value="7">Last 7 days</option>
                                <option value="30">Last 30 days</option>
                                <option value="90">Last 90 days</option>
                                <option value="365">Last year</option>
                            </select>
                            <select id="analytics-metric" class="filter-select">
                                <option value="all">All Metrics</option>
                                <option value="changes">API Changes</option>
                                <option value="errors">Errors & Issues</option>
                                <option value="performance">Performance</option>
                            </select>
                            <button class="btn-secondary" onclick="exportAnalytics()">Export Data</button>
                        </div>
                    </div>
                    
                    <div class="analytics-grid">
                        <div class="analytics-card overview">
                            <h3>📊 Overview</h3>
                            <div class="metrics-grid">
                                <div class="metric-item">
                                    <div class="metric-value">\${getTotalApis()}</div>
                                    <div class="metric-label">Total APIs</div>
                                    <div class="metric-change positive">+\${getNewApisThisWeek()}</div>
                                </div>
                                <div class="metric-item">
                                    <div class="metric-value">\${getTotalChanges()}</div>
                                    <div class="metric-label">Total Changes</div>
                                    <div class="metric-change negative">+\${getChangesThisWeek()}</div>
                                </div>
                                <div class="metric-item">
                                    <div class="metric-value">\${getActiveIssues()}</div>
                                    <div class="metric-label">Active Issues</div>
                                    <div class="metric-change \${getIssuesChange() > 0 ? 'negative' : 'positive'}">
                                        \${getIssuesChange() > 0 ? '+' : ''}\${getIssuesChange()}
                                    </div>
                                </div>
                                <div class="metric-item">
                                    <div class="metric-value">\${getHealthScore()}%</div>
                                    <div class="metric-label">Health Score</div>
                                    <div class="metric-change positive">+2%</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="analytics-card chart">
                            <h3>📈 API Changes Over Time</h3>
                            <div class="chart-container">
                                \${renderSimpleChart('changes')}
                            </div>
                        </div>
                        
                        <div class="analytics-card chart">
                            <h3>🔍 Issues & Errors Trend</h3>
                            <div class="chart-container">
                                \${renderSimpleChart('issues')}
                            </div>
                        </div>
                        
                        <div class="analytics-card top-apis">
                            <h3>🏆 Most Active APIs</h3>
                            <div class="top-apis-list">
                                \${renderTopApis()}
                            </div>
                        </div>
                        
                        <div class="analytics-card recent-activity">
                            <h3>⚡ Recent Activity</h3>
                            <div class="activity-timeline">
                                \${renderRecentActivity()}
                            </div>
                        </div>
                        
                        <div class="analytics-card health-dashboard">
                            <h3>💚 API Health Dashboard</h3>
                            <div class="health-grid">
                                \${renderHealthDashboard()}
                            </div>
                        </div>
                        
                        <div class="analytics-card change-types">
                            <h3>🔄 Change Types Distribution</h3>
                            <div class="change-types-chart">
                                \${renderChangeTypesChart()}
                            </div>
                        </div>
                        
                        <div class="analytics-card performance">
                            <h3>⚡ Performance Metrics</h3>
                            <div class="performance-grid">
                                <div class="performance-metric">
                                    <div class="metric-label">Avg Response Time</div>
                                    <div class="metric-value">245ms</div>
                                    <div class="metric-bar">
                                        <div class="metric-fill" style="width: 75%;"></div>
                                    </div>
                                </div>
                                <div class="performance-metric">
                                    <div class="metric-label">Success Rate</div>
                                    <div class="metric-value">99.2%</div>
                                    <div class="metric-bar">
                                        <div class="metric-fill success" style="width: 99.2%;"></div>
                                    </div>
                                </div>
                                <div class="performance-metric">
                                    <div class="metric-label">Error Rate</div>
                                    <div class="metric-value">0.8%</div>
                                    <div class="metric-bar">
                                        <div class="metric-fill error" style="width: 0.8%;"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            \`;
            
            // Add event listeners
            document.getElementById('analytics-period').addEventListener('change', updateAnalyticsPeriod);
            document.getElementById('analytics-metric').addEventListener('change', filterAnalyticsMetric);
        }
        
        function getTotalApis() {
            return (appData.apis || []).length;
        }
        
        function getNewApisThisWeek() {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return (appData.apis || []).filter(api => 
                new Date(api.createdAt || api.dateAdded) > weekAgo
            ).length;
        }
        
        function getTotalChanges() {
            return (appData.changes || []).length;
        }
        
        function getChangesThisWeek() {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return (appData.changes || []).filter(change => 
                new Date(change.createdAt || change.date) > weekAgo
            ).length;
        }
        
        function getActiveIssues() {
            return (appData.issues || []).filter(issue => 
                issue.status === 'open' || issue.status === 'active'
            ).length;
        }
        
        function getIssuesChange() {
            // Calculate issue change from last week
            return Math.floor(Math.random() * 5) - 2; // Mock data: -2 to +3
        }
        
        function getHealthScore() {
            const totalApis = getTotalApis();
            const activeIssues = getActiveIssues();
            if (totalApis === 0) return 100;
            const healthScore = Math.max(0, 100 - (activeIssues / totalApis) * 100);
            return Math.round(healthScore);
        }
        
        function renderSimpleChart(type) {
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            const data = type === 'changes' 
                ? [12, 8, 15, 6, 9, 3, 7] 
                : [2, 1, 4, 0, 2, 1, 1];
            const maxValue = Math.max(...data);
            
            return \`
                <div class="simple-chart">
                    \${days.map((day, index) => \`
                        <div class="chart-bar">
                            <div class="bar-value">\${data[index]}</div>
                            <div class="bar" style="height: \${(data[index] / maxValue) * 100}%"></div>
                            <div class="bar-label">\${day}</div>
                        </div>
                    \`).join('')}
                </div>
            \`;
        }
        
        function renderTopApis() {
            const apis = appData.apis || [];
            if (apis.length === 0) {
                return '<div class="empty-state-small">No APIs to display</div>';
            }
            
            // Sort by number of changes (mock data for now)
            const topApis = apis.slice(0, 5).map((api, index) => ({
                ...api,
                changeCount: Math.floor(Math.random() * 20) + 1,
                rank: index + 1
            })).sort((a, b) => b.changeCount - a.changeCount);
            
            return topApis.map(api => \`
                <div class="top-api-item">
                    <div class="api-rank">#\${api.rank}</div>
                    <div class="api-info">
                        <div class="api-name">\${api.apiName || api.name || 'Unnamed API'}</div>
                        <div class="api-changes">\${api.changeCount} changes</div>
                    </div>
                    <div class="api-status \${getApiHealthStatus(api)}">
                        \${getApiHealthStatus(api)}
                    </div>
                </div>
            \`).join('');
        }
        
        function getApiHealthStatus(api) {
            const statuses = ['healthy', 'warning', 'error'];
            return statuses[Math.floor(Math.random() * statuses.length)];
        }
        
        function renderRecentActivity() {
            const activities = [
                { type: 'change', message: 'New endpoint added to Users API', time: '2 hours ago', icon: '🔄' },
                { type: 'issue', message: 'Breaking change detected in Payments API', time: '4 hours ago', icon: '⚠️' },
                { type: 'api', message: 'Weather API registered successfully', time: '1 day ago', icon: '✅' },
                { type: 'change', message: 'Response schema updated in Orders API', time: '2 days ago', icon: '📝' },
                { type: 'issue', message: 'Deprecated endpoint in Inventory API', time: '3 days ago', icon: '🚫' }
            ];
            
            return activities.map(activity => \`
                <div class="activity-item">
                    <div class="activity-icon">\${activity.icon}</div>
                    <div class="activity-content">
                        <div class="activity-message">\${activity.message}</div>
                        <div class="activity-time">\${activity.time}</div>
                    </div>
                </div>
            \`).join('');
        }
        
        function renderHealthDashboard() {
            const apis = appData.apis || [];
            const healthyCount = Math.floor(apis.length * 0.8);
            const warningCount = Math.floor(apis.length * 0.15);
            const errorCount = apis.length - healthyCount - warningCount;
            
            return \`
                <div class="health-item healthy">
                    <div class="health-icon">💚</div>
                    <div class="health-count">\${healthyCount}</div>
                    <div class="health-label">Healthy</div>
                </div>
                <div class="health-item warning">
                    <div class="health-icon">⚠️</div>
                    <div class="health-count">\${warningCount}</div>
                    <div class="health-label">Warning</div>
                </div>
                <div class="health-item error">
                    <div class="health-icon">🔴</div>
                    <div class="health-count">\${errorCount}</div>
                    <div class="health-label">Error</div>
                </div>
            \`;
        }
        
        function renderChangeTypesChart() {
            const changeTypes = [
                { label: 'Schema Changes', count: 25, color: '#3b82f6' },
                { label: 'New Endpoints', count: 18, color: '#10b981' },
                { label: 'Breaking Changes', count: 8, color: '#ef4444' },
                { label: 'Deprecations', count: 12, color: '#f59e0b' },
                { label: 'Bug Fixes', count: 15, color: '#8b5cf6' }
            ];
            
            const total = changeTypes.reduce((sum, type) => sum + type.count, 0);
            
            return \`
                <div class="change-types-list">
                    \${changeTypes.map(type => \`
                        <div class="change-type-item">
                            <div class="change-type-bar">
                                <div class="change-type-fill" 
                                     style="width: \${(type.count / total) * 100}%; background-color: \${type.color}">
                                </div>
                            </div>
                            <div class="change-type-info">
                                <span class="change-type-label">\${type.label}</span>
                                <span class="change-type-count">\${type.count}</span>
                            </div>
                        </div>
                    \`).join('')}
                </div>
            \`;
        }
        
        function updateAnalyticsPeriod() {
            const period = document.getElementById('analytics-period').value;
            // Here you would typically refetch data for the new period
            // For now, just log the action
        }
        
        function filterAnalyticsMetric() {
            const metric = document.getElementById('analytics-metric').value;
            // Here you would typically filter the displayed metrics
            // For now, just log the action
        }
        
        function exportAnalytics() {
            // Create a mock CSV export
            const csvContent = [
                'Date,API Changes,Issues,Health Score',
                '2024-01-01,12,2,95',
                '2024-01-02,8,1,96',
                '2024-01-03,15,4,92',
                '2024-01-04,6,0,98',
                '2024-01-05,9,2,94',
                '2024-01-06,3,1,97',
                '2024-01-07,7,1,96'
            ].join('\\n');
            
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'api-analytics.csv';
            a.click();
            window.URL.revokeObjectURL(url);
        }
        
        function renderSettings() {
            document.getElementById('content-body').innerHTML = \`
                <div class="settings-container">
                    <div class="settings-header">
                        <h2>⚙️ Settings</h2>
                        <div class="settings-actions">
                            <button class="btn-secondary" onclick="exportSettings()">Export Settings</button>
                            <button class="btn-secondary" onclick="importSettings()">Import Settings</button>
                            <button class="btn-secondary" onclick="resetSettings()">Reset to Default</button>
                        </div>
                    </div>
                    
                    <div class="settings-sections">
                        <div class="settings-section">
                            <h3>🔗 API Configuration</h3>
                            <div class="settings-group">
                                <div class="setting-item">
                                    <label for="backend-url">Backend URL</label>
                                    <input type="url" id="backend-url" value="http://localhost:3000" 
                                           placeholder="Enter backend URL">
                                    <div class="setting-description">URL of your APILens backend server</div>
                                </div>
                                <div class="setting-item">
                                    <label for="api-timeout">API Timeout (seconds)</label>
                                    <input type="number" id="api-timeout" value="30" min="5" max="300">
                                    <div class="setting-description">Maximum time to wait for API responses</div>
                                </div>
                                <div class="setting-item">
                                    <label for="auto-refresh">Auto-refresh interval (minutes)</label>
                                    <input type="number" id="auto-refresh" value="5" min="1" max="60">
                                    <div class="setting-description">How often to check for API changes</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="settings-section">
                            <h3>🔔 Notifications</h3>
                            <div class="settings-group">
                                <div class="setting-item checkbox">
                                    <input type="checkbox" id="enable-notifications" checked>
                                    <label for="enable-notifications">Enable notifications</label>
                                    <div class="setting-description">Show notifications for API changes and issues</div>
                                </div>
                                <div class="setting-item checkbox">
                                    <input type="checkbox" id="breaking-changes-only" checked>
                                    <label for="breaking-changes-only">Breaking changes only</label>
                                    <div class="setting-description">Only notify for breaking changes</div>
                                </div>
                                <div class="setting-item checkbox">
                                    <input type="checkbox" id="critical-issues-only">
                                    <label for="critical-issues-only">Critical issues only</label>
                                    <div class="setting-description">Only notify for critical severity issues</div>
                                </div>
                                <div class="setting-item">
                                    <label for="notification-sound">Notification sound</label>
                                    <select id="notification-sound">
                                        <option value="none">None</option>
                                        <option value="default" selected>Default</option>
                                        <option value="chime">Chime</option>
                                        <option value="bell">Bell</option>
                                    </select>
                                    <div class="setting-description">Sound to play for notifications</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="settings-section">
                            <h3>📊 Dashboard</h3>
                            <div class="settings-group">
                                <div class="setting-item">
                                    <label for="default-view">Default view</label>
                                    <select id="default-view">
                                        <option value="dashboard" selected>Dashboard</option>
                                        <option value="apis">APIs List</option>
                                        <option value="changes">Changes</option>
                                        <option value="analytics">Analytics</option>
                                    </select>
                                    <div class="setting-description">Page to show when opening APILens</div>
                                </div>
                                <div class="setting-item">
                                    <label for="items-per-page">Items per page</label>
                                    <select id="items-per-page">
                                        <option value="10">10</option>
                                        <option value="25" selected>25</option>
                                        <option value="50">50</option>
                                        <option value="100">100</option>
                                    </select>
                                    <div class="setting-description">Number of items to show in lists</div>
                                </div>
                                <div class="setting-item checkbox">
                                    <input type="checkbox" id="show-sidebar" checked>
                                    <label for="show-sidebar">Show sidebar by default</label>
                                    <div class="setting-description">Display the navigation sidebar</div>
                                </div>
                                <div class="setting-item checkbox">
                                    <input type="checkbox" id="compact-mode">
                                    <label for="compact-mode">Compact mode</label>
                                    <div class="setting-description">Use smaller fonts and spacing</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="settings-section">
                            <h3>🔄 Monitoring</h3>
                            <div class="settings-group">
                                <div class="setting-item checkbox">
                                    <input type="checkbox" id="auto-monitoring" checked>
                                    <label for="auto-monitoring">Enable automatic monitoring</label>
                                    <div class="setting-description">Automatically monitor registered APIs for changes</div>
                                </div>
                                <div class="setting-item">
                                    <label for="monitoring-frequency">Check frequency (minutes)</label>
                                    <select id="monitoring-frequency">
                                        <option value="1">Every minute</option>
                                        <option value="5" selected>Every 5 minutes</option>
                                        <option value="15">Every 15 minutes</option>
                                        <option value="30">Every 30 minutes</option>
                                        <option value="60">Every hour</option>
                                    </select>
                                    <div class="setting-description">How often to check for API changes</div>
                                </div>
                                <div class="setting-item checkbox">
                                    <input type="checkbox" id="diff-sensitivity" checked>
                                    <label for="diff-sensitivity">High sensitivity diff detection</label>
                                    <div class="setting-description">Detect even minor changes in API schemas</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="settings-section">
                            <h3>🎨 Appearance</h3>
                            <div class="settings-group">
                                <div class="setting-item">
                                    <label for="theme">Theme</label>
                                    <select id="theme">
                                        <option value="auto" selected>Auto (VS Code)</option>
                                        <option value="light">Light</option>
                                        <option value="dark">Dark</option>
                                    </select>
                                    <div class="setting-description">Visual theme for the interface</div>
                                </div>
                                <div class="setting-item">
                                    <label for="font-size">Font size</label>
                                    <select id="font-size">
                                        <option value="small">Small</option>
                                        <option value="medium" selected>Medium</option>
                                        <option value="large">Large</option>
                                    </select>
                                    <div class="setting-description">Size of text in the interface</div>
                                </div>
                                <div class="setting-item checkbox">
                                    <input type="checkbox" id="syntax-highlighting" checked>
                                    <label for="syntax-highlighting">Syntax highlighting</label>
                                    <div class="setting-description">Highlight JSON/YAML syntax in API schemas</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="settings-section">
                            <h3>💾 Data & Privacy</h3>
                            <div class="settings-group">
                                <div class="setting-item checkbox">
                                    <input type="checkbox" id="cache-api-data" checked>
                                    <label for="cache-api-data">Cache API data locally</label>
                                    <div class="setting-description">Store API schemas locally for faster access</div>
                                </div>
                                <div class="setting-item">
                                    <label for="cache-duration">Cache duration (hours)</label>
                                    <select id="cache-duration">
                                        <option value="1">1 hour</option>
                                        <option value="6">6 hours</option>
                                        <option value="24" selected>24 hours</option>
                                        <option value="168">1 week</option>
                                    </select>
                                    <div class="setting-description">How long to keep cached data</div>
                                </div>
                                <div class="setting-item checkbox">
                                    <input type="checkbox" id="analytics-tracking">
                                    <label for="analytics-tracking">Anonymous usage analytics</label>
                                    <div class="setting-description">Help improve APILens by sharing anonymous usage data</div>
                                </div>
                                <div class="setting-item">
                                    <button class="btn-secondary" onclick="clearCache()">Clear Cache</button>
                                    <div class="setting-description">Remove all locally cached API data</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="settings-section">
                            <h3>🔧 Advanced</h3>
                            <div class="settings-group">
                                <div class="setting-item checkbox">
                                    <input type="checkbox" id="debug-mode">
                                    <label for="debug-mode">Debug mode</label>
                                    <div class="setting-description">Enable debug logging and additional information</div>
                                </div>
                                <div class="setting-item checkbox">
                                    <input type="checkbox" id="experimental-features">
                                    <label for="experimental-features">Experimental features</label>
                                    <div class="setting-description">Enable beta and experimental functionality</div>
                                </div>
                                <div class="setting-item">
                                    <label for="log-level">Log level</label>
                                    <select id="log-level">
                                        <option value="error">Error</option>
                                        <option value="warn">Warning</option>
                                        <option value="info" selected>Info</option>
                                        <option value="debug">Debug</option>
                                        <option value="verbose">Verbose</option>
                                    </select>
                                    <div class="setting-description">Level of detail for logging</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="settings-footer">
                        <div class="settings-info">
                            <div>APILens VS Code Extension v1.0.0</div>
                            <div>Settings are automatically saved</div>
                        </div>
                        <div class="settings-actions">
                            <button class="btn-primary" onclick="saveSettings()">Save Settings</button>
                            <button class="btn-secondary" onclick="cancelSettings()">Cancel</button>
                        </div>
                    </div>
                </div>
            \`;
            
            // Load current settings
            loadCurrentSettings();
            
            // Add event listeners for auto-save
            document.querySelectorAll('.setting-item input, .setting-item select').forEach(element => {
                element.addEventListener('change', autoSaveSettings);
            });
        }
        
        function loadCurrentSettings() {
            // Load settings from VS Code workspace configuration
            // For now, we'll use defaults and localStorage fallback
            try {
                const settings = JSON.parse(localStorage.getItem('apilens-settings') || '{}');
                
                // Apply loaded settings to form elements
                Object.keys(settings).forEach(key => {
                    const element = document.getElementById(key);
                    if (element) {
                        if (element.type === 'checkbox') {
                            element.checked = settings[key];
                        } else {
                            element.value = settings[key];
                        }
                    }
                });
            } catch (error) {
                console.error('Error loading settings:', error);
            }
        }
        
        function autoSaveSettings() {
            // Auto-save settings as user changes them
            setTimeout(saveSettings, 500); // Debounce saves
        }
        
        function saveSettings() {
            const settings = {};
            
            // Collect all setting values
            document.querySelectorAll('.setting-item input, .setting-item select').forEach(element => {
                if (element.id) {
                    if (element.type === 'checkbox') {
                        settings[element.id] = element.checked;
                    } else {
                        settings[element.id] = element.value;
                    }
                }
            });
            
            try {
                // Save to localStorage for now
                localStorage.setItem('apilens-settings', JSON.stringify(settings));
                
                // Send to VS Code extension for workspace configuration
                vscode.postMessage({ type: 'saveSettings', settings });
                
                // Show success feedback
                showNotification('Settings saved successfully', 'success');
                
            } catch (error) {
                console.error('Error saving settings:', error);
                showNotification('Error saving settings', 'error');
            }
        }
        
        function cancelSettings() {
            // Reload settings from storage
            loadCurrentSettings();
            showNotification('Settings reset to last saved state', 'info');
        }
        
        function resetSettings() {
            if (confirm('Reset all settings to default values? This action cannot be undone.')) {
                // Clear localStorage
                localStorage.removeItem('apilens-settings');
                
                // Reset form to defaults
                document.querySelectorAll('.setting-item input[type="checkbox"]').forEach(cb => {
                    // Set default checked states
                    const defaultChecked = [
                        'enable-notifications', 'breaking-changes-only', 'show-sidebar',
                        'auto-monitoring', 'diff-sensitivity', 'syntax-highlighting', 'cache-api-data'
                    ];
                    cb.checked = defaultChecked.includes(cb.id);
                });
                
                document.querySelectorAll('.setting-item select, .setting-item input:not([type="checkbox"])').forEach(element => {
                    // Reset to default values based on element
                    const defaults = {
                        'backend-url': 'http://localhost:3000',
                        'api-timeout': '30',
                        'auto-refresh': '5',
                        'notification-sound': 'default',
                        'default-view': 'dashboard',
                        'items-per-page': '25',
                        'monitoring-frequency': '5',
                        'theme': 'auto',
                        'font-size': 'medium',
                        'cache-duration': '24',
                        'log-level': 'info'
                    };
                    element.value = defaults[element.id] || '';
                });
                
                saveSettings();
                showNotification('Settings reset to defaults', 'success');
            }
        }
        
        function exportSettings() {
            const settings = JSON.parse(localStorage.getItem('apilens-settings') || '{}');
            const dataStr = JSON.stringify(settings, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const url = window.URL.createObjectURL(dataBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'apilens-settings.json';
            a.click();
            window.URL.revokeObjectURL(url);
            
            showNotification('Settings exported', 'success');
        }
        
        function importSettings() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (event) => {
                const file = event.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                            const settings = JSON.parse(e.target.result);
                            localStorage.setItem('apilens-settings', JSON.stringify(settings));
                            loadCurrentSettings();
                            showNotification('Settings imported successfully', 'success');
                        } catch (error) {
                            showNotification('Error importing settings: Invalid JSON file', 'error');
                        }
                    };
                    reader.readAsText(file);
                }
            };
            input.click();
        }
        
        function clearCache() {
            if (confirm('Clear all cached API data? This will remove locally stored schemas and force fresh downloads.')) {
                // Clear API cache
                localStorage.removeItem('apilens-cache');
                
                // Send message to extension to clear cache
                vscode.postMessage({ type: 'clearCache' });
                
                showNotification('Cache cleared successfully', 'success');
            }
        }
        
        function showNotification(message, type = 'info') {
            // Create a simple notification
            const notification = document.createElement('div');
            notification.className = \`notification \${type}\`;
            notification.textContent = message;
            notification.style.cssText = \`
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                border-radius: 4px;
                color: white;
                z-index: 1000;
                opacity: 0;
                transition: opacity 0.3s;
            \`;
            
            if (type === 'success') notification.style.backgroundColor = '#10b981';
            else if (type === 'error') notification.style.backgroundColor = '#ef4444';
            else notification.style.backgroundColor = '#3b82f6';
            
            document.body.appendChild(notification);
            
            // Animate in
            setTimeout(() => notification.style.opacity = '1', 10);
            
            // Remove after 3 seconds
            setTimeout(() => {
                notification.style.opacity = '0';
                setTimeout(() => document.body.removeChild(notification), 300);
            }, 3000);
        }
        
        function addNewApi() {
            vscode.postMessage({ type: 'addApi' });
        }
        
        // Navigation event listeners
        document.addEventListener('click', (e) => {
            if (e.target.closest('.nav-item')) {
                e.preventDefault();
                const tab = e.target.closest('.nav-item').dataset.tab;
                switchTab(tab);
            }
        });
        
        // Login form handler
        function initializeLoginForm() {
            setTimeout(() => {
                const loginBtn = document.getElementById('loginBtn');
                const emailInput = document.getElementById('email');
                const passwordInput = document.getElementById('password');
                const errorDiv = document.getElementById('error');
                
                if (loginBtn && emailInput && passwordInput && errorDiv) {
                    loginBtn.style.background = '#007acc';
                    loginBtn.title = 'Login form is ready - click to login';
                    
                    loginBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        const email = emailInput.value.trim();
                        const password = passwordInput.value.trim();
                        errorDiv.textContent = '';
                        
                        if (!email || !password) {
                            const errorMsg = 'Please enter both email and password.';
                            errorDiv.textContent = errorMsg;
                            errorDiv.style.color = 'red';
                            return;
                        }
                        
                        loginBtn.disabled = true;
                        loginBtn.textContent = 'Logging in...';
                        loginBtn.style.background = '#666';
                        
                        const loginData = { email, password };
                        
                        try {
                            vscode.postMessage({
                                type: 'login',
                                data: loginData
                            });
                        } catch (error) {
                            errorDiv.textContent = 'Failed to send login request';
                            loginBtn.disabled = false;
                            loginBtn.textContent = 'Login';
                            loginBtn.style.background = '#007acc';
                        }
                    });
                    
                    [emailInput, passwordInput].forEach(input => {
                        input.addEventListener('keydown', (e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                loginBtn.click();
                            }
                        });
                    });
                    
                    if (!emailInput.value) {
                        emailInput.focus();
                    } else if (!passwordInput.value) {
                        passwordInput.focus();
                    }
                } else {
                    if (document.readyState !== 'complete') {
                        setTimeout(initializeLoginForm, 1000);
                    }
                }
            }, 100);
        }
        
        initializeLoginForm();
        
        // Initialize login form immediately
        initializeLoginForm();
        
        // Handle login response from extension
        function handleLoginResponse(data) {
            const loginBtn = document.getElementById('loginBtn');
            const errorDiv = document.getElementById('error');
            
            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtn.textContent = 'Login';
                loginBtn.style.background = '#007acc';
            }
            
            if (data.success) {
                if (errorDiv) {
                    errorDiv.textContent = '';
                    errorDiv.style.color = 'green';
                    errorDiv.textContent = 'Login successful! Loading dashboard...';
                }
            } else {
                if (errorDiv) {
                    errorDiv.style.color = 'red';
                    errorDiv.textContent = data.error || 'Login failed. Please try again.';
                }
            }
        }
        
        // Load dashboard data
        function loadDashboard() {
            currentTab = 'dashboard';
            
            const dashboardTab = document.querySelector('[data-tab="dashboard"]');
            if (dashboardTab) {
                document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
                dashboardTab.classList.add('active');
            }
            
            vscode.postMessage({ type: 'getDashboard', params: {} });
            
            const contentBody = document.getElementById('content-body');
            if (contentBody) {
                contentBody.innerHTML = \`
                    <div class="loading-content">
                        <div class="loading-spinner">📊</div>
                        <div>Loading dashboard...</div>
                    </div>
                \`;
            }
        }
        
        // Handle auth status updates
        function handleAuthStatus(isAuthenticated) {
            const loginScreen = document.getElementById('login-screen');
            const mainApp = document.getElementById('main-app');
            
            if (isAuthenticated) {
                if (loginScreen) loginScreen.classList.add('hidden');
                if (mainApp) mainApp.classList.remove('hidden');
                loadDashboard();
            } else {
                if (loginScreen) loginScreen.classList.remove('hidden');
                if (mainApp) mainApp.classList.add('hidden');
            }
        }
    </script>
</body>
</html>`;
    }
}
