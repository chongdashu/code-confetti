import * as vscode from "vscode";

class ConfettiParticle {
  x: number;
  y: number;
  color: string;
  velocity: { x: number; y: number };

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.color = this.getRandomColor();
    this.velocity = {
      x: (Math.random() - 0.5) * 2, // Reduced horizontal velocity
      y: Math.random() * 1 + 0.5, // Reduced vertical velocity
    };
  }

  update() {
    this.x += this.velocity.x;
    this.y += this.velocity.y;
    this.velocity.y += 0.05; // Reduced gravity
  }

  private getRandomColor(): string {
    const colors = [
      "#ff0000",
      "#00ff00",
      "#0000ff",
      "#ffff00",
      "#ff00ff",
      "#00ffff",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}

function showNiceConfetti() {
  const panel = vscode.window.createWebviewPanel(
    "niceConfettiView",
    "Nice Confetti",
    vscode.ViewColumn.Two,
    {
      enableScripts: true,
    }
  );

  panel.webview.html = getNiceConfettiWebviewContent();
}

function getNiceConfettiWebviewContent() {
  return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nice Confetti</title>
        <script src="https://unpkg.com/react@17/umd/react.production.min.js"></script>
        <script src="https://unpkg.com/react-dom@17/umd/react-dom.production.min.js"></script>
        <script src="https://unpkg.com/babel-standalone@6/babel.min.js"></script>
        <style>
            body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; }
            #root { width: 100%; height: 100%; }
        </style>
    </head>
    <body>
        <div id="root"></div>
        <script type="text/babel">
            const Confetti = () => {
                const [confetti, setConfetti] = React.useState([]);

                React.useEffect(() => {
                    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
                    const newConfetti = Array.from({ length: 50 }, (_, i) => ({
                        id: i,
                        x: Math.random() * 100,
                        y: -10 - Math.random() * 10,
                        size: 5 + Math.random() * 5,
                        color: colors[Math.floor(Math.random() * colors.length)],
                        speed: 1 + Math.random() * 3,
                        angle: Math.random() * 360,
                        rotation: Math.random() * 360,
                        rotationSpeed: -5 + Math.random() * 10,
                    }));

                    setConfetti(newConfetti);

                    const animationFrame = requestAnimationFrame(function animate() {
                        setConfetti(prev => prev.map(piece => ({
                            ...piece,
                            y: piece.y + piece.speed,
                            x: piece.x + Math.sin(piece.angle * Math.PI / 180) * 0.5,
                            angle: piece.angle + 1,
                            rotation: (piece.rotation + piece.rotationSpeed) % 360,
                        })).filter(piece => piece.y < 110));

                        requestAnimationFrame(animate);
                    });

                    return () => cancelAnimationFrame(animationFrame);
                }, []);

                return (
                    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                        {confetti.map(piece => (
                            <rect
                                key={piece.id}
                                x={piece.x}
                                y={piece.y}
                                width={piece.size}
                                height={piece.size / 2}
                                fill={piece.color}
                                transform={\`rotate(\${piece.rotation}, \${piece.x + piece.size / 2}, \${piece.y + piece.size / 4})\`}
                            />
                        ))}
                    </svg>
                );
            };

            ReactDOM.render(<Confetti />, document.getElementById('root'));
        </script>
    </body>
    </html>`;
}

function showConfetti() {
  console.log("showConfetti function called");

  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    console.log("No active editor found");
    vscode.window.showInformationMessage(
      "No active text editor found. Open a file to see confetti!"
    );
    return;
  }

  console.log("Active editor found");

  let confettiParticles: ConfettiParticle[] = [];
  let animationFrame: NodeJS.Timeout | undefined;

  const decorationType = vscode.window.createTextEditorDecorationType({});

  // Create initial confetti particles
  for (let i = 0; i < 50; i++) {
    confettiParticles.push(
      new ConfettiParticle(
        Math.random() * editor.document.lineAt(0).range.end.character, // Ensure within character bounds
        0
      )
    );
  }

  console.log(`Created ${confettiParticles.length} confetti particles`);

  function animate() {
    if (!editor) {
      console.log("Editor became unavailable during animation");
      return;
    }

    const decorations: vscode.DecorationOptions[] = [];

    confettiParticles.forEach((particle) => {
      particle.update();

      const lineCount = editor.document.lineCount;
      const yPosition = Math.max(0, Math.floor(particle.y)); // Clamp Y to be >= 0
      if (yPosition >= lineCount) return; // Skip particles out of line range

      const maxCharactersInLine =
        editor.document.lineAt(yPosition).range.end.character;
      const xPosition = Math.max(
        0,
        Math.min(Math.floor(particle.x), maxCharactersInLine)
      ); // Clamp X between 0 and max characters in the line

      const position = new vscode.Position(yPosition, xPosition);

      decorations.push({
        range: new vscode.Range(position, position.translate(0, 1)),
        renderOptions: {
          after: {
            contentText: "🎉",
            color: particle.color,
          },
        },
      });
    });

    editor.setDecorations(decorationType, decorations);

    confettiParticles = confettiParticles.filter(
      (p) => p.y < editor.document.lineCount
    ); // Only keep particles within the visible document

    if (confettiParticles.length > 0) {
      animationFrame = setTimeout(animate, 100); // Slowed down animation
    } else {
      editor.setDecorations(decorationType, []);
      console.log("Animation finished");
    }
  }

  if (animationFrame) {
    clearTimeout(animationFrame);
  }
  animate();

  vscode.window.showInformationMessage("🎉 Confetti!");
}

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "confetti-code" is now active!');

  let helloWorldDisposable = vscode.commands.registerCommand(
    "confetti-code.helloWorld",
    () => {
      vscode.window.showInformationMessage("Hello World from confetti-code!");
    }
  );

  context.subscriptions.push(helloWorldDisposable);

  let confettiDisposable = vscode.commands.registerCommand(
    "confetti-code.showConfetti",
    () => {
      console.log("showConfetti command triggered");
      showConfetti();
    }
  );

  context.subscriptions.push(confettiDisposable);

  let niceConfettiDisposable = vscode.commands.registerCommand(
    "confetti-code.showNiceConfetti",
    () => {
      console.log("showNiceConfetti command triggered");
      showNiceConfetti();
    }
  );

  context.subscriptions.push(niceConfettiDisposable);
}

export function deactivate() {}
