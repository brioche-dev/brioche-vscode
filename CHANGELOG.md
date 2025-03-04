# Changelog

## [Unreleased]

### Breaking changes

- Replace `brioche.lsp-env` configuration value with `brioche.envVars`

### Added

- Added custom dark / light theme icons for `.bri` files
- Added Brioche LSP server status to the status bar
- Added "Brioche: Build Project" command
- Add `brioche.log.level` configuration value to control logging fro Brioche LSP (and Brioche commands)
- Add `brioche.binaryPath` configuration value to set the path to the `brioche` binary

### Changed

- Validate Brioche is installed and in PATH on startup

### Bug Fixes

- Fixed Brioche LSP output channel from creating multiple instances

## [v0.2.0] - 2024-11-17

### Updated

- Updated dependencies
- Add deployment workflow to publish to VSCode marketplace and OpenVSX

## [v0.1.0] - 2024-05-30

### Added

- Initial release!

[Unreleased]: https://github.com/kylewlacy/tick-encoding/compare/v0.1.0...HEAD
[v0.1.0]: https://github.com/kylewlacy/tick-encoding/releases/tag/v0.1.0
