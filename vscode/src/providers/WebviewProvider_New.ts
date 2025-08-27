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
        console.log('🚀 [WebviewProvider] resolveWebviewView called');
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.context.extensionUri]
        };

        console.log('🎨 [WebviewProvider] Setting HTML content');
        webviewView.webview.html = this.getHtmlForWebview();

        // Handle messages from webview
        webviewView.webview.onDidReceiveMessage(
            async (message) => {
                console.log('📨 [WebviewProvider] Received message:', message);
                await this.handleMessage(message);
            },
            undefined,
            this.context.subscriptions
        );

        // Initialize with small delay to ensure webview is ready
        setTimeout(() => {
            console.log('⏱️ [WebviewProvider] Starting initialization');
            this.checkAuthAndNavigate();
        }, 100);
    }

    public show() {
        if (this._view) {
            this._view.show(true);
        }
    }

    public refresh() {
        // Refresh dashboard data when called by WebSocket events
        this.handleGetDashboard().catch(() => {
            console.log('Dashboard refresh failed - user might need to login');
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
        console.log('🔍 [WebviewProvider] checkAuthAndNavigate called');
        try {
            const isAuthenticated = await this.apiService.isAuthenticated();
            console.log('🔑 Authentication result:', isAuthenticated);
            
            if (isAuthenticated) {
                this.sendMessage({ type: 'authStatus', isAuthenticated: true });
                // Auto-load dashboard data
                this.handleGetDashboard();
            } else {
                this.sendMessage({ type: 'authStatus', isAuthenticated: false });
            }
        } catch (error) {
            console.error('❌ Authentication check failed:', error);
            this.sendMessage({ type: 'authStatus', isAuthenticated: false });
        }
    }

    private async handleMessage(message: any) {
        switch (message.type) {
            case 'login':
                await this.handleLogin(message.data);
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
            this.sendMessage({ type: 'authStatus', isAuthenticated: true });
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
            // Get both dashboard stats and APIs list
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
            this.sendMessage({ type: 'authStatus', isAuthenticated: false });
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
                        <h4>\${api.name}</h4>
                        <div class="url">\${api.url}</div>
                    </div>
                    <div class="api-status \${api.isActive ? 'status-active' : 'status-inactive'}">
                        \${api.isActive ? 'Active' : 'Inactive'}
                    </div>
                </div>
            \`).join('');
        }
        
        function renderAddApiForm() {
            document.getElementById('content-body').innerHTML = \`
                <div class="placeholder-content">
                    <div class="placeholder-icon">➕</div>
                    <div>Add API form will be implemented here</div>
                    <button class="add-btn" style="margin-top: 1rem;" onclick="addNewApi()">Launch Add API Dialog</button>
                </div>
            \`;
        }
        
        function renderApisList() {
            document.getElementById('content-body').innerHTML = \`
                <div class="placeholder-content">
                    <div class="placeholder-icon">🔗</div>
                    <div>APIs management interface coming soon</div>
                </div>
            \`;
        }
        
        function renderChanges() {
            document.getElementById('content-body').innerHTML = \`
                <div class="placeholder-content">
                    <div class="placeholder-icon">🔄</div>
                    <div>Changes tracking interface coming soon</div>
                </div>
            \`;
        }
        
        function renderIssues() {
            document.getElementById('content-body').innerHTML = \`
                <div class="placeholder-content">
                    <div class="placeholder-icon">⚠️</div>
                    <div>Issues & Alerts interface coming soon</div>
                </div>
            \`;
        }
        
        function renderNotifications() {
            document.getElementById('content-body').innerHTML = \`
                <div class="placeholder-content">
                    <div class="placeholder-icon">🔔</div>
                    <div>Notifications interface coming soon</div>
                </div>
            \`;
        }
        
        function renderAnalytics() {
            document.getElementById('content-body').innerHTML = \`
                <div class="placeholder-content">
                    <div class="placeholder-icon">📈</div>
                    <div>Analytics dashboard coming soon</div>
                </div>
            \`;
        }
        
        function renderSettings() {
            document.getElementById('content-body').innerHTML = \`
                <div class="placeholder-content">
                    <div class="placeholder-icon">⚙️</div>
                    <div>Settings interface coming soon</div>
                </div>
            \`;
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
        document.addEventListener('DOMContentLoaded', () => {
            const loginBtn = document.getElementById('loginBtn');
            if (loginBtn) {
                loginBtn.addEventListener('click', () => {
                    const email = document.getElementById('email').value;
                    const password = document.getElementById('password').value;
                    document.getElementById('error').textContent = '';
                    
                    if (!email || !password) {
                        document.getElementById('error').textContent = 'Please enter both email and password.';
                        return;
                    }
                    
                    vscode.postMessage({
                        type: 'login',
                        data: { email, password }
                    });
                });
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const loginBtn = document.getElementById('loginBtn');
                if (loginBtn && !document.getElementById('login-screen').classList.contains('hidden')) {
                    loginBtn.click();
                }
            }
        });
    </script>
</body>
</html>`;
    }
}
