# MForge MUMPS & VistA IDE

MForge is a clean Visual Studio Code extension for MUMPS and VistA development. Current version: **0.4.6**.

## Current status

- Stage 0: cleanup and project setup — complete.
- Stage 1: core language support — complete.
- Stage 2: editing productivity — complete.
- Stage 3: navigation — complete.
- Stage 4: intelligence — complete.
- Stage 4.5: professional syntax theme — complete.
- Stage 4.6: navigation review, LSP feature extraction, and remote workspace stability — complete.
- Stage 5+ advanced analysis, runtime/debugging, and VistA explorers — planned, not implemented yet.

## Features

### Stage 1 core language support

- Registers language id `mumps` for `.m`, `.M`, `.mumps`, `.mps`, `.rou`, and `.int` files.
- Adds MUMPS syntax highlighting for labels, commands, intrinsics, globals, variables, strings, comments, numbers, operators, and postconditionals.
- Adds language configuration for comments, brackets, auto-closing pairs, word detection, and indentation hints.
- Adds snippets for routine skeletons, labels, calls, loops, globals, VistA RPC entry points, and FileMan FDA examples.

See also:

- [Syntax highlighting](docs/features/syntax-highlighting.md)
- [Snippets](docs/features/snippets.md)

### Stage 2 editing productivity

- Adds a conservative document formatter gated by `mforge.formatter.enabled`.
- Adds parser-assisted auto indentation for common dot-block patterns.
- Adds basic diagnostics gated by `mforge.diagnostics.enabled`.
- Detects unterminated strings, invalid label formats, suspicious command tokens, unbalanced parentheses, and trailing whitespace.

See also:

- [Formatter](docs/features/formatter.md)
- [Diagnostics](docs/features/diagnostics.md)

### Stage 3 / 4.6 navigation

- Adds Document Symbols for MUMPS labels so labels appear in the VS Code Outline.
- Adds Go To Label for local references such as `D BUILD`, `G EXIT`, and `$$VALUE()`.
- Adds Go To Routine for references such as `^XUP`, `D EN^XUP`, and `$$VALUE^ROUTINEB()`.
- Adds Workspace Symbols for routine names, label names, and `LABEL^ROUTINE` entries.
- Adds Ctrl+Hover, Ctrl+Click, F12, Peek Definition, Document Links, and Find References for supported static label/routine references.
- Adds basic same-document local variable definition navigation for `NEW` declarations and nearest prior `SET` assignments.
- Adds **MForge: Rebuild Routine Index** and **MForge: Debug References In Current Line** troubleshooting commands for real-world navigation issues.
- Adds a lightweight lazy routine index with configurable file limits, debounced dirty marking, URI-keyed caches, and default exclusions for `node_modules`, `.git`, `dist`, `out`, and `Old Extensions`.
- Supports remote-safe navigation for `file:`, `vscode-remote:`, and MUMPS `untitled:` documents without assuming `fsPath` exists.
- Ignores non-MUMPS, output, and `rendererLog` documents before parsing to avoid AST tracker noise and extension-host stalls.

See [Navigation](docs/features/navigation.md) for usage, supported patterns, configuration, examples, limitations, and troubleshooting.

### Stage 4 intelligence

- Adds hover help for common MUMPS commands, command abbreviations, intrinsic functions, and system variables.
- Adds completion suggestions for commands, intrinsics, system variables, current-document labels, workspace-index labels, and workspace routine names.
- Adds signature help for `$P`, `$G`, `$O`, `$D`, `$L`, `$E`, `$F`, and `$NA` intrinsic calls.
- Adds independent settings for hover, completion, signature help, semantic highlighting, and the MForge Dark theme.

See also:

- [Hover](docs/features/hover.md)
- [Completion](docs/features/completion.md)
- [Signature Help](docs/features/signature-help.md)

### Stage 4.5 professional syntax theme

- Adds improved TextMate scopes for labels, label parameters, commands, command abbreviations, intrinsics, system variables, globals, local variables, numbers, strings, comments, FileMan APIs, label references, and routine references.
- Adds semantic highlighting for MUMPS-aware labels, commands, intrinsics, globals, system variables, parameters, local variables, FileMan APIs, and routine references.
- Adds the **MForge Dark** theme with a modern palette optimized for MUMPS and VistA readability.

See [MForge Professional Syntax Theme](docs/features/theme.md) for examples, configuration, troubleshooting, and limitations.

## Local installation and testing

Run commands from the repository root unless noted. Run `cd Src` only once; if you are already inside `Src`, do not run `cd Src` again.

```bash
cd Src
rm -rf node_modules
npm install
npm run env:check
npm run compile
npm run test
npm run package
code --install-extension mforge-mumps-vista-ide-0.4.6.vsix
```

Expected VSIX filename for version 0.4.6: `mforge-mumps-vista-ide-0.4.6.vsix`. The exact VSIX filename is safer than `*.vsix` if your shell does not expand wildcards.

### Packaging requirements and troubleshooting

