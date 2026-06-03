# MForge MUMPS & VistA IDE

MForge is a modern Visual Studio Code extension for MUMPS, GT.M/YottaDB, and VistA developers. It provides syntax highlighting, snippets, formatting, diagnostics, IntelliSense, semantic highlighting, routine indexing, Ctrl+Click navigation, and VistA-friendly development tools.

**Version:** 0.4.10<br>
**VS Code:** ^1.90.0<br>
**License:** MIT<br>
**Focus:** MUMPS / VistA / YottaDB

## Core Language Support

- Syntax highlighting for routines, labels, commands, intrinsics, globals, variables, strings, comments, numbers, operators, and postconditionals.
- MUMPS language configuration with comments, brackets, auto-closing pairs, word detection, and indentation rules.
- Snippets for common MUMPS, VistA RPC, and FileMan FDA workflows.
- MForge Dark theme tuned for MUMPS and VistA code.
- Semantic tokens for labels, commands, intrinsics, globals, system variables, parameters, local variables, FileMan APIs, and routine references.

## Editing Productivity

- Formatter for conservative MUMPS code cleanup.
- Auto indentation support for labels, commands, comments, and dot-blocks.
- Diagnostics for common line-level problems.
- Safe parsing for strings and comments so tooling avoids false positives in quoted text or comments.
- Dot-block aware formatting for VistA-style indented command blocks.

## Navigation

- Outline / Document Symbols for routine labels.
- Workspace Symbols for routines, labels, and `LABEL^ROUTINE` entries.
- Ctrl+Click / F12 navigation for local and cross-routine references.
- Peek Definition support through VS Code definition providers.
- Document links for resolvable MUMPS references.
- Local label navigation.
- Cross-routine navigation.
- Local variable navigation.
- Routine index for workspace, configured, detected, remote, and extensionless routine files.

## IntelliSense

- Command hover for full and abbreviated MUMPS commands.
- Intrinsic hover for common intrinsic functions.
- System variable hover.
- Completion for commands, intrinsics, and system variables.
- Label and routine completion from the current document and routine index.
- Signature help for common intrinsic functions.

## VistA / YottaDB Support

- Auto-detect routine folders in common VistA and YottaDB layouts.
- Manual routine search paths for folders outside the active workspace.
- Remote container support through VS Code filesystem APIs and URI-safe indexing.
- VistA routine patterns including `LABEL^ROUTINE` and extrinsic calls.
- FileMan API references such as `UPDATE^DIE`, `FILE^DIE`, `GET1^DIQ`, and `GETS^DIQ`.
- WorldVistA/Hakeem-friendly indexing, including optional extensionless routine indexing.

## Debugging / Diagnostics Tools

- `MForge: Rebuild Routine Index`
- `MForge: Show Routine Index Status`
- `MForge: Find Routine In Index`
- `MForge: Debug References In Current Line`
- `MForge: Save Detected Routine Paths To Settings`

## Supported File Extensions

- `.m`
- `.M`
- `.int`
- `.rou`
- `.mps`
- `.mumps`

## Quick Start

1. Install the extension.
2. Open a `.m` file.
3. Set the color theme to `MForge Dark`.
4. Run `MForge: Rebuild Routine Index` from the Command Palette.
5. Use Ctrl+Click or F12 on a `LABEL^ROUTINE` reference.

## Example Settings

```json
{
  "mforge.autoDetectRoutinePaths": true,
  "mforge.autoRebuildIndexOnActivation": true,
  "mforge.routineSearchPaths": [
    "/var/worldvista/prod/hakeem/routines",
    "/var/worldvista/prod/hakeem/localr"
  ],
  "mforge.maxWorkspaceFiles": 10000,
  "mforge.indexExtensionlessRoutines": true,
  "mforge.trace.level": "info"
}
```

## Navigation Examples

```mumps
D EN^XUP
S X=$$GET1^DIQ(200,DUZ,.01)
S FDA(200,IEN,2)=XUH D FILE^DIE("","FDA","ERR")
I '$D(ASKINGVC)!'$$GET^XPAR("SYS","XU VC CASE SENSITIVE") S X=$$UP^XLFSTR(X)
```

Use Ctrl+Click, F12, or Peek Definition on labels, local variables, and routine references when the target is in the current document or indexed routine paths.

## Commands

