import * as vscode from 'vscode';
import { APILensWebviewProvider } from './providers/WebviewProvider';
import { APIDetailViewProvider } from './providers/APIDetailViewProvider';
import { APIService } from './services/APIService';
import { WebSocketService } from './services/WebSocketService';
import { StatusBarService } from './services/StatusBarService';
import { FileSystemService } from './services/FileSystemService';
import { FileContextMenuHandler } from './handlers/FileContextMenuHandler';

let webviewProvider: APILensWebviewProvider;
let apiDetailProvider: APIDetailViewProvider;
let apiService: APIService;
let webSocketService: WebSocketService;
let statusBarService: StatusBarService;
let fileSystemService: FileSystemService;
let fileContextMenuHandler: FileContextMenuHandler;

export function activate(context: vscode.ExtensionContext) {

    // Initialize services
    apiService = new APIService();
    webSocketService = new WebSocketService(context, apiService);
    statusBarService = new StatusBarService(context, apiService);
    fileSystemService = new FileSystemService(context, apiService);
    
    // Initialize providers
    webviewProvider = new APILensWebviewProvider(context, apiService);
    apiDetailProvider = new APIDetailViewProvider(context, apiService);
    
    // Initialize handlers
    fileContextMenuHandler = new FileContextMenuHandler(context, fileSystemService, apiService);

    // Register webview providers
    const mainProvider = vscode.window.registerWebviewViewProvider(
        'apilens.main',
        webviewProvider,
        {
            webviewOptions: {
                retainContextWhenHidden: true
            }
        }
    );

    const apiDetailProviderDisposable = vscode.window.registerWebviewViewProvider(
        'apilens.apiDetail',
        apiDetailProvider,
        {
            webviewOptions: {
                retainContextWhenHidden: true
            }
        }
    );

    // Register commands
    const openPanelCommand = vscode.commands.registerCommand('apilens.openPanel', () => {
        webviewProvider.show();
    });

    const refreshCommand = vscode.commands.registerCommand('apilens.refreshData', () => {
        webviewProvider.refresh();
        statusBarService.refresh();
    });

    const addApiCommand = vscode.commands.registerCommand('apilens.addApi', () => {
        webviewProvider.navigateTo('/add-api');
    });

    const viewAnalyticsCommand = vscode.commands.registerCommand('apilens.viewAnalytics', () => {
        webviewProvider.navigateTo('/analytics');
    });

    const viewNotificationsCommand = vscode.commands.registerCommand('apilens.viewNotifications', () => {
        webviewProvider.navigateTo('/notifications');
    });

    const viewChangesCommand = vscode.commands.registerCommand('apilens.viewChanges', () => {
        webviewProvider.navigateTo('/changes');
    });

    // Start Phase 3 services
    webSocketService.connect();
    statusBarService.show();
    fileSystemService.startWatching();

    // Set up file watching for OpenAPI files
    fileSystemService.watchOpenAPIFiles((file) => {
        vscode.window.showInformationMessage(
            `OpenAPI file detected: ${file.name}`,
            'Import to APILens',
            'Ignore'
        ).then(selection => {
            if (selection === 'Import to APILens') {
                fileSystemService.createAPIFromFile(file);
            }
        });
    });

    // Set up WebSocket event handlers
    webSocketService.on('api-change', (data) => {
        webviewProvider.refresh();
        statusBarService.refresh();
        
        if (vscode.workspace.getConfiguration('apilens').get('showNotifications', true)) {
            vscode.window.showInformationMessage(
                `API change detected: ${data.apiName}`,
                'View Details'
            ).then(selection => {
                if (selection === 'View Details') {
                    apiDetailProvider.showApiDetail(data.apiId);
                }
            });
        }
    });

    webSocketService.on('api-health-change', (data) => {
        statusBarService.refresh();
        
        if (data.status === 'unhealthy') {
            vscode.window.showWarningMessage(
                `API health issue: ${data.apiName} is now ${data.status}`,
                'View Details'
            ).then(selection => {
                if (selection === 'View Details') {
                    apiDetailProvider.showApiDetail(data.apiId);
                }
            });
        }
    });

    // Update context based on APIs availability
    apiService.getApis().then(apis => {
        vscode.commands.executeCommand('setContext', 'apilens.hasApis', apis.length > 0);
    }).catch(() => {
        vscode.commands.executeCommand('setContext', 'apilens.hasApis', false);
    });

    context.subscriptions.push(
        mainProvider,
        apiDetailProviderDisposable,
        openPanelCommand,
        refreshCommand,
        addApiCommand,
        viewAnalyticsCommand,
        viewNotificationsCommand,
        viewChangesCommand
    );

    // Auto-refresh setup
    const config = vscode.workspace.getConfiguration('apilens');
    if (config.get('autoRefresh', true)) {
        const refreshInterval = setInterval(() => {
            webviewProvider.refresh();
            statusBarService.refresh();
        }, config.get('refreshInterval', 30000));

        context.subscriptions.push({
            dispose: () => clearInterval(refreshInterval)
        });
    }

}

export function deactivate() {
    
    // Clean up services
    if (webSocketService) {
        webSocketService.disconnect();
    }
    
    if (statusBarService) {
        statusBarService.dispose();
    }
    
    if (fileSystemService) {
        fileSystemService.dispose();
    }
}
