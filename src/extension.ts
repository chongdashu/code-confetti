import * as vscode from "vscode";

let playgroundPanel: vscode.WebviewPanel | undefined;
let confettiPanel: vscode.WebviewPanel | undefined;

function createPlaygroundWebview(context: vscode.ExtensionContext) {
  if (playgroundPanel) {
    playgroundPanel.reveal();
    return;
  }

  playgroundPanel = vscode.window.createWebviewPanel(
    "confettiPlayground",
    "Confetti Playground",
    vscode.ViewColumn.Two,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
    }
  );

  playgroundPanel.webview.html = getPlaygroundWebviewContent();

  playgroundPanel.onDidDispose(() => {
    playgroundPanel = undefined;
  }, null);

  context.subscriptions.push(playgroundPanel);

  // Handle messages from the webview
  playgroundPanel.webview.onDidReceiveMessage(
    (message) => {
      switch (message.command) {
        case "updateSettings":
          updateConfettiSettings(message.settings);
          triggerConfetti();
          playgroundPanel?.webview.postMessage({
            command: "showToast",
            message: "Settings updated!",
          });
          break;
        case "testPop":
          triggerConfetti();
          break;
      }
    },
    undefined,
    context.subscriptions
  );
}

function createConfettiWebview(context: vscode.ExtensionContext) {
  if (confettiPanel) {
    confettiPanel.reveal();
    return;
  }

  confettiPanel = vscode.window.createWebviewPanel(
    "confettiView",
    "Confetti Display",
    vscode.ViewColumn.Three,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
    }
  );

  confettiPanel.webview.html = getConfettiWebviewContent();

  confettiPanel.onDidDispose(() => {
    confettiPanel = undefined;
  }, null);

  context.subscriptions.push(confettiPanel);
}

function updateConfettiSettings(settings: any) {
  if (confettiPanel) {
    confettiPanel.webview.postMessage({ command: "updateSettings", settings });
  }
}

function triggerConfetti() {
  if (confettiPanel) {
    confettiPanel.webview.postMessage({ command: "triggerConfetti" });
  } else {
    vscode.window.showErrorMessage(
      "Confetti webview is not open. Please run 'Show Confetti Display' first."
    );
  }
}

function getPlaygroundWebviewContent() {
  return `<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Confetti Playground</title>
			<style>
				/* ... (previous styles remain the same) ... */
			</style>
		</head>
		<body>
			<h2>Confetti Playground</h2>
			<div class="control-group">
				<label for="particleCount">Particle Count:</label>
				<input type="range" id="particleCount" min="10" max="200" value="100">
				<span id="particleCountValue">100</span>
			</div>
			<div class="control-group">
				<label for="spread">Spread:</label>
				<input type="range" id="spread" min="20" max="180" value="70">
				<span id="spreadValue">70</span>
			</div>
			<div class="control-group">
				<label for="angle">Angle:</label>
				<input type="range" id="angle" min="0" max="360" value="90">
				<span id="angleValue">90</span>
			</div>
			<div class="control-group">
				<label for="colors">Colors (comma-separated):</label>
				<input type="text" id="colors" value="#ff0000,#00ff00,#0000ff">
			</div>
			<div class="control-group">
				<label for="shapes">Shapes:</label>
				<select id="shapes" multiple>
					<option value="square" selected>Square</option>
					<option value="circle" selected>Circle</option>
					<option value="star">Star</option>
				</select>
			</div>
			<div class="control-group">
				<label for="origins">Origins:</label>
				<select id="origins" multiple>
					<option value="topLeft">Top Left</option>
					<option value="topCenter">Top Center</option>
					<option value="topRight">Top Right</option>
					<option value="middleLeft">Middle Left</option>
					<option value="center">Center</option>
					<option value="middleRight">Middle Right</option>
					<option value="bottomLeft">Bottom Left</option>
					<option value="bottomCenter">Bottom Center</option>
					<option value="bottomRight">Bottom Right</option>
				</select>
			</div>
			<button id="updateButton">Update Settings</button>
			<button id="testPopButton">Test a Pop!</button>
			<div id="toast"></div>
			<script>
				const vscode = acquireVsCodeApi();
				
				function updateSettings() {
					const settings = {
						particleCount: parseInt(document.getElementById('particleCount').value),
						spread: parseInt(document.getElementById('spread').value),
						angle: parseInt(document.getElementById('angle').value),
						colors: document.getElementById('colors').value.split(',').map(c => c.trim()),
						shapes: Array.from(document.getElementById('shapes').selectedOptions).map(o => o.value),
						origins: Array.from(document.getElementById('origins').selectedOptions).map(o => o.value)
					};
					vscode.postMessage({ command: 'updateSettings', settings });
				}
				
				function testPop() {
					vscode.postMessage({ command: 'testPop' });
				}
				
				document.getElementById('updateButton').addEventListener('click', updateSettings);
				document.getElementById('testPopButton').addEventListener('click', testPop);
				
				// Update displayed values for sliders
				['particleCount', 'spread', 'angle'].forEach(id => {
					const slider = document.getElementById(id);
					const valueSpan = document.getElementById(id + 'Value');
					slider.addEventListener('input', () => {
						valueSpan.textContent = slider.value;
					});
				});
	
				// Handle toast messages
				window.addEventListener('message', event => {
					if (event.data.command === 'showToast') {
						const toast = document.getElementById('toast');
						toast.textContent = event.data.message;
						toast.style.opacity = '1';
						setTimeout(() => {
							toast.style.opacity = '0';
						}, 3000);
					}
				});
			</script>
		</body>
		</html>`;
}

