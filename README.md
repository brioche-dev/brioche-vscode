# Brioche VSCode

[Brioche](https://brioche.dev) is a delicious package manager, and this extension provides official VS Code integration. Currently still in an early work-in-progress state (use the "Brioche LSP: Restart LSP Server" command or click the status bar Brioche LSP item to restart if things go haywire)

> **Note**: Requires the `brioche` CLI tool to be installed locally

## Features

- Brioche TypeScript (`.bri`) syntax highlighting
- LSP support for Brioche TypeScript (`.bri`) files, provided by the `brioche` CLI command
- Build support with progress notification and detailed output panel
- Icon support for Brioche files
- Status bar item to show the Brioche LSP server status (click to restart)
- Validates Brioche is installed and in PATH

### Commands

- `brioche-vscode.restartLsp`: Manually restart the Brioche LSP server
- `brioche-vscode.runBriocheBuild`: Run Brioche build for the current project

### Configuration Settings

- `brioche.binaryPath`: Path to the Brioche binary. Leave empty to use Brioche from PATH.
- `brioche.envVars`: Extra environment variables to set when calling the Brioche LSP server
- `brioche.log.level`: Log level for the Brioche language server. Options: `off`, `error`, `warn`, `info`, `debug`, `trace`.

## Installing from source

1. Clone the repo: <https://github.com/brioche-dev/brioche-vscode>
2. Run `npm install` to install NPM dependencies
3. Run `npm run package`. This will build the file `brioche-vscode-{version}.vsix` in the repo root
4. Open the VS Code Command Palette (Ctrl-Shift-P) and type "Extensions: Install from VSIX..."
5. Navigate to the path of the repo and select the `brioche-vscode-{version}.vsix` file

## Debugging from source

1. Open the repo from VS Code
2. Press F5 to launch the extension