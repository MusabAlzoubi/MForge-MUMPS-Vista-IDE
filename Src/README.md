# MForge MUMPS & VistA IDE

MForge is a clean Visual Studio Code extension for MUMPS and VistA development. Current version: **0.3.0**.

## Current status

- Stage 0: cleanup and project setup — complete.
- Stage 1: core language support — complete.
- Stage 2: editing productivity — complete.
- Stage 3: navigation — complete.
- Stage 4+ intelligence, advanced analysis, runtime/debugging, and VistA explorers — planned, not implemented yet.

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

### Stage 3 navigation

- Adds Document Symbols for MUMPS labels so labels appear in the VS Code Outline.
- Adds Go To Label for local references such as `D BUILD`, `G EXIT`, and `$$VALUE()`.
- Adds Go To Routine for references such as `^XUP`, `D EN^XUP`, and `$$VALUE^ROUTINEB()`.
- Adds Workspace Symbols for routine names, label names, and `LABEL^ROUTINE` entries.
- Adds a lightweight routine index with configurable file limits and default exclusions for `node_modules`, `.git`, `dist`, `out`, and `Old Extensions`.

See [Navigation](docs/features/navigation.md) for usage, supported patterns, configuration, examples, limitations, and troubleshooting.

## Local installation and testing

Run commands from the repository root unless noted. Run `cd Src` only once; if you are already inside `Src`, do not run `cd Src` again.

```bash
cd Src
npm install
npm run package:local
code --install-extension mforge-mumps-vista-ide-0.3.0.vsix
```

The exact VSIX filename is safer than `*.vsix` if your shell does not expand wildcards. See [Local installation and testing](docs/local-installation.md) for prerequisites, compile/test/package commands, manual Extension Development Host testing, and troubleshooting for `tsc: not found`, missing package scripts, `*.vsix` ENOENT, and `cd: Src` path errors.

## Configuration

| Setting | Default | Description |
| --- | --- | --- |
| `mforge.trace.level` | `off` | Controls diagnostic and quiet debug logging for MForge extension features. |
| `mforge.formatter.enabled` | `true` | Enables the conservative MForge document formatter. |
| `mforge.diagnostics.enabled` | `true` | Enables basic MForge diagnostics for MUMPS files. |
| `mforge.navigation.enabled` | `true` | Enables Stage 3 Document Symbols, Go to Definition, routine indexing, and Workspace Symbols. |
| `mforge.maxWorkspaceFiles` | `2000` | Maximum supported routine files to scan for the workspace index. |

Example settings:

```jsonc
{
  "mforge.formatter.enabled": true,
  "mforge.diagnostics.enabled": true,
  "mforge.navigation.enabled": true,
  "mforge.maxWorkspaceFiles": 2000,
  "mforge.trace.level": "off"
}
```

## Development commands

Run from inside `Src`:

```bash
npm install
npm run compile
npm run test
npm run package:local
```

Individual tests are available:

```bash
npm run test:stage2
npm run test:stage3
```

## Roadmap

| Stage | Status | Notes |
| --- | --- | --- |
| Stage 0: Cleanup and setup | Done | Extension scaffold and metadata are in place. |
| Stage 1: Core language support | Done | Syntax highlighting, language configuration, snippets, and docs are in place. |
| Stage 2: Editing productivity | Done | Formatter, parser-assisted indentation, diagnostics, and tests are in place. |
| Stage 3: Navigation | Done | Document Symbols, Go To Label/Routine, Workspace Symbols, routine index, tests, and docs are in place. |
| Stage 4: Intelligence | Planned | Hover, completion, and signature help are intentionally not implemented yet. |
| Stage 5+: Advanced analysis, runtime, VistA tools | Planned | Future work only. |