function getConfettiWebviewContent() {
  return `<!DOCTYPE html>
	  <html lang="en">
	  <head>
		  <meta charset="UTF-8">
		  <meta name="viewport" content="width=device-width, initial-scale=1.0">
		  <title>Confetti Display</title>
		  <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js"></script>
		  <style>
			  body, html { 
				  margin: 0; 
				  padding: 0; 
				  height: 100%; 
				  overflow: hidden; 
			  }
			  #confetti-canvas { 
				  position: fixed; 
				  top: 0; 
				  left: 0; 
				  width: 100%; 
				  height: 100%; 
				  pointer-events: none; 
			  }
		  </style>
	  </head>
	  <body>
		  <canvas id="confetti-canvas"></canvas>
		  <script>
			  const vscode = acquireVsCodeApi();
			  const canvas = document.getElementById('confetti-canvas');
			  const myConfetti = confetti.create(canvas, { resize: true });
			  
			  let confettiSettings = {
				  particleCount: 100,
				  spread: 70,
				  angle: 90,
				  colors: ['#ff0000', '#00ff00', '#0000ff'],
				  shapes: ['square', 'circle'],
				  origins: ['topLeft', 'topCenter', 'topRight', 'middleLeft', 'center', 'middleRight', 'bottomLeft', 'bottomCenter', 'bottomRight']
			  };
			  
			  const originMap = {
				  topLeft: { x: 0, y: 0 },
				  topCenter: { x: 0.5, y: 0 },
				  topRight: { x: 1, y: 0 },
				  middleLeft: { x: 0, y: 0.5 },
				  center: { x: 0.5, y: 0.5 },
				  middleRight: { x: 1, y: 0.5 },
				  bottomLeft: { x: 0, y: 1 },
				  bottomCenter: { x: 0.5, y: 1 },
				  bottomRight: { x: 1, y: 1 }
			  };
			  
			  function triggerConfetti() {
				  const origin = originMap[confettiSettings.origins[Math.floor(Math.random() * confettiSettings.origins.length)]];
				  myConfetti({
					  particleCount: confettiSettings.particleCount,
					  spread: confettiSettings.spread,
					  angle: confettiSettings.angle,
					  origin: origin,
					  colors: confettiSettings.colors,
					  shapes: confettiSettings.shapes
				  });
			  }
			  
			  window.addEventListener('message', event => {
				  switch (event.data.command) {
					  case 'triggerConfetti':
						  triggerConfetti();
						  break;
					  case 'updateSettings':
						  confettiSettings = { ...confettiSettings, ...event.data.settings };
						  break;
				  }
			  });
		  </script>
	  </body>
	  </html>`;
}

function handleDocumentChange(event: vscode.TextDocumentChangeEvent) {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document !== event.document) {
    return;
  }

  if (
    event.contentChanges.some(
      (change) => change.text.length > 0 || change.text.includes("\n")
    )
  ) {
    triggerConfetti();
  }
}

export function activate(context: vscode.ExtensionContext) {
  console.log('Extension "confetti-code" is loading...');

  vscode.window.showInformationMessage("Confetti Code is loading...", {
    modal: false,
  });

  // Create both webviews when the extension activates
  createPlaygroundWebview(context);
  createConfettiWebview(context);

  console.log('Extension "confetti-code" is now active!');
  vscode.window.showInformationMessage("Confetti Code is ready!", {
    modal: false,
  });

  let showPlaygroundDisposable = vscode.commands.registerCommand(
    "confetti-code.showConfettiPlayground",
    () => {
      createPlaygroundWebview(context);
    }
  );

  let showConfettiDisposable = vscode.commands.registerCommand(
    "confetti-code.showConfettiDisplay",
    () => {
      createConfettiWebview(context);
    }
  );

  let triggerConfettiDisposable = vscode.commands.registerCommand(
    "confetti-code.triggerConfetti",
    () => {
      triggerConfetti();
    }
  );

  context.subscriptions.push(
    showPlaygroundDisposable,
    showConfettiDisposable,
    triggerConfettiDisposable
  );

  let changeDisposable =
    vscode.workspace.onDidChangeTextDocument(handleDocumentChange);
  context.subscriptions.push(changeDisposable);
}

export function deactivate() {
  if (playgroundPanel) {
    playgroundPanel.dispose();
  }
  if (confettiPanel) {
    confettiPanel.dispose();
  }
}
