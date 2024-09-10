import * as vscode from "vscode";

let confettiPanel: vscode.WebviewPanel | undefined;

function showConfettiInWebview() {
  if (confettiPanel) {
    confettiPanel.webview.postMessage({ command: "triggerConfetti" });
    return;
  }

  confettiPanel = vscode.window.createWebviewPanel(
    "confettiView",
    "Confetti",
    {
      viewColumn: vscode.ViewColumn.Two,
      preserveFocus: true, /
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

  // Trigger initial confetti
  confettiPanel.webview.postMessage({ command: "triggerConfetti" });
}

function getConfettiWebviewContent() {
  return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confetti</title>
        <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js"></script>
        <style>
            body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; }
            #confetti-canvas { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; }
        </style>
    </head>
    <body>
        <canvas id="confetti-canvas"></canvas>
        <script>
            const vscode = acquireVsCodeApi();
            const canvas = document.getElementById('confetti-canvas');
            const myConfetti = confetti.create(canvas, { resize: true });

            window.addEventListener('message', event => {
                if (event.data.command === 'triggerConfetti') {
                    myConfetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 }
                    });
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
    showConfettiInWebview();
  }
}

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "confetti-code" is now active!');

  let confettiDisposable = vscode.commands.registerCommand(
    "confetti-code.showConfetti",
    () => {
      console.log("showConfetti command triggered");
      showConfettiInWebview();
    }
  );

  context.subscriptions.push(confettiDisposable);

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
