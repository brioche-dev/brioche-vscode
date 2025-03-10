import {
  commands,
  window,
  workspace,
  ExtensionContext,
  StatusBarItem,
  StatusBarAlignment,
  Uri,
  ProgressLocation,
  OutputChannel,
} from "vscode";

import * as path from "path";
import * as cp from "child_process";
import * as fs from "fs";

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
  State,
  RevealOutputChannelOn,
} from "vscode-languageclient/node";

let client: LanguageClient | null = null;
let statusBarItem: StatusBarItem;
let serverRunning: boolean = false;
// Create a single output channel that will be reused
let lspOutputChannel: OutputChannel;

/**
 * Gets the brioche binary path from configuration or defaults to 'brioche'
 */
function getBriocheBinaryPath(): string {
  const configPath = workspace
    .getConfiguration("brioche")
    .get<string>("binaryPath")
    ?.trim();
  return configPath || "brioche";
}

/**
 * Stops the Brioche LSP client if it's running
 */
async function stopClient(): Promise<void> {
  if (client !== null) {
    try {
      serverRunning = false;
      updateStatusBar();
      await client.stop();
      client = null;
    } catch (e) {
      window.showErrorMessage(
        `Error stopping Brioche LSP: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }
}

/**
 * Creates and starts the Brioche LSP client
 */
/**
 * Log level for output from RUST_LOG environment variable level
 */
function getBriocheLogLevel(): string | undefined {
  const logLevel =
    workspace.getConfiguration("brioche").get<string>("log.level") || "off";

  return `brioche=${logLevel}`;
}

async function startClient(): Promise<void> {
  try {
    // Clear the existing output channel
    lspOutputChannel.clear();

    const lspEnvVars =
      workspace
        .getConfiguration("brioche")
        .get<Record<string, string>>("envVars") ?? {};
    const briochePath = getBriocheBinaryPath();
    const rustLogLevel = getBriocheLogLevel();

    // Build environment variables for LSP
    const env = {
      ...process.env,
      ...(rustLogLevel ? {RUST_LOG: rustLogLevel} : {}),
      ...lspEnvVars,
    };

    // Configure server options
    const serverOptions: ServerOptions = {
      command: briochePath,
      args: ["lsp"],
      transport: TransportKind.stdio,
      options: {
        env,
      },
    };

    // Configure client options - use the existing output channel
    const clientOptions: LanguageClientOptions = {
      documentSelector: [{ scheme: "file", language: "brioche" }],
      synchronize: {
        fileEvents: [workspace.createFileSystemWatcher("**/*.bri")],
      },
      outputChannel: lspOutputChannel,
      revealOutputChannelOn: RevealOutputChannelOn.Error,
    };

    // Create the language client
    client = new LanguageClient(
      "brioche-lsp",
      "Brioche LSP",
      serverOptions,
      clientOptions
    );

    // Add event listeners
    client.onDidChangeState((event) => {
      if (event.newState === State.Running) {
        serverRunning = true;
      } else if (event.newState === State.Stopped) {
        serverRunning = false;
      }
      updateStatusBar();
    });

    // Start the client
    await client.start();
  } catch (e) {
    serverRunning = false;
    updateStatusBar();
    window.showErrorMessage(
      `Failed to start Brioche LSP: ${e instanceof Error ? e.message : String(e)}`
    );
  }
}

/**
 * Updates the status bar item to reflect the current status of the LSP server
 */
function updateStatusBar(): void {
  if (serverRunning) {
    statusBarItem.text = "$(check) Brioche LSP";
    statusBarItem.tooltip = "Brioche LSP is running";
  } else {
    statusBarItem.text = "$(warning) Brioche LSP";
    statusBarItem.tooltip = "Brioche LSP is not running. Click to restart.";
  }
  statusBarItem.show();
}

/**
 * Restarts the Brioche LSP server
 */
async function restartLsp(): Promise<void> {
  await window.withProgress(
    {
      location: ProgressLocation.Notification,
      title: "Restarting Brioche LSP...",
      cancellable: false,
    },
    async () => {
      await stopClient();
      await startClient();
    }
  );
}

/**
 * Checks if the specified brioche binary exists and is executable
 */
async function checkCustomBriocheBinary(binaryPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (binaryPath === "brioche") {
      // Default PATH check
      cp.exec("brioche --version", (error: any) => {
        resolve(!error);
      });
    } else {
      // Custom path check
      fs.access(binaryPath, fs.constants.X_OK, (err) => {
        resolve(!err);
      });
    }
  });
}

/**
 * Checks if Brioche is installed and provides installation instructions if not
 */
async function checkBriocheInstallation(): Promise<boolean> {
  try {
    const briochePath = getBriocheBinaryPath();
    const isInstalled = await checkCustomBriocheBinary(briochePath);

    if (!isInstalled) {
      const configureButton = "Configure Path";
      const installButton = "Installation Guide";

      window
        .showErrorMessage(
          `Brioche binary not found at ${briochePath === "brioche" ? "system PATH" : briochePath}. The language server cannot start without it.`,
          configureButton,
          installButton
        )
        .then((selection) => {
          if (selection === configureButton) {
            commands.executeCommand(
              "workbench.action.openSettings",
              "brioche.binaryPath"
            );
          } else if (selection === installButton) {
            commands.executeCommand(
              "vscode.open",
              Uri.parse("https://brioche.dev/docs/installation")
            );
          }
        });
      return false;
    }
    return true;
  } catch (e) {
    window.showErrorMessage(
      `Error checking Brioche installation: ${e instanceof Error ? e.message : String(e)}`
    );
    return false;
  }
}

/**
 * Run Brioche build
 */
async function runBriocheBuild(): Promise<void> {
  if (!window.activeTextEditor) {
    window.showWarningMessage(
      "No active file. Please open a Brioche file first."
    );
    return;
  }

  const folderPath = path.dirname(window.activeTextEditor.document.uri.fsPath);
  const outputChannel = window.createOutputChannel(
    `Brioche Build: ${path.basename(folderPath)}`
  );
  const briochePath = getBriocheBinaryPath();

  outputChannel.clear();
  outputChannel.show(true);

  await window
    .withProgress(
      {
        location: ProgressLocation.Notification,
        title: "Running Brioche build...",
        cancellable: true,
      },
      async (progress, token): Promise<void> => {
        return new Promise<void>((resolve, reject) => {
          const process = cp.spawn(
            briochePath,
            ["build", "--display", "plain"],
            { cwd: folderPath }
          );

          process.stdout?.on("data", (data: Buffer) => {
            const output = data.toString();
            outputChannel.append(output);
            progress.report({ message: "Building project..." });
          });

          process.stderr?.on("data", (data: Buffer) => {
            outputChannel.append(data.toString());
            progress.report({ message: "Building project..." });
          });

          token.onCancellationRequested(() => {
            outputChannel.appendLine("\nBuild cancelled by user");
            process.kill();
            reject(new Error("Operation cancelled by user"));
          });

          process.on("close", (code: number | null) => {
            const showOutputButton = "Show output";

            if (code === 0) {
              outputChannel.appendLine("\nBuild completed successfully!");
              window.showInformationMessage("Build completed successfully!", showOutputButton).then((item) => {
                // Show the output if the user clicks "Show output"
                if (item === showOutputButton) {
                  outputChannel.show(true);
                }
              });
              resolve();
            } else if (code != null) {
              const message = `Build failed with exit code ${code}`;
              outputChannel.appendLine(`\n${message}`);

              window.showErrorMessage(message, showOutputButton).then((item) => {
                // Show the output if the user clicks "Show output"
                if (item === showOutputButton) {
                  outputChannel.show(true);
                }
              });
              resolve();
            } else {
              const message = "Build stopped";
              outputChannel.appendLine(`\n${message}`);

              window.showErrorMessage(message, showOutputButton).then((item) => {
                // Show the output if the user clicks "Show output"
                if (item === showOutputButton) {
                  outputChannel.show(true);
                }
              });
              resolve();
            }
          });

          process.on("error", (err: Error) => {
            const message = `Failed to start build: ${err.message}`;
            outputChannel.appendLine(`\n${message}`);
            outputChannel.show(true);
            reject(new Error(message));
          });
        });
      }
    )
    .then(undefined, (err: Error) => {
      if (err.message !== "Operation cancelled by user") {
        window.showErrorMessage(`Error running Brioche build: ${err.message}`);
      }
    });
}

/**
 * Activates the extension
 */
export async function activate(context: ExtensionContext) {
  // Create the output channel once at activation time
  lspOutputChannel = window.createOutputChannel("Brioche LSP");

  // Create status bar item
  statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, 100);
  statusBarItem.command = "brioche-vscode.restartLsp";
  context.subscriptions.push(statusBarItem);

  // Register commands
  context.subscriptions.push(
    commands.registerCommand("brioche-vscode.restartLsp", restartLsp),
    commands.registerCommand("brioche-vscode.runBriocheBuild", runBriocheBuild)
  );

  // Register configuration change listener to restart LSP if relevant settings change
  context.subscriptions.push(
    workspace.onDidChangeConfiguration(async (event) => {
      if (
        event.affectsConfiguration("brioche.binaryPath") ||
        event.affectsConfiguration("brioche.log.level") ||
        event.affectsConfiguration("brioche.envVars")
      ) {
        await restartLsp();
      }
    })
  );

  // Register the output channel to be disposed when the extension is deactivated
  context.subscriptions.push(lspOutputChannel);

  // Check if brioche is installed
  const briocheInstalled = await checkBriocheInstallation();

  // Start the client if brioche is installed
  if (briocheInstalled) {
    await startClient();
  } else {
    updateStatusBar(); // Show warning in status bar
  }
}

/**
 * Deactivates the extension
 */
export function deactivate(): Thenable<void> | undefined {
  return stopClient();
}
