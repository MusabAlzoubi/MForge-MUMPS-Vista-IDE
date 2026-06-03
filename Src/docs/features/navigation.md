# Stage 4.6 Navigation

## Overview

Stage 4.6 hardens MForge navigation after reviewing the local legacy extensions in `Old Extensions/tree-sitter-m-vscode` and `Old Extensions/mumps-lsp`. MForge keeps its TypeScript-first static parser, then adopts the useful LSP-style navigation behaviors from `mumps-lsp`: definitions, references, workspace symbols, remote-safe URI indexing, and workspace label/routine lookup. Tree-sitter remains a Stage 5+ parser candidate rather than a dependency for this release.

MForge now provides:

- Document Symbols and Workspace Symbols.
- `Ctrl+Hover`, `Ctrl+Click`, `F12`, and Peek Definition for supported static MUMPS routine/label references.
- Document links for resolvable label and routine references, with exact visible `LABEL^ROUTINE` ranges.
- Find References for local labels and cross-routine label/routine calls.
- Basic same-document local variable definition navigation from variable usage to nearest prior `NEW` declaration or `SET` assignment.
- Lazy workspace indexing with open-document and AST/document caches.
- Remote-safe indexing for `file:`, `vscode-remote:`, and MUMPS `untitled:` documents.
- Defensive filtering for non-MUMPS documents, output documents, and `rendererLog` documents.

## Feature comparison matrix

| Feature | `tree-sitter-m-vscode` | `mumps-lsp` | Current MForge | Recommendation |
| --- | --- | --- | --- | --- |
| Definition Provider | Delegates to external `m-cli lsp`; extension itself focuses on tree-sitter semantic tokens. | Implements `textDocument/definition` for current-document labels, variables, `^ROUTINE`, and `LABEL^ROUTINE`. | Implemented with static MUMPS parser and workspace routine index. | Adopted the cross-routine definition model from `mumps-lsp`; keep variable definition for Stage 5. |
| Document Link Provider | Not implemented directly. | Not implemented directly. | Implemented for resolvable local and cross-routine references. | Added now to improve Ctrl+Hover/Ctrl+Click discoverability. |
| Symbol Provider | Tree-sitter AST can identify labels and node types, but no direct symbol provider in the extension. | Implements document symbols for labels, variables, and globals. | Implements document symbols for labels. | Keep label symbols now; add variable/global symbols in Stage 5 analysis. |
| Workspace Symbols | External `m-cli lsp` may provide this; extension has no local implementation. | Implements workspace routine and label symbol lookup. | Implements routine, qualified label, and signature workspace symbols. | Adopted `mumps-lsp` workspace routine/label lookup. |
| Hover Navigation | Tree-sitter tokens only; no local navigation hover. | Hovers for commands, functions, labels, globals; no link hover provider. | Adds navigation hover over resolvable static references, alongside Stage 4 language hovers. | Added now for Ctrl+Hover readiness. |
| Ctrl+Click | Depends on external LSP definitions. | Available through LSP definitions for supported references. | Available through DefinitionProvider and DocumentLinkProvider. | Adopted LSP-style definition behavior and reinforced with document links. |
| F12 | Depends on external LSP definitions. | Available for labels and cross-routine calls. | Available for local labels, routines, and cross-routine labels. | Added missing reliability and URI safety now. |
| Peek Definition | Depends on external LSP definitions. | Available through LSP definitions. | Available through the same DefinitionProvider used by F12. | Added now. |
| Find References | Depends on external LSP if present. | Implements workspace references for routines/labels and current-document variables. | Implements workspace references for routines and labels. | Adopted routine/label references now; variable references wait until Stage 5. |
| Rename | Not implemented locally. | Not advertised in server capabilities. | Not implemented. | Postpone to Stage 5+ because safe MUMPS rename needs semantic analysis and indirection awareness. |
| AST Tracker | Tree-sitter parser creates ASTs per semantic-token request; no workspace AST tracker. | Regex/document model cached by URI in server memory. | Uses lazy parse/document cache and open-document index updates; no throwing AST tracker path. | Adopted cache-by-URI pattern now; tree-sitter AST tracker waits. |
| Tree-sitter Parser | Best parser-quality candidate; lazy WASM parser singleton and AST walker. | No tree-sitter. | Static TypeScript parser. | Postpone tree-sitter indexing to Stage 5 due dependency, WASM, and packaging impact. |
| LSP Capabilities | Best external LSP integration path via `m-cli lsp`; includes client restart command. | Best self-contained navigation LSP implementation. | Native VS Code providers, not a separate LSP. | Keep native providers for Stage 4.6; evaluate LSP process split in Stage 5/6. |
| Remote Support | LSP client selector is file-only; tree-sitter tokens operate on open docs. | LSP client selector is file-only and server converts `file://` paths. | Supports `file:`, `vscode-remote:`, and MUMPS `untitled:` URIs without assuming `fsPath`. | MForge now has the strongest remote workspace support. |

## Adopted features

- Cross-routine definition resolution inspired by `mumps-lsp`.
- Workspace routine and label lookup inspired by `mumps-lsp`.
- Find References for static routine and label calls.
- URI-keyed indexing (`uri.toString()`) for remote workspace stability.
- Lazy workspace scans and cached document parsing.
- Tree-sitter-style lazy parsing principle from `tree-sitter-m-vscode`, without adding the WASM dependency yet.

