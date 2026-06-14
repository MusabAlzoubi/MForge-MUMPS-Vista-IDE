# MForge MUMPS & VistA IDE

A modern VS Code IDE toolkit for MUMPS, GT.M/YottaDB, InterSystems-style M code, and VistA/Hakeem development.

**Version:** 0.6.3
**VS Code:** ^1.90.0  
**License:** MIT

MForge is designed to work out of the box for common MUMPS routine trees. Open a `.m` file, switch to **MForge Dark**, and use normal VS Code actions such as Ctrl+Click, F12, Peek Definition, Shift+F12, Outline, and Command Palette commands.

## Feature Overview

### Core Language Support

- **Syntax highlighting** for labels, commands, postconditionals, intrinsics, globals, strings, comments, numbers, operators, and routine references.
- **MUMPS language configuration** for comments, brackets, auto-closing pairs, word boundaries, and indentation-friendly editing.
- **Semantic highlighting** for labels, commands, intrinsic functions, system variables, globals, local variables, parameters, FileMan/VistA APIs, and routine references.
- **MForge Dark theme** with distinct colors for MUMPS symbols and clear navigable versus unresolved routine references.
- **Snippets** for common MUMPS, FileMan, VistA RPC, and routine workflows.

### Editing

- Conservative **formatter** for routine cleanup without aggressive rewrites.
- **Auto indentation** for labels, commands, comments, and dot-blocks.
- **Dot-block aware formatting** for nested VistA-style command blocks.
- **Trailing whitespace cleanup** through formatter and diagnostics.
- **Safe parsing for strings/comments** so navigation, diagnostics, and highlighting avoid quoted text and comments.

### Diagnostics

MForge includes basic MUMPS diagnostics plus optional VistA/UJO standards checks.

- Unterminated strings.
- Invalid labels.
- Suspicious or unknown commands.
- Parenthesis balance warnings.
- VistA/UJO standards diagnostics when `mforge.standards.profile` is `vista`, `ujo`, or `custom`:
  - routine header checks,
  - namespace checks,
  - label length checks,
  - local variable naming checks,
  - `^TMP` safety checks,
  - `^%` global protection checks.

### Navigation

- Ctrl+Click navigation.
- F12 **Go To Definition**.
- Peek Definition.
- Document Symbols / Outline for routine labels.
- Workspace Symbols for routines, labels, and `LABEL^ROUTINE` entries.
- Local label navigation.
- Cross-routine `LABEL^ROUTINE` navigation.
- Routine-side and label-side navigation within the same reference.
- Same-document local variable navigation.

### Find References

Use Shift+F12 or **Find All References** for:

- local labels,
- cross-routine references,
- common FileMan/VistA APIs,
- same-document local variables.

### IntelliSense

- Hover for MUMPS commands.
- Hover for intrinsic functions.
- Hover for system variables.
- Completion for commands.
- Completion for intrinsics.
- Completion for system variables.
- Completion for labels and routines from the current document and routine index.
- Signature help for common intrinsic functions.

### Routine Indexing

MForge builds a routine index for navigation and references while avoiding broad, slow scans by default.

- Auto-detects common routine folders.
- Gives `localr` priority over `routines` when duplicate routines exist.
- Uses `routines` as fallback source folders.
- Maintains incremental cache data for repeated indexing.
- Uses lazy/cached index behavior for normal navigation startup.
- Provides navigation diagnostics and index health commands.
- Supports **MForge: Rebuild Routine Index** and **MForge: Show Navigation Diagnostics**.

Normally you do **not** need to edit `settings.json`. MForge auto-detects common Hakeem/YottaDB routine folders and can apply recommended Hakeem settings from the Command Palette.

### Templates

- **Routine Header Template**: inserts a legacy-compatible EHS/VistA-style routine header with namespace, patch, date, version, and build metadata.
- **Patch Change Block Template**: inserts a patch marker block with author, patch number, date, fix type, reason, optional scope, and start/end sentinels.

### Debugging

MForge contributes a VS Code debug type named `mumps` and carries forward the legacy `MDEBUG.m` helper routine for sites using that workflow.

- Launch/Attach configuration for debug type `mumps`.
- Packaged `MDEBUG.m` helper routine.
- Direct debug commands:
  - `ZSTEP`,
  - `ZSTEP INTO`,
  - `ZSTEP OUTOF`,
  - `ZCONTINUE`,
  - `ZWRITE`,
  - `ZSHOW`,
  - `ZBREAK`,
  - `ZPRINT @$ZPOSITION`,
  - **Send Raw Debug Command**.

Live MDEBUG connector hardening is still under active improvement. Direct debug commands fail safely with a clear warning if no active `mumps` debug session is connected.

## Supported Files

- `.m`
- `.M`
- `.mumps`
- `.mps`
- `.rou`
- `.int`

## Quick Start

