import * as vscode from 'vscode';
import { APIService } from './APIService';

export class StatusBarService {
    private statusBarItem: vscode.StatusBarItem;
    private context: vscode.ExtensionContext;
    private apiService: APIService;
    private updateInterval: any = null;

    constructor(context: vscode.ExtensionContext, apiService: APIService) {
        this.context = context;
        this.apiService = apiService;
        
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        
        this.statusBarItem.command = 'apilens.openPanel';
        this.statusBarItem.tooltip = 'Click to open APILens';
        
        context.subscriptions.push(this.statusBarItem);
    }

    async show(): Promise<void> {
        try {
            const isAuth = await this.apiService.isAuthenticated();
            if (!isAuth) {
                this.statusBarItem.text = '$(globe) APILens: Not logged in';
                this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
                this.statusBarItem.show();
                return;
            }

            await this.updateStats();
            this.statusBarItem.show();
            
            // Start auto-update
            this.startAutoUpdate();
            
        } catch (error) {
            this.statusBarItem.text = '$(globe) APILens: Error';
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
            this.statusBarItem.show();
        }
    }

    hide(): void {
        this.statusBarItem.hide();
        this.stopAutoUpdate();
    }

    async updateStats(): Promise<void> {
        try {
            const stats = await this.apiService.getDashboardStats();
            
            const activeApis = stats.activeApis || 0;
            const totalApis = stats.totalApis || 0;
            const criticalIssues = stats.criticalIssues || 0;
            
            let text = `$(globe) APILens: ${activeApis}/${totalApis} APIs`;
            let backgroundColor: vscode.ThemeColor | undefined;
            
            if (criticalIssues > 0) {
                text += ` $(warning) ${criticalIssues}`;
                backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
            } else {
                backgroundColor = undefined;
            }
            
            this.statusBarItem.text = text;
            this.statusBarItem.backgroundColor = backgroundColor;
            
        } catch (error) {
            this.statusBarItem.text = '$(globe) APILens: Error';
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        }
    }

    private startAutoUpdate(): void {
        this.stopAutoUpdate();
        
        this.updateInterval = setInterval(async () => {
            await this.updateStats();
        }, 60000); // Update every minute
    }

    private stopAutoUpdate(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    updateConnectionStatus(connected: boolean): void {
        if (connected) {
            this.statusBarItem.tooltip = 'APILens: Connected with real-time updates';
        } else {
            this.statusBarItem.tooltip = 'APILens: Connected (real-time unavailable)';
        }
    }

    /**
     * Refresh status bar data
     */
    async refresh(): Promise<void> {
        await this.updateStats();
    }

    dispose(): void {
        this.stopAutoUpdate();
        this.statusBarItem.dispose();
    }
}
