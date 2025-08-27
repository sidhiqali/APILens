import * as vscode from 'vscode';
import { APIService } from '../services/APIService';

export class APIDetailViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'apilens.apiDetail';
    private _view?: vscode.WebviewView;
    private currentApiId?: string;

    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly apiService: APIService
    ) {}

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
    }

    public showApiDetail(apiId: string) {
        this.currentApiId = apiId;
        if (this._view) {
            this._view.show(true);
            this.loadApiDetail(apiId);
        }
    }

    private async loadApiDetail(apiId: string) {
        try {
            const api = await this.apiService.getApi(apiId);
            const changelogs = await this.apiService.getChangelogs({ apiId, limit: 10 });
            
            this.sendMessage({
                type: 'apiDetailData',
                data: {
                    api,
                    changelogs
                }
            });
        } catch (error: any) {
            this.sendMessage({
                type: 'error',
                error: error.message
            });
        }
    }

    private async handleMessage(message: any) {
        switch (message.type) {
            case 'refreshDetail':
                if (this.currentApiId) {
                    await this.loadApiDetail(this.currentApiId);
                }
                break;
            case 'checkApi':
                if (this.currentApiId) {
                    try {
                        await this.apiService.checkApiNow(this.currentApiId);
                        this.sendMessage({ type: 'apiChecked' });
                        // Refresh after a delay
                        setTimeout(() => this.loadApiDetail(this.currentApiId!), 2000);
                    } catch (error: any) {
                        this.sendMessage({ type: 'error', error: error.message });
                    }
                }
                break;
            case 'toggleStatus':
                if (this.currentApiId) {
                    try {
                        await this.apiService.toggleApiStatus(this.currentApiId);
                        this.sendMessage({ type: 'statusToggled' });
                        await this.loadApiDetail(this.currentApiId);
                    } catch (error: any) {
                        this.sendMessage({ type: 'error', error: error.message });
                    }
                }
                break;
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
    <title>API Detail</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 16px;
            margin: 0;
        }
        
        .api-header {
            margin-bottom: 20px;
            padding-bottom: 12px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        
        .api-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 8px;
        }
        
        .api-status {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
            margin-bottom: 8px;
        }
        
        .status-healthy {
            background: rgba(0, 255, 0, 0.2);
            color: var(--vscode-terminal-ansiGreen);
        }
        
        .status-unhealthy {
            background: rgba(255, 0, 0, 0.2);
            color: var(--vscode-terminal-ansiRed);
        }
        
        .status-checking {
            background: rgba(255, 255, 0, 0.2);
            color: var(--vscode-terminal-ansiYellow);
        }
        
        .api-actions {
            margin: 12px 0;
        }
        
        .btn {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            margin-right: 8px;
            font-size: 12px;
        }
        
        .btn:hover {
            background: var(--vscode-button-hoverBackground);
        }
        
        .btn-secondary {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: auto 1fr;
            gap: 8px 16px;
            margin-bottom: 20px;
            font-size: 13px;
        }
        
        .info-label {
            font-weight: 500;
            color: var(--vscode-descriptionForeground);
        }
        
        .changelog-section {
            margin-top: 20px;
        }
        
        .changelog-item {
            padding: 12px;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
            margin-bottom: 8px;
        }
        
        .changelog-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        
        .changelog-type {
            font-weight: 500;
            font-size: 12px;
        }
        
        .changelog-date {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
        }
        
        .loading {
            text-align: center;
            padding: 40px;
            color: var(--vscode-descriptionForeground);
        }
        
        .error {
            color: var(--vscode-errorForeground);
            background: var(--vscode-inputValidation-errorBackground);
            border: 1px solid var(--vscode-inputValidation-errorBorder);
            padding: 8px 12px;
            border-radius: 4px;
            margin-bottom: 16px;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div id="content">
        <div class="loading">Select an API to view details</div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let currentData = {};

        window.addEventListener('message', event => {
            const message = event.data;
            handleMessage(message);
        });

        function handleMessage(message) {
            switch (message.type) {
                case 'apiDetailData':
                    currentData = message.data;
                    renderApiDetail();
                    break;
                case 'error':
                    showError(message.error);
                    break;
                case 'apiChecked':
                    showSuccess('API check initiated');
                    break;
                case 'statusToggled':
                    showSuccess('Status updated');
                    break;
            }
        }

        function renderApiDetail() {
            const api = currentData.api || {};
            const changelogs = currentData.changelogs || [];
            
            const content = document.getElementById('content');
            content.innerHTML = \`
                <div class="api-header">
                    <div class="api-title">\${api.apiName || 'Unknown API'}</div>
                    <div class="api-status status-\${api.healthStatus || 'unknown'}">\${api.healthStatus || 'unknown'}</div>
                    <div style="font-size: 13px; color: var(--vscode-descriptionForeground);">
                        \${api.description || 'No description'}
                    </div>
                </div>
                
                <div class="api-actions">
                    <button class="btn" onclick="checkApi()">Check Now</button>
                    <button class="btn btn-secondary" onclick="toggleStatus()">\${api.isActive ? 'Pause' : 'Resume'}</button>
                    <button class="btn btn-secondary" onclick="refresh()">Refresh</button>
                </div>
                
                <div class="info-grid">
                    <span class="info-label">Type:</span>
                    <span>\${api.type || 'Unknown'}</span>
                    
                    <span class="info-label">Version:</span>
                    <span>\${api.version || 'N/A'}</span>
                    
                    <span class="info-label">URL:</span>
                    <span>\${api.url || 'N/A'}</span>
                    
                    <span class="info-label">Last Checked:</span>
                    <span>\${api.lastChecked ? new Date(api.lastChecked).toLocaleString() : 'Never'}</span>
                    
                    <span class="info-label">Status:</span>
                    <span>\${api.isActive ? 'Active' : 'Inactive'}</span>
                </div>
                
                <div class="changelog-section">
                    <h3>Recent Changes</h3>
                    \${changelogs.length > 0 ? 
                        changelogs.map(change => \`
                            <div class="changelog-item">
                                <div class="changelog-header">
                                    <span class="changelog-type">\${change.changeType || 'Change'}</span>
                                    <span class="changelog-date">\${new Date(change.detectedAt).toLocaleString()}</span>
                                </div>
                                <div>\${change.description || 'No description'}</div>
                            </div>
                        \`).join('') :
                        '<div style="color: var(--vscode-descriptionForeground); font-style: italic;">No recent changes</div>'
                    }
                </div>
            \`;
        }

        function checkApi() {
            vscode.postMessage({ type: 'checkApi' });
        }

        function toggleStatus() {
            vscode.postMessage({ type: 'toggleStatus' });
        }

        function refresh() {
            vscode.postMessage({ type: 'refreshDetail' });
        }

        function showError(message) {
            const content = document.getElementById('content');
            content.innerHTML = \`<div class="error">\${message}</div>\` + content.innerHTML;
        }

        function showSuccess(message) {
            const content = document.getElementById('content');
            const successDiv = document.createElement('div');
            successDiv.className = 'error';
            successDiv.style.background = 'rgba(0, 255, 0, 0.1)';
            successDiv.style.borderColor = 'rgba(0, 255, 0, 0.3)';
            successDiv.style.color = 'var(--vscode-terminal-ansiGreen)';
            successDiv.textContent = message;
            content.insertBefore(successDiv, content.firstChild);
            
            setTimeout(() => {
                successDiv.remove();
            }, 3000);
        }
    </script>
</body>
</html>`;
    }
}
