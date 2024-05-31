# Brioche VSCode

[Brioche](https://brioche.dev) is a delicious package manager, and this extension provides official VS Code integration. Currently still in an early work-in-progress state (use the "Brioche LSP: Restart LSP Server" command to restart if things go haywire)

> **Note**: Requires the `brioche` CLI tool to be installed locally

## Features

- Brioche TypeScript (`.bri`) syntax highlighting
- LSP support for Brioche TypeScript (`.bri`) files, provided by the `brioche` CLI command

### Commands

- `brioche-vscode.restartLsp`: Manually restart the Brioche LSP server

### Configuration Settings

- `brioche-lsp.env` Extra environment variables to set when calling the Brioche LSP server
    - `RUST_LOG`: Set to `brioche=debug` to enable extra debug output

## Installing from source

1. Clone the repo: <https://github.com/brioche-dev/brioche-vscode>
2. Run `npm install` to install NPM dependencies
3. Run `npm run package`. This will build the file `brioche-vscode-{version}.vsix` in the repo root
4. Open the VS Code Command Palette (Ctrl-Shift-P) and type "Extensions: Install from VSIX..."
5. Navigate to the path of the repo and select the `brioche-vscode-{version}.vsix` file

## Debugging from source

1. Open the repo from VS Code
2. Press F5 to launch the extension
