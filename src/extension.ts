import { commands, window, workspace, ExtensionContext } from "vscode";

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";

let client: LanguageClient | null = null;

async function stopClient(): Promise<void> {
  if (client != null) {
    await client.stop();
  }

  client = null;
}

function startClient() {
  const lspEnvVars = workspace.getConfiguration("brioche").get<Record<string, string>>("lsp-env");

  let serverOptions: ServerOptions = {
    command: "brioche",
    args: ["lsp"],
    transport: TransportKind.stdio,
    options: {
      env: {
        ...process.env,
        ...lspEnvVars,
      },
    }
  };

  let clientOptions: LanguageClientOptions = {
    documentSelector: [
      { scheme: "file", language: "brioche" },
    ],
    synchronize: {
      fileEvents: [
        workspace.createFileSystemWatcher("**/*.bri"),
        workspace.createFileSystemWatcher("**/brioche.toml"),
      ],
    },
  };

  client = new LanguageClient(
    "brioche-lsp",
    "Brioche LSP",
    serverOptions,
    clientOptions
  );

  client.start();
}

export function activate(context: ExtensionContext) {
  let disposable = commands.registerCommand("brioche-vscode.restartLsp", () => {
    stopClient().then(() => {
      window.showInformationMessage("Starting Brioche LSP");
      startClient();
    });
  });
  context.subscriptions.push(disposable);

  startClient();
}

export function deactivate(): Thenable<void> | undefined {
  return stopClient();
}
