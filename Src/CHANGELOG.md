# Changelog

## 0.4.5 - 2026-06-03

### Fixed

- Fixed cursor-range matching for inline routine references so Ctrl+Click/F12 works from either the label or routine segment of `LABEL^ROUTINE`.
- Added explicit cursor-position regression tests for `ACCEPT^UJOWXUS`, `GET^XPAR`, `UP^XLFSTR`, `FILE^DIE`, `GET1^DIQ`, local labels, and local variables.
- Verified DocumentLinkProvider ranges cover exactly the visible `LABEL^ROUTINE` text without `$$`, command prefixes, or arguments.

## 0.4.4 - 2026-06-03

### Fixed

- Improved the MUMPS reference navigation scanner to link the visible `LABEL^ROUTINE` span for extrinsics, including unary-NOT/logical expressions such as `!'$$GET^XPAR(...)`.
- Added regression coverage for multiple references on one line, `GET^XPAR`, `UP^XLFSTR`, `ACCEPT^UJOWXUS`, `FILE^DIE`, and string/comment safety.
- Added basic same-document local variable definition navigation for `NEW` declarations and nearest prior `SET` assignments, adapted from the variable-definition behavior studied in the old `mumps-lsp`.

## 0.4.3 - 2026-06-03

### Fixed

- Fixed MUMPS reference parsing for inline commands after another command on the same line, including `D FILE^DIE(...)` after `SET`/`S` and `IF` commands.
- Fixed extrinsic routine references without parentheses, including `X=$$ACCEPT^UJOWXUS` and inline `SET X=$$ACCEPT^UJOWXUS IF ... DO DIRUT` forms.
- Ensured reference parsing scans the executable portion of the full line, ignores comments and quoted strings, deduplicates overlapping command/caret detections, and preserves Stage 4.6 navigation providers.

## 0.4.2 - 2026-06-03

### Added

- Added Stage 4.6 Ctrl+Hover, Ctrl+Click, F12, Peek Definition, Document Link, and Find References support for static MUMPS label/routine references.
- Added remote-safe routine indexing for `file:`, `vscode-remote:`, and MUMPS `untitled:` documents using `uri.toString()` keys and `vscode.workspace.fs`.
- Added lazy workspace indexing, parse/document caches, debounced index invalidation, and non-MUMPS/output/`rendererLog` filtering to avoid extension-host stalls.
- Added Stage 4.6 navigation, remote URI, document link, and missing-AST/non-MUMPS stability fixture checks through `npm run test:stage46`.
- Added a legacy extension feature audit and navigation architecture documentation.

### Notes

- Stage 4.6 adopts the useful routine/label navigation model from the old `mumps-lsp` project while postponing tree-sitter AST indexing, rename, and variable/global analysis to Stage 5+.

## 0.4.1 - 2026-06-03

### Added

- Added the MForge Dark professional syntax theme.
- Added improved TextMate scopes for labels, label parameters, commands, command abbreviations, intrinsics, system variables, globals, local variables, FileMan APIs, label references, and routine references.
- Added semantic token provider for MUMPS labels, commands, intrinsics, globals, system variables, parameters, local variables, FileMan APIs, and routine references.
- Added common FileMan API highlighting for `UPDATE^DIE`, `FILE^DIE`, `FIND1^DIC`, `GETS^DIQ`, and `GET1^DIQ`.
- Added Stage 4.5 semantic token fixture checks through `npm run test:stage45`.
- Added professional theme documentation.

### Notes

- Stage 4.5 remains editor intelligence only; Stage 5 analysis, debugger, runtime integrations, and VistA explorers remain unimplemented.

## 0.4.0 - 2026-06-02

### Added

- Added Hover Provider for MUMPS commands, abbreviations, intrinsic functions, and system variables.
- Added Completion Provider for commands, intrinsics, system variables, current-document labels, workspace-index labels, and workspace routine names.
- Added Signature Help for `$P`, `$G`, `$O`, `$D`, `$L`, `$E`, `$F`, and `$NA`.
- Added Intrinsic Documentation for Stage 4 hover and signature help.
- Added System Variable Documentation for Stage 4 hover and completion.
- Added Stage 4 fixture checks through `npm run test:stage4`.
- Added feature documentation for hover, completion, and signature help.

### Notes

- Stage 4 is static language intelligence only; debugger, GT.M/YottaDB runtime integration, VistA explorers, FileMan explorer, Global explorer, and Stage 5+ features remain unimplemented.

## 0.3.0 - 2026-06-02

### Added

- Added Document Symbols for MUMPS labels.
- Added Go To Label for local `DO`, `GOTO`, and extrinsic references.
- Added Go To Routine for `^ROUTINE` and `LABEL^ROUTINE` references.
- Added Workspace Symbols for routines, labels, and `LABEL^ROUTINE` entries.
- Added a lightweight routine index for supported MUMPS routine file extensions.
- Added Stage 3 navigation fixture checks through `npm run test:stage3`.
- Added local installation and testing documentation.
- Added package, local package, local install, environment check, and aggregate test scripts.
- Restored Node 18-compatible local VSIX packaging by pinning the `vsce@2.11.0` CLI and overriding `cheerio` to `1.0.0-rc.12` instead of using current `@vscode/vsce` releases or unbounded transient dependencies.
- Added repository, issue, and homepage metadata so `vsce package` can resolve README links during VSIX generation.

### Notes

- Stage 3 navigation is static and conservative; dynamic indirection, hover, completion, signature help, debugger, runtime, and VistA explorer features remain future stages.
- Local packaging supports Node.js 18 or newer, with Node.js 18.19.1 explicitly supported for local packaging.
- The packaging workflow was adapted from the owner's working old `mumps-debugger---upgrade` extension while keeping MForge source and features separate.
- Old extension code remains reference-only and was not copied.

## 0.2.0 - 2026-06-02

### Added

- Added conservative MUMPS document formatter registration gated by `mforge.formatter.enabled`.
- Added lightweight parser-assisted line analysis for labels, commands, comments, strings, globals, dot-block levels, and parenthesis balance.
- Added basic diagnostics gated by `mforge.diagnostics.enabled` for unterminated strings, suspicious command tokens, invalid labels, unbalanced parentheses, and trailing whitespace.
- Added Stage 2 formatter and parser fixture checks through `npm run test:stage2`.
- Added formatter and diagnostics feature documentation.

### Notes

- Stage 2 remains intentionally line-based and conservative; navigation, hover, completion, debugger, and VistA tools are still future stages.
- Old extension code remains reference-only and was not copied.

## 0.1.0 - 2026-06-02

### Added

- Created the MForge MUMPS & VistA IDE VS Code extension scaffold.
- Added MForge package metadata, publisher, icon reference, TypeScript configuration, and activation command.
- Added Stage 1 MUMPS language registration for `.m`, `.M`, `.mumps`, `.mps`, `.rou`, and `.int` files.
- Added original MUMPS TextMate syntax highlighting for labels, commands, intrinsics, globals, variables, strings, comments, numbers, operators, and postconditionals.
- Added language configuration for comments, brackets, auto-closing pairs, word detection, and indentation hints.
- Added MUMPS snippets for routine headers, labels, calls, loops, globals, VistA RPC skeletons, and FileMan FDA skeletons.
- Added feature documentation for syntax highlighting and snippets.

### Notes

- Advanced formatter, diagnostics, navigation, hover, completion, debugger, and VistA explorer features are planned but not implemented in this release.
- Old extension code was not copied into this implementation.
