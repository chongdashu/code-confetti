import * as vscode from "vscode";

let confettiPanel: vscode.WebviewPanel | undefined;

function createConfettiWebview(context: vscode.ExtensionContext) {
  if (confettiPanel) {
    confettiPanel.reveal();
    return;
  }

  confettiPanel = vscode.window.createWebviewPanel(
    "confettiView",
    "Confetti Settings",
    {
      viewColumn: vscode.ViewColumn.Two,
      preserveFocus: true,
    },
    {
      enableScripts: true,
      retainContextWhenHidden: true,
    }
  );

  confettiPanel.webview.html = getConfettiWebviewContent();

  confettiPanel.onDidDispose(() => {
    confettiPanel = undefined;
  }, null);

  // Store the panel in the context to keep it alive
  context.subscriptions.push(confettiPanel);
}

function triggerConfetti() {
  if (confettiPanel) {
    confettiPanel.webview.postMessage({ command: "triggerConfetti" });
  } else {
    vscode.window.showErrorMessage(
      "Confetti webview is not open. Please run 'Show Confetti Settings' first."
    );
  }
}

function getConfettiWebviewContent() {
  return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confetti Settings</title>
        <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js"></script>
        <style>
            body, html { 
                margin: 0; 
                padding: 0; 
                height: 100%; 
                overflow: hidden; 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
                background-color: var(--vscode-editor-background);
                color: var(--vscode-editor-foreground);
            }
            #confetti-canvas { 
                position: fixed; 
                top: 0; 
                left: 0; 
                width: 100%; 
                height: 100%; 
                pointer-events: none; 
            }
            #controls { 
                position: fixed; 
                top: 20px; 
                left: 20px; 
                background: var(--vscode-editor-background); 
                padding: 20px; 
                border-radius: 8px; 
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                max-width: 300px;
            }
            .control-group {
                margin-bottom: 15px;
            }
            label { 
                display: block; 
                margin-bottom: 5px;
                font-weight: bold;
            }
            input[type="range"] { 
                width: 100%; 
                margin-bottom: 5px;
            }
            .value-display {
                font-size: 0.9em;
                color: var(--vscode-descriptionForeground);
            }
            button {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                transition: background-color 0.3s;
            }
            button:hover {
                background-color: var(--vscode-button-hoverBackground);
            }
        </style>
    </head>
    <body>
        <canvas id="confetti-canvas"></canvas>
        <div id="controls">
            <div class="control-group">
                <label for="particleCount">Particle Count:</label>
                <input type="range" id="particleCount" min="10" max="200" value="100">
                <span class="value-display" id="particleCountValue">100</span>
            </div>
            <div class="control-group">
                <label for="spread">Spread:</label>
                <input type="range" id="spread" min="20" max="180" value="70">
                <span class="value-display" id="spreadValue">70</span>
            </div>
            <div class="control-group">
                <label for="originY">Origin Y:</label>
                <input type="range" id="originY" min="0" max="1" step="0.1" value="0.6">
                <span class="value-display" id="originYValue">0.6</span>
            </div>
            <div class="control-group">
                <label for="originX">Origin X:</label>
                <input type="range" id="originX" min="0" max="1" step="0.1" value="0.5">
                <span class="value-display" id="originXValue">0.5</span>
            </div>
            <div class="control-group">
                <label for="angle">Angle:</label>
                <input type="range" id="angle" min="0" max="360" value="90">
                <span class="value-display" id="angleValue">90</span>
            </div>
            <div class="control-group">
                <label for="colors">Colors:</label>
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
            <button id="triggerButton">Trigger Confetti</button>
        </div>
        <script>
            const vscode = acquireVsCodeApi();
            const canvas = document.getElementById('confetti-canvas');
            const myConfetti = confetti.create(canvas, { resize: true });

            const particleCountSlider = document.getElementById('particleCount');
            const spreadSlider = document.getElementById('spread');
            const originYSlider = document.getElementById('originY');
            const originXSlider = document.getElementById('originX');
            const angleSlider = document.getElementById('angle');
            const colorsInput = document.getElementById('colors');
            const shapesSelect = document.getElementById('shapes');
            const triggerButton = document.getElementById('triggerButton');

            function updateSliderValue(slider, valueSpan) {
                slider.addEventListener('input', () => {
                    valueSpan.textContent = slider.value;
                });
            }

            updateSliderValue(particleCountSlider, document.getElementById('particleCountValue'));
            updateSliderValue(spreadSlider, document.getElementById('spreadValue'));
            updateSliderValue(originYSlider, document.getElementById('originYValue'));
            updateSliderValue(originXSlider, document.getElementById('originXValue'));
            updateSliderValue(angleSlider, document.getElementById('angleValue'));

            function getSelectedShapes() {
                return Array.from(shapesSelect.selectedOptions).map(option => option.value);
            }

            function triggerConfetti() {
                const colors = colorsInput.value.split(',').map(color => color.trim());
                const shapes = getSelectedShapes();

                myConfetti({
                    particleCount: parseInt(particleCountSlider.value),
                    spread: parseInt(spreadSlider.value),
                    origin: { 
                        y: parseFloat(originYSlider.value),
                        x: parseFloat(originXSlider.value)
                    },
                    angle: parseInt(angleSlider.value),
                    colors: colors,
                    shapes: shapes
                });
            }

            triggerButton.addEventListener('click', triggerConfetti);

            window.addEventListener('message', event => {
                if (event.data.command === 'triggerConfetti') {
                    triggerConfetti();
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

  // Check if the change is due to typing or pressing enter
  if (
    event.contentChanges.some(
      (change) => change.text.length > 0 || change.text.includes("\n")
    )
  ) {
    // Trigger confetti
    triggerConfetti();
  }
}

export function activate(context: vscode.ExtensionContext) {
  console.log('Extension "confetti-code" is loading...');

  vscode.window.showInformationMessage("Confetti Code is loading...", {
    modal: false,
  });

  // Create the confetti webview automatically when the extension activates
  createConfettiWebview(context);

  console.log('Extension "confetti-code" is now active!');
  vscode.window.showInformationMessage("Confetti Code is ready!", {
    modal: false,
  });

  // Register the command to show the confetti settings
  let showSettingsDisposable = vscode.commands.registerCommand(
    "confetti-code.showConfettiSettings",
    () => {
      console.log("showConfettiSettings command triggered");
      createConfettiWebview(context);
    }
  );

  // Register the command to trigger confetti
  let triggerConfettiDisposable = vscode.commands.registerCommand(
    "confetti-code.triggerConfetti",
    () => {
      console.log("triggerConfetti command triggered");
      triggerConfetti();
    }
  );

  context.subscriptions.push(showSettingsDisposable, triggerConfettiDisposable);

  // Add event listener for document changes
  let changeDisposable =
    vscode.workspace.onDidChangeTextDocument(handleDocumentChange);
  context.subscriptions.push(changeDisposable);
}

export function deactivate() {
  if (confettiPanel) {
    confettiPanel.dispose();
  }
}
