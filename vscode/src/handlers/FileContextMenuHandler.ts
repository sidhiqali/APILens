import * as vscode from 'vscode';
import * as path from 'path';
import { FileSystemService } from '../services/FileSystemService';
import { APIService } from '../services/APIService';

export class FileContextMenuHandler {
    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly fileSystemService: FileSystemService,
        private readonly apiService: APIService
    ) {
        this.registerCommands();
    }

    private registerCommands() {
        const registerApiCommand = vscode.commands.registerCommand(
            'apilens.registerApiFromFile',
            async (uri: vscode.Uri) => {
                await this.registerApiFromFile(uri);
            }
        );

        const importApiCommand = vscode.commands.registerCommand(
            'apilens.importApiSpec',
            async (uri: vscode.Uri) => {
                await this.importApiSpec(uri);
            }
        );

        const validateCommand = vscode.commands.registerCommand(
            'apilens.validateOpenAPI',
            async (uri: vscode.Uri) => {
                await this.validateOpenAPISpec(uri);
            }
        );

        this.context.subscriptions.push(registerApiCommand, importApiCommand, validateCommand);
    }

    private async registerApiFromFile(uri: vscode.Uri) {
        try {
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
            if (!workspaceFolder) {
                vscode.window.showErrorMessage('File must be in a workspace to register API');
                return;
            }

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Registering API from file...',
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 20, message: 'Reading file...' });

                const content = await vscode.workspace.fs.readFile(uri);
                const fileContent = Buffer.from(content).toString('utf8');

                progress.report({ increment: 40, message: 'Parsing OpenAPI spec...' });

                let spec;
                try {
                    spec = JSON.parse(fileContent);
                } catch {
                    try {
                        const yaml = require('js-yaml');
                        spec = yaml.load(fileContent);
                    } catch {
                        throw new Error('Invalid JSON/YAML format');
                    }
                }

                progress.report({ increment: 60, message: 'Validating specification...' });

                if (!spec.openapi && !spec.swagger) {
                    throw new Error('Not a valid OpenAPI/Swagger specification');
                }

                const apiData = {
                    apiName: spec.info?.title || path.basename(uri.fsPath, path.extname(uri.fsPath)),
                    description: spec.info?.description || '',
                    version: spec.info?.version || '1.0.0',
                    type: 'openapi' as const,
                    url: this.extractBaseUrl(spec),
                    tags: spec.tags?.map((tag: any) => tag.name) || [],
                    specification: spec
                };

                progress.report({ increment: 80, message: 'Creating API...' });

                const result = await this.apiService.createApi(apiData);

                progress.report({ increment: 100, message: 'Complete!' });

                vscode.window.showInformationMessage(
                    `API "${apiData.apiName}" registered successfully!`,
                    'View API'
                ).then(selection => {
                    if (selection === 'View API') {
                        vscode.commands.executeCommand('apilens.showMain');
                    }
                });
            });

        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to register API: ${error.message}`);
        }
    }

    private async importApiSpec(uri: vscode.Uri) {
        try {
            const options: vscode.QuickPickItem[] = [
                {
                    label: 'Create New API',
                    description: 'Register this spec as a new API in APILens'
                },
                {
                    label: 'Update Existing API',
                    description: 'Update an existing API with this specification'
                },
                {
                    label: 'Preview Only',
                    description: 'Just preview the API specification'
                }
            ];

            const selection = await vscode.window.showQuickPick(options, {
                placeHolder: 'How would you like to import this API specification?'
            });

            if (!selection) return;

            switch (selection.label) {
                case 'Create New API':
                    await this.registerApiFromFile(uri);
                    break;
                case 'Update Existing API':
                    await this.updateExistingApi(uri);
                    break;
                case 'Preview Only':
                    await this.previewApiSpec(uri);
                    break;
            }

        } catch (error: any) {
            vscode.window.showErrorMessage(`Import failed: ${error.message}`);
        }
    }

    private async updateExistingApi(uri: vscode.Uri) {
        try {
            // Get list of existing APIs
            const apis = await this.apiService.getApis();
            
            const apiOptions = apis.map(api => ({
                label: api.apiName,
                description: api.description,
                detail: `Version: ${api.version} | Type: ${api.type}`,
                apiId: api.id
            }));

            if (apiOptions.length === 0) {
                vscode.window.showInformationMessage('No existing APIs to update. Creating new API instead...');
                await this.registerApiFromFile(uri);
                return;
            }

            const selectedApi = await vscode.window.showQuickPick(apiOptions, {
                placeHolder: 'Select API to update'
            });

            if (!selectedApi) return;

            // Read and parse the file
            const content = await vscode.workspace.fs.readFile(uri);
            const fileContent = Buffer.from(content).toString('utf8');
            
            let spec;
            try {
                spec = JSON.parse(fileContent);
            } catch {
                const yaml = require('js-yaml');
                spec = yaml.load(fileContent);
            }

            const updateData = {
                version: spec.info?.version || '1.0.0',
                description: spec.info?.description || '',
                specification: spec
            };

            await this.apiService.updateApi(selectedApi.apiId, updateData);
            
            vscode.window.showInformationMessage(`API "${selectedApi.label}" updated successfully!`);

        } catch (error: any) {
            vscode.window.showErrorMessage(`Update failed: ${error.message}`);
        }
    }

    private async previewApiSpec(uri: vscode.Uri) {
        try {
            const content = await vscode.workspace.fs.readFile(uri);
            const fileContent = Buffer.from(content).toString('utf8');
            
            let spec;
            try {
                spec = JSON.parse(fileContent);
            } catch {
                const yaml = require('js-yaml');
                spec = yaml.load(fileContent);
            }

            const panel = vscode.window.createWebviewPanel(
                'apiPreview',
                `API Preview: ${spec.info?.title || 'Unknown'}`,
                vscode.ViewColumn.One,
                { enableScripts: true }
            );

            panel.webview.html = this.getPreviewHtml(spec);

        } catch (error: any) {
            vscode.window.showErrorMessage(`Preview failed: ${error.message}`);
        }
    }

    private async validateOpenAPISpec(uri: vscode.Uri) {
        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Validating OpenAPI specification...',
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 30, message: 'Reading file...' });

                const content = await vscode.workspace.fs.readFile(uri);
                const fileContent = Buffer.from(content).toString('utf8');

                progress.report({ increment: 60, message: 'Parsing and validating...' });

                const validation = await this.fileSystemService.validateOpenAPISpec(fileContent);

                progress.report({ increment: 100, message: 'Complete!' });

                if (validation.isValid) {
                    vscode.window.showInformationMessage(
                        '✅ Valid OpenAPI specification',
                        `API: ${validation.info?.title}, Version: ${validation.info?.version}`
                    );
                } else {
                    const errors = validation.errors?.join('\n') || 'Unknown validation errors';
                    vscode.window.showErrorMessage(`❌ Invalid OpenAPI specification:\n${errors}`);
                }
            });

        } catch (error: any) {
            vscode.window.showErrorMessage(`Validation failed: ${error.message}`);
        }
    }

    private extractBaseUrl(spec: any): string {
        // Try to extract base URL from OpenAPI spec
        if (spec.servers && spec.servers.length > 0) {
            return spec.servers[0].url;
        }
        
        if (spec.host) {
            const scheme = spec.schemes && spec.schemes.length > 0 ? spec.schemes[0] : 'https';
            const basePath = spec.basePath || '';
            return `${scheme}://${spec.host}${basePath}`;
        }
        
        return 'http://localhost:3000';
    }

    private getPreviewHtml(spec: any): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Preview</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
        }
        .header {
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 16px;
            margin-bottom: 20px;
        }
        .title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 8px;
        }
        .version {
            color: var(--vscode-descriptionForeground);
            font-size: 14px;
        }
        .description {
            margin-top: 12px;
            line-height: 1.6;
        }
        .section {
            margin: 20px 0;
        }
        .section-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 12px;
            color: var(--vscode-textLink-foreground);
        }
        .endpoint {
            background: var(--vscode-editor-inactiveSelectionBackground);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 12px;
            margin-bottom: 8px;
        }
        .method {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 3px;
            font-size: 12px;
            font-weight: bold;
            margin-right: 8px;
        }
        .method-get { background: #4CAF50; color: white; }
        .method-post { background: #2196F3; color: white; }
        .method-put { background: #FF9800; color: white; }
        .method-delete { background: #F44336; color: white; }
        .path {
            font-family: monospace;
            font-size: 14px;
        }
        .tags {
            margin-top: 8px;
        }
        .tag {
            display: inline-block;
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 11px;
            margin-right: 4px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">${spec.info?.title || 'API Specification'}</div>
        <div class="version">Version: ${spec.info?.version || 'Unknown'}</div>
        ${spec.info?.description ? `<div class="description">${spec.info.description}</div>` : ''}
    </div>
    
    ${spec.servers ? `
    <div class="section">
        <div class="section-title">Servers</div>
        ${spec.servers.map((server: any) => `
            <div>• ${server.url}${server.description ? ` - ${server.description}` : ''}</div>
        `).join('')}
    </div>
    ` : ''}
    
    ${spec.paths ? `
    <div class="section">
        <div class="section-title">Endpoints</div>
        ${Object.entries(spec.paths).map(([path, methods]: [string, any]) => 
            Object.entries(methods).map(([method, details]: [string, any]) => {
                if (typeof details !== 'object' || !details) return '';
                return `
                    <div class="endpoint">
                        <div>
                            <span class="method method-${method.toLowerCase()}">${method.toUpperCase()}</span>
                            <span class="path">${path}</span>
                        </div>
                        ${details.summary ? `<div style="margin-top: 8px; font-weight: 500;">${details.summary}</div>` : ''}
                        ${details.description ? `<div style="margin-top: 4px; color: var(--vscode-descriptionForeground); font-size: 13px;">${details.description}</div>` : ''}
                        ${details.tags ? `
                            <div class="tags">
                                ${details.tags.map((tag: string) => `<span class="tag">${tag}</span>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('')
        ).join('')}
    </div>
    ` : ''}
    
    ${spec.tags ? `
    <div class="section">
        <div class="section-title">Tags</div>
        ${spec.tags.map((tag: any) => `
            <div>• <strong>${tag.name}</strong>${tag.description ? ` - ${tag.description}` : ''}</div>
        `).join('')}
    </div>
    ` : ''}
</body>
</html>`;
    }
}