1. Install **MForge MUMPS & VistA IDE**.
2. Open a `.m` file.
3. Select **MForge Dark** from **Preferences: Color Theme**.
4. Ctrl+Click a `LABEL^ROUTINE` reference such as `D EN^XUP`.
5. If navigation needs help, run **MForge: Show Navigation Diagnostics**.
6. For common Hakeem systems, run **MForge: Repair Hakeem Routine Settings** if settings ever include the broad `/var/worldvista/prod/hakeem` root or auto-detection needs a nudge.

## MUMPS / VistA Examples

```mumps
D EN^XUP
S X=$$GET1^DIQ(200,DUZ,.01)
D FILE^DIE("","FDA","ERR")
I '$D(ASKINGVC)!'$$GET^XPAR("SYS","XU VC CASE SENSITIVE") S X=$$UP^XLFSTR(X)
```

Use Ctrl+Click, F12, Peek Definition, or Shift+F12 on labels, variables, FileMan APIs, and `LABEL^ROUTINE` calls when the target routine is open, in the workspace, configured, or auto-detected.

## Commands

| Command | Usage |
| --- | --- |
| `MForge: Show Getting Started` | Shows a short activation and setup message. |
| `MForge: Rebuild Routine Index` | Rebuilds the current routine index from configured and auto-detected routine folders. |
| `MForge: Show Routine Index Status` | Shows routine count, label count, source folders, limits, and key routine status. |
| `MForge: Show Navigation Diagnostics` | Shows concise index health, build time, cache, duplicate, localr, and routines diagnostics. |
| `MForge: Find Routine In Index` | Searches indexed routines by name and opens the match. |
| `MForge: Debug References In Current Line` | Prints parser/navigation details for references on the active line. |
| `MForge: Save Detected Routine Paths To Settings` | Saves auto-detected routine paths after confirmation. |
| `MForge: Apply Recommended Hakeem Settings` | Sets safe Hakeem defaults for `/var/worldvista/prod/hakeem/localr` and `/var/worldvista/prod/hakeem/routines`. |
| `MForge: Repair Hakeem Routine Settings` | Rewrites the Hakeem routine settings block for 0.6.3: `localr` first, `routines` second, auto-detect/rebuild on, extensionless indexing off, trace level `info`. |
| `MForge: Reset MForge Settings To Defaults` | Removes MForge-only settings overrides without touching unrelated VS Code settings. |
| `MForge: Insert Routine Header Template` | Inserts the routine header template at the top of the active MUMPS file. |
| `MForge: Insert Patch Change Block Template` | Inserts a patch change block at the cursor. |
| `MForge: Direct Debug Setup` | Configures `$ZSTEP`, requests `$ZPOSITION`, and prints the current line through the active `mumps` debug session. |
| `MForge: Direct Debug Smoke Test` | Runs `$ZPOSITION`, `ZPRINT @$ZPOSITION`, `ZWRITE`, and `ZSHOW` checks. |
| `MForge: ZSTEP` | Sends `ZSTEP` to the active MDEBUG session. |
| `MForge: ZSTEP INTO` | Sends `ZSTEP INTO`. |
| `MForge: ZSTEP OUTOF` | Sends `ZSTEP OUTOF`. |
| `MForge: ZCONTINUE` | Sends `ZCONTINUE`. |
| `MForge: ZWRITE` | Sends `ZWRITE`. |
| `MForge: ZSHOW` | Sends `ZSHOW`. |
| `MForge: ZBREAK` | Prompts for a `TAG+OFFSET^ROUTINE` target and sends `ZBREAK`. |
| `MForge: ZPRINT At Current Position` | Sends `ZPRINT @$ZPOSITION`. |
| `MForge: ZPRINT` | Prompts for a ZPRINT target. |
| `MForge: Configure $ZSTEP Line Printing` | Sets `$ZSTEP="ZPRINT @$ZPOSITION BREAK"`. |
| `MForge: Show $ZPOSITION` | Sends `WRITE $ZPOSITION`. |
| `MForge: Send Raw Debug Command` | Prompts for a raw MUMPS/GT.M debug command. |
| `MForge: Open Direct Debug Output` | Opens the MForge MUMPS Debug output channel. |
| `MForge: Copy Last Direct Debug Output` | Copies the last direct debug command output. |
| `MForge: Clear Direct Debug Output` | Clears the direct debug output channel. |

## Important Settings

Most users do not need to edit `settings.json` manually. Use **MForge: Repair Hakeem Routine Settings** or **MForge: Apply Recommended Hakeem Settings**, then **MForge: Show Navigation Diagnostics** first.