| Command | Purpose |
| --- | --- |
| `MForge: Show Getting Started` | Opens a quick overview of MForge features and setup tips. |
| `MForge: Rebuild Routine Index` | Rebuilds the routine index for workspace, detected, configured, and supported remote paths. |
| `MForge: Show Routine Index Status` | Displays indexed routine counts, detected paths, configured paths, and index health details. |
| `MForge: Find Routine In Index` | Searches the routine index for a routine name and opens the matching file. |
| `MForge: Debug References In Current Line` | Shows parser and navigation reference details for the active line. |
| `MForge: Save Detected Routine Paths To Settings` | Writes automatically detected routine folders to `mforge.routineSearchPaths`. |

## Configuration

| Setting | Default | Description |
| --- | --- | --- |
| `mforge.trace.level` | `off` | Controls diagnostic logging for MForge extension features. |
| `mforge.formatter.enabled` | `true` | Enables the conservative MForge document formatter for MUMPS files. |
| `mforge.diagnostics.enabled` | `true` | Enables basic diagnostics for MUMPS files. |
| `mforge.navigation.enabled` | `true` | Enables document links, Ctrl+Click, definitions, references, routine indexing, document symbols, and workspace symbols. |
| `mforge.hover.enabled` | `true` | Enables hover help for commands, intrinsic functions, and system variables. |
| `mforge.completion.enabled` | `true` | Enables completion for commands, intrinsics, system variables, labels, and routines. |
| `mforge.signatureHelp.enabled` | `true` | Enables intrinsic function signature help. |
| `mforge.semanticHighlighting.enabled` | `true` | Enables semantic highlighting for MUMPS files. |
| `mforge.maxWorkspaceFiles` | `2000` | Maximum number of MUMPS routine files to scan lazily in a workspace. |
| `mforge.workspaceScanDebounceMs` | `250` | Debounce interval before marking the workspace routine index dirty after file events. |
| `mforge.routineSearchPaths` | `[]` | Additional absolute or workspace-relative folders to scan for MUMPS routine files. |
| `mforge.indexExtensionlessRoutines` | `false` | Indexes extensionless routine files for VistA/YottaDB exports when enabled. |
| `mforge.autoDetectRoutinePaths` | `true` | Detects common VistA/YottaDB routine folders without modifying user settings. |
| `mforge.autoRebuildIndexOnActivation` | `true` | Rebuilds the routine index shortly after activation when routine folders are detected. |

## Local Development

```bash
npm install
npm run compile
npm run test
npm run package
```

## Release / Install Local VSIX

Package locally from `Src/`, then install the generated VSIX:

```bash
code --install-extension mforge-mumps-vista-ide-x.y.z.vsix
```

For this release, the expected local VSIX name is:

```bash
code --install-extension mforge-mumps-vista-ide-0.4.10.vsix
```

## Troubleshooting

### Extension not activated

Open a supported MUMPS file such as `.m`, `.M`, `.int`, `.rou`, `.mps`, or `.mumps`. MForge activates on the `mumps` language and on its contributed commands.

### Semantic token errors

MForge uses VS Code-compatible semantic token IDs with letters, numbers, hyphens, and underscores only. If VS Code reports semantic token schema errors, reinstall the latest VSIX and confirm the installed extension is version 0.4.10 or newer.

### Ctrl+Click does not work

Run `MForge: Rebuild Routine Index`, confirm `mforge.navigation.enabled` is true, and check that the target routine is in the workspace, a configured `mforge.routineSearchPaths` entry, or an automatically detected routine folder.

### Routine not indexed

Run `MForge: Show Routine Index Status`. If the routine folder is outside your workspace, add it to `mforge.routineSearchPaths`. If your VistA export uses extensionless routines, enable `mforge.indexExtensionlessRoutines`.

### Remote container indexing

MForge uses VS Code URI and filesystem APIs for remote-safe indexing. In containers or Remote SSH sessions, prefer absolute in-container paths for `mforge.routineSearchPaths` and rebuild the routine index after path changes.

### Performance on huge routine trees

Increase `mforge.maxWorkspaceFiles` only as needed, keep search paths focused, and disable `mforge.indexExtensionlessRoutines` unless your routine tree requires extensionless files.

## Roadmap

### Stage 5 Planned

- Find References
- Rename Symbol
- Call Hierarchy
- Routine dependency analyzer
- Code metrics
- Routine explorer

### Future

- Debugger integration
- GT.M/YottaDB runtime tooling
- VistA RPC explorer
- FileMan dictionary explorer
- Global explorer

## Author

Created by Musab Alzoubi.

GitHub: <https://github.com/MusabAlzoubi><br>
LinkedIn: <https://www.linkedin.com/in/musabmalzoubi/>
