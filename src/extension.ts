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
		<script src="https://cdn.tailwindcss.com"></script>
	</head>
	<body class="bg-gray-100 text-gray-800 p-6">
		<h2 class="text-2xl font-bold mb-6">Confetti Playground</h2>
		<div class="space-y-6">
			<div>
				<label for="particleCount" class="block mb-2">Particle Count: <span id="particleCountValue">100</span></label>
				<input type="range" id="particleCount" min="10" max="200" value="100" class="w-full">
			</div>
			<div>
				<label for="spread" class="block mb-2">Spread: <span id="spreadValue">70</span></label>
				<input type="range" id="spread" min="20" max="180" value="70" class="w-full">
			</div>
			<div>
				<label for="colors" class="block mb-2">Colors (comma-separated):</label>
				<input type="text" id="colors" value="#ff0000,#00ff00,#0000ff" class="w-full p-2 border rounded">
			</div>
			<div>
				<label for="origins" class="block mb-2">Origins:</label>
				<select id="origins" multiple class="w-full p-2 border rounded">
					<option value="topLeft" selected>Top Left</option>
					<option value="topCenter" selected>Top Center</option>
					<option value="topRight" selected>Top Right</option>
					<option value="middleLeft" selected>Middle Left</option>
					<option value="center" selected>Center</option>
					<option value="middleRight" selected>Middle Right</option>
					<option value="bottomLeft" selected>Bottom Left</option>
					<option value="bottomCenter" selected>Bottom Center</option>
					<option value="bottomRight" selected>Bottom Right</option>
				</select>
			</div>
			<div class="space-x-4">
				<button id="updateButton" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
					Update Settings
				</button>
				<button id="testPopButton" class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
					Test a Pop!
				</button>
			</div>
		</div>
		<div id="toast" class="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded opacity-0 transition-opacity duration-300"></div>
		<script>
			const vscode = acquireVsCodeApi();
			
			function updateSettings() {
				const settings = {
					particleCount: parseInt(document.getElementById('particleCount').value),
					spread: parseInt(document.getElementById('spread').value),
					colors: document.getElementById('colors').value.split(',').map(c => c.trim()),
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
			['particleCount', 'spread'].forEach(id => {
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
				  colors: ['#ff0000', '#00ff00', '#0000ff'],
				  shapes: ['square', 'circle'],
				  origins: ['topLeft', 'topCenter', 'topRight', 'middleLeft', 'center', 'middleRight', 'bottomLeft', 'bottomCenter', 'bottomRight']
			  };
			  
			  const originMap = {
				  topLeft: { x: 0, y: 0, angle: 316 },
				  topCenter: { x: 0.5, y: 0, angle: 270 },
				  topRight: { x: 1, y: 0, angle: 225 },
				  middleLeft: { x: 0, y: 0.5, angle: 0 },
				  center: { x: 0.5, y: 0.5, angle: 270 },
				  middleRight: { x: 1, y: 0.5, angle: 180 },
				  bottomLeft: { x: 0, y: 1, angle: 45 },
				  bottomCenter: { x: 0.5, y: 1, angle: 90 },
				  bottomRight: { x: 1, y: 1, angle: 135 }
			  };
			  
			  function triggerConfetti() {
				  const originKey = confettiSettings.origins[Math.floor(Math.random() * confettiSettings.origins.length)];
				  const origin = originMap[originKey];
				  myConfetti({
					  particleCount: confettiSettings.particleCount,
					  spread: confettiSettings.spread,
					  angle: origin.angle,
					  origin: { x: origin.x, y: origin.y },
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

  vscode.window.showInformationMessage("Confetti Code is ready!", {
    modal: false,
  });

  // Automatically open the confetti display
  createConfettiWebview(context);

  let showPlaygroundDisposable = vscode.commands.registerCommand(
    "confetti-coder.showConfettiPlayground",
    () => {
      createPlaygroundWebview(context);
    }
  );

  let showConfettiDisposable = vscode.commands.registerCommand(
    "confetti-coder.showConfettiDisplay",
    () => {
      createConfettiWebview(context);
    }
  );

  let triggerConfettiDisposable = vscode.commands.registerCommand(
    "confetti-coder.triggerConfetti",
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