MForge local packaging supports Node.js **18 or newer**, with Node.js 18.19.1 explicitly supported for local packaging. The package uses the Node-18-compatible `vsce@2.11.0` CLI plus an npm `cheerio@1.0.0-rc.12` override for local VSIX generation. This mirrors the working packaging dependency shape from the owner's old `mumps-debugger---upgrade` extension while keeping the MForge implementation clean. Current `@vscode/vsce` releases, or un-overridden `vsce` installs, can pull newer `cheerio`/`undici` dependencies that require Node 20+ globals and fail on Node 18 with `ReferenceError: File is not defined`.

Run `npm run env:check` before packaging to print the Node version, npm version, package.json packager dependency, installed `vsce`, `cheerio`, and `undici` versions, package-lock status, local binary path, and whether packaging requirements are met. See [Local installation and testing](docs/local-installation.md) for prerequisites, compile/test/package commands, manual Extension Development Host testing, and troubleshooting for `tsc: not found`, missing package scripts, `*.vsix` ENOENT, `ReferenceError: File is not defined`, and `cd: Src` path errors.

Troubleshooting summary:

- If `ReferenceError: File is not defined` appears, a Node-20-only dependency was installed. Remove `node_modules` and `package-lock.json`, verify `package.json` uses exact `"vsce": "2.11.0"` and override `"cheerio": "1.0.0-rc.12"`, then run `npm install` again.
- If `env:check` expects the wrong version or reports `@vscode/vsce`, pull the latest changes and reinstall dependencies.
- If the VSIX file is missing, packaging did not complete; do not run the install command until `npm run package` succeeds.
- Avoid wildcard installs unless `mforge-mumps-vista-ide-0.4.6.vsix` exists.


### Local Extension Development Host

```bash
cd Src
code .
```

Press `F5` / **Launch Extension**, open a `.m` file in the Extension Development Host, and test syntax highlighting, snippets, Format Document, diagnostics, Outline, Ctrl+Hover/Ctrl+Click, `F12`/Peek Definition, Find References, `Ctrl+T` Workspace Symbols, hover, completion, signature help, semantic highlighting, remote workspace navigation, and the MForge Dark theme.

### Reinstall local VSIX

```bash
code --uninstall-extension dopamind.mforge-mumps-vista-ide
code --install-extension mforge-mumps-vista-ide-0.4.6.vsix
```

## Configuration

| Setting | Default | Description |
| --- | --- | --- |
| `mforge.trace.level` | `off` | Controls diagnostic and quiet debug logging for MForge extension features. |
| `mforge.formatter.enabled` | `true` | Enables the conservative MForge document formatter. |
| `mforge.diagnostics.enabled` | `true` | Enables basic MForge diagnostics for MUMPS files. |
| `mforge.navigation.enabled` | `true` | Enables Stage 4.6 Document Links, Ctrl+Click/F12 definitions, Find References, document symbols, routine indexing, and Workspace Symbols. |
| `mforge.hover.enabled` | `true` | Enables Stage 4 command, intrinsic, and system variable hover help. |
| `mforge.completion.enabled` | `true` | Enables Stage 4 command, intrinsic, system variable, label, and routine completion. |
| `mforge.signatureHelp.enabled` | `true` | Enables Stage 4 intrinsic function signature help. |
| `mforge.semanticHighlighting.enabled` | `true` | Enables Stage 4.5 semantic highlighting. |
| `mforge.maxWorkspaceFiles` | `2000` | Maximum supported routine files to scan lazily for the workspace index. |
| `mforge.workspaceScanDebounceMs` | `250` | Debounce interval for file events before marking the workspace routine index dirty. |

Example settings:

```jsonc
{
  "mforge.formatter.enabled": true,
  "mforge.diagnostics.enabled": true,
  "mforge.navigation.enabled": true,
  "mforge.hover.enabled": true,
  "mforge.completion.enabled": true,
  "mforge.signatureHelp.enabled": true,
  "mforge.semanticHighlighting.enabled": true,
  "mforge.maxWorkspaceFiles": 2000,
  "mforge.workspaceScanDebounceMs": 250,
  "mforge.trace.level": "off"
}
```

## Development commands

Run from inside `Src`:

```bash
rm -rf node_modules
npm install
npm run env:check
npm run compile
npm run test
npm run package
```

Individual tests are available:

```bash
npm run test:stage2
npm run test:stage3
npm run test:stage4
npm run test:stage45
npm run test:stage46
```

## Roadmap

| Stage | Status | Notes |
| --- | --- | --- |
| Stage 0: Cleanup and setup | Done | Extension scaffold and metadata are in place. |
| Stage 1: Core language support | Done | Syntax highlighting, language configuration, snippets, and docs are in place. |
| Stage 2: Editing productivity | Done | Formatter, parser-assisted indentation, diagnostics, and tests are in place. |
| Stage 3: Navigation | Done | Document Symbols, Go To Label/Routine, Workspace Symbols, routine index, tests, and docs are in place. |
| Stage 4: Intelligence | Done | Hover, completion, signature help, documentation data, tests, and docs are in place. |
| Stage 4.5: Professional syntax theme | Done | Improved scopes, semantic tokens, MForge Dark theme, tests, and docs are in place. |
| Stage 4.6: Navigation stability | Done | Legacy extension audit, Ctrl+Click/F12/Peek, Document Links, Find References, remote URI support, lazy indexing, tests, and docs are in place. |
| Stage 5+: Advanced analysis, runtime, VistA tools | Planned | Future work only. |
