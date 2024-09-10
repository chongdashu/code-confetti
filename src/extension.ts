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
}

export function deactivate() {}
