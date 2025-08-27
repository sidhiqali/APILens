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

    private async checkAuthAndNavigate() {
        console.log('APILens: Checking authentication...');
        const isAuth = await this.apiService.isAuthenticated();
        console.log('APILens: Authentication status:', isAuth);
        this.sendMessage({ type: 'authStatus', isAuthenticated: isAuth });
        if (isAuth) {
            router.navigate('/dashboard');
        } else {
            router.navigate('/login');
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
            case 'getChangelogs':
                await this.handleGetChangelogs(message.params);
                break;
            case 'getNotifications':
                await this.handleGetNotifications(message.params);
                break;
            case 'markNotificationAsRead':
                await this.handleMarkNotificationAsRead(message.id);
                break;
            case 'markAllNotificationsAsRead':
                await this.handleMarkAllNotificationsAsRead();
                break;
            case 'getUserSettings':
                await this.handleGetUserSettings();
                break;
            case 'updateUserSettings':
                await this.handleUpdateUserSettings(message.data);
                break;
            case 'getIssues':
                await this.handleGetIssues();
                break;
            case 'ready':
                console.log('APILens: Webview ready, checking auth...');
                this.checkAuthAndNavigate();
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

    private async handleGetApis(params?: any) {
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

    private async handleCreateApi(apiData: any) {
        try {
            const api = await this.apiService.createApi(apiData);
            this.sendMessage({ 
                type: 'apiCreated', 
                data: api 
            });
            router.navigate('/apis');
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
            // Refresh data
            this.handleGetApis();
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
            // Refresh data
            this.handleGetApis();
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
            // Refresh data after a delay
            setTimeout(() => this.handleGetApis(), 2000);
        } catch (error: any) {
            this.sendMessage({ 
                type: 'error', 
                error: error.message 
            });
        }
    }

    private async handleGetAnalytics(params?: any) {
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

    private async handleGetChangelogs(params?: any) {
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

    private async handleGetNotifications(params?: any) {
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

    private async handleMarkNotificationAsRead(id: string) {
        try {
            await this.apiService.markNotificationAsRead(id);
            this.sendMessage({ type: 'notificationMarkedAsRead', id });
            // Refresh notifications
            this.handleGetNotifications();
        } catch (error: any) {
            this.sendMessage({ 
                type: 'error', 
                error: error.message 
            });
        }
    }

    private async handleMarkAllNotificationsAsRead() {
        try {
            await this.apiService.markAllNotificationsAsRead();
            this.sendMessage({ type: 'allNotificationsMarkedAsRead' });
            // Refresh notifications
            this.handleGetNotifications();
        } catch (error: any) {
            this.sendMessage({ 
                type: 'error', 
                error: error.message 
            });
        }
    }

    private async handleGetUserSettings() {
        try {
            const settings = await this.apiService.getUserSettings();
            this.sendMessage({ 
                type: 'userSettings', 
                data: settings 
            });
        } catch (error: any) {
            this.sendMessage({ 
                type: 'error', 
                error: error.message 
            });
        }
    }

    private async handleUpdateUserSettings(settings: any) {
        try {
            const updatedSettings = await this.apiService.updateUserSettings(settings);
            this.sendMessage({ 
                type: 'userSettingsUpdated', 
                data: updatedSettings 
            });
        } catch (error: any) {
            this.sendMessage({ 
                type: 'error', 
                error: error.message 
            });
        }
    }

    private async handleGetIssues() {
        try {
            // Get APIs with health issues
            const apis = await this.apiService.getApis();
            const issues = apis.filter(api => 
                api.healthStatus === 'unhealthy' || 
                api.healthStatus === 'unknown' ||
                !api.isActive
            ).map(api => ({
                id: api.id,
                apiName: api.apiName,
                type: api.healthStatus === 'unhealthy' ? 'health' : api.healthStatus === 'unknown' ? 'unknown' : 'inactive',
                message: api.healthStatus === 'unhealthy' ? `API is unhealthy` : 
                        api.healthStatus === 'unknown' ? `API status unknown` : 
                        `API is inactive`,
                severity: api.healthStatus === 'unhealthy' ? 'high' : 'medium',
                timestamp: api.lastChecked || new Date().toISOString(),
                status: 'open'
            }));

            this.sendMessage({ 
                type: 'issues', 
                data: issues 
            });
        } catch (error: any) {
            this.sendMessage({ 
                type: 'error', 
                error: error.message 
            });
        }
    }

    private async handleRouteChange(route: string, params: RouteParams) {
        this.sendMessage({ 
            type: 'routeChange', 
            route, 
            params 
        });

        // Auto-load data for each route
        try {
            switch (route) {
                case '/dashboard':
                    await this.handleGetDashboardStats();
                    await this.handleGetApis({ limit: 5 });
                    break;
                case '/apis':
                    await this.handleGetApis({});
                    break;
                case '/analytics':
                    await this.handleGetAnalytics({});
                    break;
                case '/notifications':
                    await this.handleGetNotifications({});
                    break;
                case '/changes':
                    await this.handleGetChangelogs({});
                    break;
                case '/issues':
                    await this.handleGetIssues();
                    break;
                case '/settings':
                    await this.handleGetUserSettings();
                    break;
            }
        } catch (error) {
            console.error('Error loading route data:', error);
        }
    }

    private sendMessage(message: any) {
        if (this._view) {
            this._view.webview.postMessage(message);
        }
    }

    private getHtmlForWebview(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>APILens Login</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
        }
        .login-container {
            background: var(--vscode-sideBar-background);
            padding: 2rem 2.5rem;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            min-width: 320px;
        }
        h2 {
            margin-bottom: 1.5rem;
            text-align: center;
        }
        input {
            width: 100%;
            padding: 0.5rem;
            margin-bottom: 1rem;
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
        }
        button {
            width: 100%;
            padding: 0.7rem;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            font-weight: bold;
            cursor: pointer;
        }
        .error {
            color: var(--vscode-errorForeground);
            margin-bottom: 1rem;
            text-align: center;
        }
        .dashboard {
            padding: 1rem;
        }
        .dashboard h1 {
            color: var(--vscode-foreground);
            margin-bottom: 1.5rem;
            font-size: 1.5rem;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        .stat-card {
            background: var(--vscode-sideBar-background);
            padding: 1rem;
            border-radius: 6px;
            border: 1px solid var(--vscode-panel-border);
            text-align: center;
        }
        .stat-card h3 {
            margin: 0 0 0.5rem 0;
            font-size: 0.9rem;
            color: var(--vscode-descriptionForeground);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .stat-card .value {
            font-size: 2rem;
            font-weight: bold;
            color: var(--vscode-foreground);
        }
        .apis-section {
            margin-top: 2rem;
        }
        .apis-section h2 {
            margin-bottom: 1rem;
            font-size: 1.2rem;
        }
        .api-list {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        .api-item {
            background: var(--vscode-sideBar-background);
            padding: 1rem;
            border-radius: 6px;
            border: 1px solid var(--vscode-panel-border);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .api-info h4 {
            margin: 0 0 0.25rem 0;
            color: var(--vscode-foreground);
        }
        .api-info .url {
            font-size: 0.85rem;
            color: var(--vscode-descriptionForeground);
            font-family: monospace;
        }
        .api-status {
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: bold;
        }
        .status-active {
            background: var(--vscode-testing-iconPassed);
            color: white;
        }
        .status-inactive {
            background: var(--vscode-testing-iconFailed);
            color: white;
        }
        .add-api-btn {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            margin-bottom: 1rem;
        }
    </style>
</head>
<body>
    <div id="app">
        <div class="login-container">
            <h2>APILens Login</h2>
            <div id="error" class="error"></div>
            <input id="email" type="email" placeholder="Email" autocomplete="username" value="sidhiq@gmail.com" />
            <input id="password" type="password" placeholder="Password" autocomplete="current-password" value="alialiali" />
            <button id="loginBtn">Login</button>
        </div>
    </div>
    <script>
        const vscode = acquireVsCodeApi();
        
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.type) {
                case 'loginResponse':
                    if (message.data.success) {
                        // Request dashboard data after successful login
                        vscode.postMessage({ type: 'getDashboard' });
                    } else {
                        document.getElementById('error').textContent = message.data.error || 'Login failed';
                    }
                    break;
                case 'dashboardData':
                    showDashboard(message.data);
                    break;
                case 'apisData':
                    updateApisList(message.data);
                    break;
            }
        });
        
        document.getElementById('loginBtn').addEventListener('click', () => {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            document.getElementById('error').textContent = '';
            
            if (!email || !password) {
                document.getElementById('error').textContent = 'Please enter both email and password.';
                return;
            }
            
            vscode.postMessage({
                type: 'login',
                data: {
                    email: email,
                    password: password
                }
            });
        });
        
        function showDashboard(data) {
            document.getElementById('app').innerHTML = \`
                <div class="dashboard">
                    <h1>APILens Dashboard</h1>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <h3>Total APIs</h3>
                            <div class="value">\${data.stats?.totalApis || 0}</div>
                        </div>
                        <div class="stat-card">
                            <h3>Active Monitoring</h3>
                            <div class="value">\${data.stats?.activeApis || 0}</div>
                        </div>
                        <div class="stat-card">
                            <h3>Recent Changes</h3>
                            <div class="value">\${data.stats?.recentChanges || 0}</div>
                        </div>
                        <div class="stat-card">
                            <h3>Notifications</h3>
                            <div class="value">\${data.stats?.notifications || 0}</div>
                        </div>
                    </div>
                    
                    <div class="apis-section">
                        <h2>Your APIs</h2>
                        <button class="add-api-btn" onclick="addNewApi()">+ Add New API</button>
                        <div id="apis-list" class="api-list">
                            \${renderApisList(data.apis || [])}
                        </div>
                    </div>
                </div>
            \`;
        }
        
        function renderApisList(apis) {
            if (!apis || apis.length === 0) {
                return '<div style="text-align: center; color: var(--vscode-descriptionForeground); padding: 2rem;">No APIs registered yet. Click "Add New API" to get started!</div>';
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
        
        function updateApisList(apis) {
            const apisList = document.getElementById('apis-list');
            if (apisList) {
                apisList.innerHTML = renderApisList(apis);
            }
        }
        
        function addNewApi() {
            vscode.postMessage({ type: 'addApi' });
        }
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const loginBtn = document.getElementById('loginBtn');
                if (loginBtn) {
                    loginBtn.click();
                }
            }
        });
    </script>
</body>
</html>`;
    }
}
