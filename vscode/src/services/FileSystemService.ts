import * as vscode from 'vscode';
import * as path from 'path';
import { APIService } from './APIService';

export interface OpenAPIFile {
    path: string;
    name: string;
    content: string;
    apiId?: string;
}

export class FileSystemService {
    private context: vscode.ExtensionContext;
    private apiService: APIService;
    private watchers: vscode.FileSystemWatcher[] = [];

    constructor(context: vscode.ExtensionContext, apiService: APIService) {
        this.context = context;
        this.apiService = apiService;
    }

    async findOpenAPIFiles(): Promise<OpenAPIFile[]> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return [];
        }

        const openApiFiles: OpenAPIFile[] = [];

        for (const folder of workspaceFolders) {
            const patterns = [
                '**/swagger.{json,yaml,yml}',
                '**/openapi.{json,yaml,yml}',
                '**/api-spec.{json,yaml,yml}',
                '**/*swagger*.{json,yaml,yml}',
                '**/*openapi*.{json,yaml,yml}',
                '**/*api-spec*.{json,yaml,yml}'
            ];

            for (const pattern of patterns) {
                const files = await vscode.workspace.findFiles(
                    new vscode.RelativePattern(folder, pattern),
                    '**/node_modules/**',
                    100
                );

                for (const file of files) {
                    try {
                        const content = await vscode.workspace.fs.readFile(file);
                        const textContent = Buffer.from(content).toString('utf8');
                        
                        if (this.isOpenAPISpec(textContent)) {
                            openApiFiles.push({
                                path: file.fsPath,
                                name: path.basename(file.fsPath),
                                content: textContent
                            });
                        }
                    } catch (error) {
                        console.error(`Error reading file ${file.fsPath}:`, error);
                    }
                }
            }
        }

        return openApiFiles;
    }

    private isOpenAPISpec(content: string): boolean {
        try {
            const parsed = JSON.parse(content);
            return !!(parsed.openapi || parsed.swagger);
        } catch {
            return content.includes('openapi:') || content.includes('swagger:');
        }
    }

    async watchOpenAPIFiles(onFileChange: (file: OpenAPIFile) => void): Promise<void> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return;
        }

        this.watchers.forEach(watcher => watcher.dispose());
        this.watchers = [];

        for (const folder of workspaceFolders) {
            const watcher = vscode.workspace.createFileSystemWatcher(
                new vscode.RelativePattern(folder, '**/*.{json,yaml,yml}')
            );

            watcher.onDidChange(async (uri) => {
                await this.handleFileChange(uri, onFileChange);
            });

            watcher.onDidCreate(async (uri) => {
                await this.handleFileChange(uri, onFileChange);
            });

            this.watchers.push(watcher);
            this.context.subscriptions.push(watcher);
        }
    }

    private async handleFileChange(uri: vscode.Uri, onFileChange: (file: OpenAPIFile) => void): Promise<void> {
        try {
            const content = await vscode.workspace.fs.readFile(uri);
            const textContent = Buffer.from(content).toString('utf8');
            
            if (this.isOpenAPISpec(textContent)) {
                const file: OpenAPIFile = {
                    path: uri.fsPath,
                    name: path.basename(uri.fsPath),
                    content: textContent
                };
                
                onFileChange(file);
            }
        } catch (error) {
            console.error(`Error handling file change ${uri.fsPath}:`, error);
        }
    }

    async createAPIFromFile(file: OpenAPIFile): Promise<void> {
        try {
            let specData;
            try {
                specData = JSON.parse(file.content);
            } catch {
                // If JSON parsing fails, assume it's YAML and convert
                vscode.window.showErrorMessage('YAML OpenAPI specs not yet supported. Please use JSON format.');
                return;
            }

            const apiData = {
                apiName: specData.info?.title || path.basename(file.name, path.extname(file.name)),
                description: specData.info?.description || '',
                version: specData.info?.version || '1.0.0',
                type: 'openapi',
                specUrl: vscode.Uri.file(file.path).toString(),
                url: this.extractServerUrl(specData),
                filePath: file.path
            };

            await this.apiService.createApi(apiData);
            
            vscode.window.showInformationMessage(
                `API "${apiData.apiName}" created from ${file.name}`,
                'View APIs'
            ).then((selection) => {
                if (selection === 'View APIs') {
                    vscode.commands.executeCommand('apilens.openPanel');
                }
            });

        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to create API from file: ${error.message}`);
        }
    }

    private extractServerUrl(specData: any): string {
        if (specData.servers && specData.servers.length > 0) {
            return specData.servers[0].url;
        }
        if (specData.host) {
            const scheme = specData.schemes?.[0] || 'https';
            const basePath = specData.basePath || '';
            return `${scheme}://${specData.host}${basePath}`;
        }
        return '';
    }

    async showFileQuickPick(): Promise<OpenAPIFile | undefined> {
        const files = await this.findOpenAPIFiles();
        
        if (files.length === 0) {
            vscode.window.showInformationMessage('No OpenAPI specification files found in workspace');
            return undefined;
        }

        const quickPickItems = files.map(file => ({
            label: file.name,
            description: path.dirname(file.path),
            detail: file.path,
            file: file
        }));

        const selected = await vscode.window.showQuickPick(quickPickItems, {
            placeHolder: 'Select OpenAPI specification file',
            matchOnDescription: true,
            matchOnDetail: true
        });

        return selected?.file;
    }

    startWatching(): void {
        this.watchOpenAPIFiles(() => {
            
        });
    }

    dispose(): void {
        this.watchers.forEach(watcher => watcher.dispose());
        this.watchers = [];
    }

    async validateOpenAPISpec(content: string): Promise<{
        isValid: boolean;
        errors?: string[];
        info?: { title: string; version: string; description?: string };
    }> {
        try {
            let spec;
            
            try {
                spec = JSON.parse(content);
            } catch {
                try {
                    const yaml = require('js-yaml');
                    spec = yaml.load(content);
                } catch (yamlError) {
                    return {
                        isValid: false,
                        errors: ['Invalid JSON/YAML format']
                    };
                }
            }

            const errors: string[] = [];

            if (!spec.openapi && !spec.swagger) {
                errors.push('Missing OpenAPI/Swagger version field');
            }

            if (!spec.info) {
                errors.push('Missing required "info" object');
            } else {
                if (!spec.info.title) {
                    errors.push('Missing required "info.title" field');
                }
                if (!spec.info.version) {
                    errors.push('Missing required "info.version" field');
                }
            }

            if (!spec.paths || Object.keys(spec.paths).length === 0) {
                errors.push('No API paths defined (this may be intentional for some specs)');
            }

            const isValid = errors.length === 0 || (errors.length === 1 && errors[0].includes('No API paths'));

            return {
                isValid,
                errors: errors.length > 0 ? errors : undefined,
                info: spec.info ? {
                    title: spec.info.title || 'Unknown',
                    version: spec.info.version || 'Unknown',
                    description: spec.info.description
                } : undefined
            };

        } catch (error: any) {
            return {
                isValid: false,
                errors: [`Validation error: ${error.message}`]
            };
        }
    }
}