## Postponed features

- Full tree-sitter AST indexing and AST tracker.
- Safe rename.
- Variable and global reference analysis.
- Dynamic indirection resolution such as `D @TARGET`.
- External LSP process/client split.
- Deeper FileMan API metadata and VistA-aware symbol tables.

## Navigation architecture

MForge navigation is split into small providers that share a single `MumpsRoutineIndex`:

1. Open MUMPS documents are parsed immediately and cached by `uri.toString()`.
2. The workspace routine index is built lazily the first time a cross-routine operation needs it.
3. Workspace reads use `vscode.workspace.fs.readFile`, so `vscode-remote:` URIs do not require local filesystem paths.
4. File watchers only mark the index dirty, with a debounce, instead of rescanning on every hover, semantic-token request, or file event.
5. Definition, reference, document-link, workspace-symbol, and navigation-hover providers reuse the same cached index.

## Supported reference patterns

Stage 4.6 recognizes these static patterns outside comments and strings:

| Pattern | Example | Result |
| --- | --- | --- |
| Local `DO` | `D BUILD` / `DO BUILD` | Opens local `BUILD` label. |
| Local `GOTO` | `G EXIT` / `GOTO EXIT` | Opens local `EXIT` label. |
| Local extrinsic | `$$VALUE()` | Opens local `VALUE` label. |
| Routine reference | `^XUP` | Opens `XUP` routine file. |
| Cross-routine label | `D EN^XUP` / `DO EN^XUP` | Opens `EN` label in `XUP`. |
| Inline command call | `S FDA(200,IEN,2)=XUH D FILE^DIE("","FDA","ERR")` | Opens `FILE` in `DIE` even when the `DO` appears after another command. |
| FileMan API call | `UPDATE^DIE`, `FILE^DIE`, `GET1^DIQ`, `FIND1^DIC` | Opens the label/routine if `DIE.m`, `DIQ.m`, or `DIC.m` exists in the workspace. |
| Cross-routine extrinsic with parentheses | `$$VALUE^ROUTINEB()` | Opens `VALUE` label in `ROUTINEB`. |
| Cross-routine extrinsic without parentheses | `X=$$ACCEPT^UJOWXUS` | Opens `ACCEPT` label in `UJOWXUS`. |
| Unary-NOT/logical extrinsic | `I '$D(X)!'$$GET^XPAR(...) S X=$$UP^XLFSTR(X)` | Opens `GET` in `XPAR` and `UP` in `XLFSTR`. |
| Multiple references | `S A=$$ONE^ROU1(),B=$$TWO^ROU2 D THREE^ROU3` | Opens all three static references. |
| Basic local variable | `N X S X=1 W X` | `F12` on the final `X` opens the nearest prior `SET` assignment, or a `NEW` declaration when no assignment exists. |

## Remote workspace support

MForge supports:

- `file:` URIs for local workspaces.
- `vscode-remote:` URIs for Remote SSH, containers, and similar VS Code remote providers.
- `untitled:` documents when the document language id is `mumps`.

The navigation index avoids assuming that `uri.fsPath` is available. Workspace file reads use `vscode.workspace.fs`, and index keys use `uri.toString()`.

## Performance safeguards

- Workspace scanning is lazy.
- Workspace scan size is capped by `mforge.maxWorkspaceFiles`.
- File-system watcher events mark the index dirty through `mforge.workspaceScanDebounceMs`.
- Open document parses are cached and updated on document changes.
- Non-MUMPS documents, output documents, and `rendererLog` documents are ignored before parsing.
- Semantic tokens do not trigger workspace scans.

## Configuration

| Setting | Default | Description |
| --- | --- | --- |
| `mforge.navigation.enabled` | `true` | Enables document links, Ctrl+Click/F12 definitions, Find References, symbols, and routine indexing. |
| `mforge.maxWorkspaceFiles` | `2000` | Maximum supported routine files to scan for the workspace index. |
| `mforge.workspaceScanDebounceMs` | `250` | Debounce interval for file-system events before marking the index dirty. |

## Known limitations

- Dynamic indirection such as `D @TARGET` is not resolved.
- Routine names are based on filenames without extensions.
- FileMan API calls only navigate when the referenced routine file is present in the workspace.
- Find References is static and limited to label/routine references. Static inline calls, unary-NOT/logical extrinsics, and no-parentheses extrinsics are supported; dynamic indirection is not.
- Local variable navigation is intentionally basic: it is same-document only, recognizes `NEW` and `SET`, and does not yet implement full MUMPS scoping, variable references, or rename.
- Rename remains unimplemented until deeper semantic analysis is added.
- Tree-sitter AST indexing is deferred to Stage 5.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| No Outline labels appear | Confirm the file language mode is `MForge MUMPS` / `mumps` and `mforge.navigation.enabled` is `true`. |
| `Ctrl+Click` or `F12` does nothing | Confirm the reference is one of the supported static patterns and is not inside a comment or string. |
| Cross-routine navigation fails | Open the folder containing the routine file and ensure the file extension is supported. |
| Remote navigation fails | Confirm the routine exists in the remote workspace and the URI is `file:` or `vscode-remote:`. |
| Large workspace feels slow | Lower `mforge.maxWorkspaceFiles` or narrow the opened workspace folder. |
| Output/renderer logs show parser messages | Update to Stage 4.6; these URI schemes/names are filtered before parsing. |
