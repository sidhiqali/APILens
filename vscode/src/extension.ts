import * as vscode from 'vscode';

class APILensPanel {
	public static currentPanel: APILensPanel | undefined;
	public static readonly viewType = 'apilens.dashboard';

	private readonly _panel: vscode.WebviewPanel;
	private _disposables: vscode.Disposable[] = [];

	public static createOrShow(extensionUri: vscode.Uri) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		if (APILensPanel.currentPanel) {
			APILensPanel.currentPanel._panel.reveal(column);
			return;
		}

		const panel = vscode.window.createWebviewPanel(
			APILensPanel.viewType,
			'APILens Dashboard',
			column || vscode.ViewColumn.One,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: [extensionUri]
			}
		);

		APILensPanel.currentPanel = new APILensPanel(panel, extensionUri);
	}

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		this._panel = panel;

		this._update();

		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		this._panel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'alert':
						vscode.window.showInformationMessage(message.text);
						return;
					case 'error':
						vscode.window.showErrorMessage(message.text);
						return;
				}
			},
			null,
			this._disposables
		);
	}

	public dispose() {
		APILensPanel.currentPanel = undefined;

		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	private _update() {
		const webview = this._panel.webview;
		this._panel.title = 'APILens Dashboard';
		this._panel.webview.html = this._getHtmlForWebview(webview);
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>APILens Dashboard</title>
	<style>
		body {
			margin: 0;
			padding: 0;
			width: 100%;
			height: 100vh;
			overflow: hidden;
		}
		
		iframe {
			width: 100%;
			height: 100vh;
			border: none;
		}
		
		.loading {
			display: flex;
			justify-content: center;
			align-items: center;
			height: 100vh;
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
			color: var(--vscode-foreground);
		}
		
		.error {
			display: none;
			flex-direction: column;
			justify-content: center;
			align-items: center;
			height: 100vh;
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
			color: var(--vscode-errorForeground);
			text-align: center;
			padding: 20px;
		}
		
		.retry-button {
			margin-top: 20px;
			padding: 10px 20px;
			background: var(--vscode-button-background);
			color: var(--vscode-button-foreground);
			border: none;
			border-radius: 4px;
			cursor: pointer;
		}
		
		.retry-button:hover {
			background: var(--vscode-button-hoverBackground);
		}
	</style>
</head>
<body>
	<div id="loading" class="loading">
		<div>Loading APILens Dashboard...</div>
	</div>
	
	<div id="error" class="error">
		<div>
			<h3>Connection Error</h3>
			<p>Unable to connect to APILens server at localhost:3001</p>
			<p>Please ensure your APILens development server is running:</p>
			<code>cd client && npm run dev</code>
		</div>
		<button class="retry-button" onclick="retryConnection()">Retry</button>
	</div>
	
	<iframe 
		id="apilens-frame"
		src="http://localhost:3001"
		style="display: none;"
		onload="handleFrameLoad()"
		onerror="handleFrameError()">
	</iframe>

	<script>
		const vscode = acquireVsCodeApi();
		let retryAttempts = 0;
		const maxRetries = 3;

		function handleFrameLoad() {
			document.getElementById('loading').style.display = 'none';
			document.getElementById('error').style.display = 'none';
			document.getElementById('apilens-frame').style.display = 'block';
			retryAttempts = 0;
		}

		function handleFrameError() {
			document.getElementById('loading').style.display = 'none';
			document.getElementById('apilens-frame').style.display = 'none';
			document.getElementById('error').style.display = 'flex';
		}

		function retryConnection() {
			if (retryAttempts < maxRetries) {
				retryAttempts++;
				document.getElementById('error').style.display = 'none';
				document.getElementById('loading').style.display = 'flex';
				
				const frame = document.getElementById('apilens-frame');
				frame.src = frame.src; // Reload iframe
			} else {
				vscode.postMessage({
					command: 'error',
					text: 'Failed to connect to APILens after multiple attempts. Please check if the server is running on localhost:3001'
				});
			}
		}

		setTimeout(() => {
			const frame = document.getElementById('apilens-frame');
			try {
				if (frame.contentDocument === null && frame.style.display === 'none') {
					handleFrameError();
				}
			} catch (e) {
				if (frame.style.display === 'none') {
					handleFrameLoad();
				}
			}
		}, 5000);
	</script>
</body>
</html>`;
	}
}

export function activate(context: vscode.ExtensionContext) {
	const commands = [
		vscode.commands.registerCommand('apilens.openDashboard', () => {
			APILensPanel.createOrShow(context.extensionUri);
		}),

		vscode.commands.registerCommand('apilens.openAnalytics', () => {
			APILensPanel.createOrShow(context.extensionUri);
			vscode.window.showInformationMessage('Dashboard opened - navigate to Analytics tab');
		}),

		vscode.commands.registerCommand('apilens.viewNotifications', () => {
			APILensPanel.createOrShow(context.extensionUri);
			vscode.window.showInformationMessage('Dashboard opened - navigate to Notifications tab');
		}),

		vscode.commands.registerCommand('apilens.addAPI', () => {
			APILensPanel.createOrShow(context.extensionUri);
			vscode.window.showInformationMessage('Dashboard opened - use the Add API button');
		}),

		vscode.commands.registerCommand('apilens.refreshAPIs', () => {
			if (APILensPanel.currentPanel) {
				APILensPanel.currentPanel.dispose();
				APILensPanel.createOrShow(context.extensionUri);
			} else {
				APILensPanel.createOrShow(context.extensionUri);
			}
			vscode.window.showInformationMessage('APILens refreshed');
		})
	];

	context.subscriptions.push(...commands);

	const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
	statusBar.text = "$(cloud) APILens";
	statusBar.tooltip = "Open APILens Dashboard";
	statusBar.command = 'apilens.openDashboard';
	statusBar.show();
	context.subscriptions.push(statusBar);

	vscode.window.showInformationMessage(
		'APILens extension activated! Make sure your development server is running on localhost:3001',
		'Open Dashboard'
	).then(selection => {
		if (selection === 'Open Dashboard') {
			vscode.commands.executeCommand('apilens.openDashboard');
		}
	});
}

export function deactivate() {}
