import * as vscode from 'vscode';
import { APILensWebviewProvider } from './providers/WebviewProvider';
import { APIService } from './services/APIService';
import { WebSocketService } from './services/WebSocketService';
import { StatusBarService } from './services/StatusBarService';
import { FileSystemService } from './services/FileSystemService';
import { FileContextMenuHandler } from './handlers/FileContextMenuHandler';

let webviewProvider: APILensWebviewProvider;
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

    // Register commands
    const openPanelCommand = vscode.commands.registerCommand('apilens.openPanel', () => {
        webviewProvider.show();
    });

    const refreshCommand = vscode.commands.registerCommand('apilens.refreshData', () => {
        webviewProvider.refresh();
        statusBarService.refresh();
    });

    const addApiCommand = vscode.commands.registerCommand('apilens.addApi', () => {
        webviewProvider.show();
        // Switch to add-api tab via message
        setTimeout(() => {
            webviewProvider.sendMessage({ type: 'switchTab', tab: 'add-api' });
        }, 100);
    });

    const viewChangesCommand = vscode.commands.registerCommand('apilens.viewChanges', () => {
        webviewProvider.show();
        // Switch to changes tab via message  
        setTimeout(() => {
            webviewProvider.sendMessage({ type: 'switchTab', tab: 'changes' });
        }, 100);
    });

    // Show API detail in the API Details tab
    const showApiDetailCommand = vscode.commands.registerCommand('apilens.showApiDetail', (id: string) => {
        if (id) {
            webviewProvider.show();
            // Use the existing showApiDetail handler
            setTimeout(() => {
                webviewProvider.sendMessage({ type: 'showApiDetail', apiId: id });
            }, 100);
        }
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
                    // Open the main webview and navigate to API details
                    vscode.commands.executeCommand('apilens.openPanel');
                    webviewProvider.sendMessage({
                        type: 'navigateToApi',
                        apiId: data.apiId
                    });
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
                    // Open the main webview and navigate to API details
                    vscode.commands.executeCommand('apilens.openPanel');
                    webviewProvider.sendMessage({
                        type: 'navigateToApi',
                        apiId: data.apiId
                    });
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
        openPanelCommand,
        refreshCommand,
        addApiCommand,
        viewChangesCommand,
        showApiDetailCommand
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