| Setting | Default | Optional? | Notes |
| --- | --- | --- | --- |
| `mforge.autoDetectRoutinePaths` | `true` | Usually no edit needed | Detects common VistA/Hakeem/YottaDB routine folders. |
| `mforge.autoRebuildIndexOnActivation` | `true` | Usually no edit needed | Performs a safe, debounced activation rebuild when routine folders are detected. |
| `mforge.routineSearchPaths` | `[]` | Optional | Add only if your routines are outside common auto-detected folders. |
| `mforge.indexExtensionlessRoutines` | `false` | Optional | Enable only for extensionless VistA/YottaDB exports. |
| `mforge.maxRoutineSearchPathFiles` | `30000` | Troubleshooting | Raise only if important routines are missing and diagnostics say the search-path limit was reached. |
| `mforge.maxWorkspaceFiles` | `5000` | Troubleshooting | Does not drive routine navigation indexing when routine search paths are available. |
| `mforge.trace.level` | `off` | Troubleshooting | Use `info` or `debug` only when diagnosing extension behavior. |
| `mforge.references.maxResults` | `5000` | Optional | Caps Find References results. |
| `mforge.standards.profile` | `off` | Optional | Set to `vista`, `ujo`, or `custom` for standards diagnostics. |
| `mforge.standards.namespacePrefixes` | `[]` | Optional | Restricts routine namespaces when header checks are enabled. |
| `mforge.debug.directCommandTimeoutMs` | `5000` | Optional | Direct MDEBUG command timeout. |

Recommended Hakeem settings applied by **MForge: Repair Hakeem Routine Settings**:

```json
{
  "mforge.routineSearchPaths": [
    "/var/worldvista/prod/hakeem/localr",
    "/var/worldvista/prod/hakeem/routines"
  ],
  "mforge.indexExtensionlessRoutines": false,
  "mforge.autoDetectRoutinePaths": true,
  "mforge.autoRebuildIndexOnActivation": true,
  "mforge.trace.level": "info"
}
```

## MForge Dark Theme

MForge Dark uses a professional dark background with semantic colors tuned for MUMPS:

- labels: warm yellow,
- commands: blue,
- intrinsics: purple,
- system variables: red,
- globals: cyan,
- locals: muted gold,
- parameters: green,
- strings: soft orange,
- comments: green,
- numbers: pale green,
- FileMan/VistA APIs: teal,
- navigable routine references: underlined gold,
- unresolved routine references: italic purple.

This makes `GET1^DIQ`, `FILE^DIE`, normal intrinsics, and navigable routine links visually distinct.

## Troubleshooting

### Extension not activating

Open a supported MUMPS file (`.m`, `.M`, `.mumps`, `.mps`, `.rou`, or `.int`). Confirm the language mode is **MForge MUMPS** or **MUMPS**.

### Routine not indexed

Run **MForge: Show Navigation Diagnostics**. Effective Hakeem paths must be exactly `/var/worldvista/prod/hakeem/localr` and `/var/worldvista/prod/hakeem/routines` in that order. If the broad root appears in user settings, MForge ignores it and logs `Ignored broad Hakeem root path. Use localr and routines instead.` Run **MForge: Repair Hakeem Routine Settings** to rewrite the safe settings block.

### Navigation slow

Do not configure broad parent folders such as `/var/worldvista/prod/hakeem`; MForge 0.6.3 ignores that Hakeem root and indexes only `localr` then `routines`. Run **MForge: Repair Hakeem Routine Settings** for the common Hakeem layout. Normal logs stay concise and do not print huge duplicate lists; set `mforge.trace.level` to `debug` only when duplicate details are needed.

### Ctrl+Click not working

Run **MForge: Rebuild Routine Index**, then try Ctrl+Click or F12 again. If the target remains unresolved, run **MForge: Show Routine Index Status** and confirm the target routine appears under key routines or indexed source folders.

### MDEBUG not connected

Direct debug commands require an active VS Code debug session of type `mumps`. If no session is active, MForge shows a safe warning and writes details to **MForge MUMPS Debug** output.

### Remote container paths

Use paths as seen inside the remote container or Remote SSH host. For Hakeem containers, `/var/worldvista/prod/hakeem/localr` and `/var/worldvista/prod/hakeem/routines` are preferred when they exist.

### Reset or rebuild index

- Run **MForge: Rebuild Routine Index** to rebuild routine navigation data.
- Run **MForge: Repair Hakeem Routine Settings** to restore the safe Hakeem routine paths and indexing defaults.
- Run **MForge: Reset MForge Settings To Defaults** to remove only MForge setting overrides.
- Reload VS Code if a remote filesystem provider changes paths underneath the extension.

## Release / Local VSIX

From `Src/`:

```bash
npm install
npm run compile
npm run test
npm run package
code --install-extension mforge-mumps-vista-ide-0.6.3.vsix
```

## Roadmap Notes

MForge 0.6.3 is a Hakeem indexing hotfix. It does **not** start new Stage 5 features such as Rename Symbol, Call Hierarchy, or Dependency Graph. Do not publish until the 0.6.3 manual verification checklist passes. Stage 5 features such as Rename Symbol, Call Hierarchy, or Dependency Graph remain planned follow-up work after indexing and runtime hardening.

## Author

Musab Alzoubi  
GitHub: <https://github.com/MusabAlzoubi>  
LinkedIn: <https://www.linkedin.com/in/musabmalzoubi/>
