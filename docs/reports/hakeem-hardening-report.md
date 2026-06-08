# MForge 0.6.2 Hakeem / WorldVistA Hardening Report

Date: 2026-06-08

## Scope

This pass validates the MForge 0.6.2 hardening release before Stage 5.2 Rename Symbol. It focuses on production-style Hakeem/WorldVistA stability, navigation accuracy, indexing behavior, references accuracy, diagnostics safety, theme clarity, debugger integration, and user experience. It intentionally does **not** start Rename Symbol, Call Hierarchy, Dependency Graph, or Metrics.

## Old Extension Review

Reviewed legacy behavior from:

- `Old Extensions/mumps-debugger---upgrade`
- `Old Extensions/mumps-lsp`
- `Old Extensions/tree-sitter-m-vscode`

Findings:

- The old debugger provides useful MDEBUG direct-command workflows and VistA/UJO templates/standards checks; these remain in MForge from the 0.6.0/0.6.1 parity work.
- The LSP-style projects reinforce that fast routine lookup should prioritize routine catalogs and cached path metadata before deeper label work. MForge already uses mtime/label cache reuse; fuller lazy label parsing remains the next performance task.
- Tree-sitter parsing can provide better structural precision, but integrating it would be a larger parser architecture change and is deferred until after this hardening phase.
- The most important immediate Hakeem fix was not new Stage 5 functionality: it was avoiding false navigation on globals while preserving routine-only `D ^ROUTINE` calls.

## Issues Found

| Area | Issue | Impact |
| --- | --- | --- |
| Navigation parser | Bare globals such as `^TMP($J)` could be interpreted as routine-only `^TMP` references. | False Ctrl+Click/F12/document-link candidates in real VistA code. |
| Semantic tokens | `FMADD^XLFDT`, `GET^XPAR`, and `UP^XLFSTR` were not in the FileMan/VistA API semantic set. | Important Hakeem/VistA APIs were less visually distinct. |
| Regression coverage | Existing tests covered many FileMan APIs but did not include a focused real-world Hakeem fixture with nested extrinsics, post-conditionals, strings/comments, local labels, local variables, duplicates, and `FMADD^XLFDT`. | Risk of regressions before Stage 5.2. |

## Issues Fixed

- Routine parsing now ignores bare globals like `^TMP($J)` as navigation references.
- Routine parsing still preserves valid routine-only command operands such as `D ^XUP`.
- FileMan/VistA API semantic classification now includes `GET^XPAR`, `UP^XLFSTR`, and `FMADD^XLFDT` in addition to existing `FILE^DIE`, `UPDATE^DIE`, `FIND1^DIC`, `GETS^DIQ`, and `GET1^DIQ` coverage.
- Added `Src/scripts/test-hakeem-hardening.js` and `Src/test-fixtures/hakeem-hardening/*` covering:
  - `GET^XPAR`,
  - `UP^XLFSTR`,
  - `FILE^DIE`,
  - `UPDATE^DIE`,
  - `GET1^DIQ`,
  - `FMADD^XLFDT`,
  - nested extrinsics,
  - multiple references per line,
  - post-conditionals,
  - strings and comments,
  - local variables,
  - local labels,
  - `localr` priority over `routines`,
  - duplicate handling,
  - cache hits,
  - document links,
  - hover text,
  - Shift+F12 reference results,
  - semantic token classification.

## Navigation Measurements

Automated hardening fixture coverage confirms:

| Pattern | Result |
| --- | --- |
| `D EN^XUP` | Parsed and resolves from label and routine sides. |
| `$$GET^XPAR(...)` | Parsed, semantically classified as FileMan/VistA API, and navigable. |
| `$$UP^XLFSTR(...)` | Parsed, semantically classified as FileMan/VistA API, and navigable. |
| `$$FMADD^XLFDT($$GET1^DIQ(...),1)` | Both nested references parse and navigate; `XLFDT` resolves to `localr`. |
| `D:DUZ FILE^DIE(...),UPDATE^DIE(...)` | Post-conditional and comma-separated command operands parse. |
| Strings/comments containing references | Ignored. |
| `^TMP($J,...)` | Ignored as a global, not a routine reference. |
| `D ^XUP` | Retained as routine-only navigation. |
| Local labels | Resolve to same-document labels. |
| Local variables | Resolve to nearest `NEW`/`SET` declaration found by existing local-variable navigation. |

## Indexing Measurements

Measured by the automated fixture:

- Source folders: 2 (`/var/worldvista/prod/hakeem/localr`, `/var/worldvista/prod/hakeem/routines`).
- `localr` priority: verified; `XLFDT` resolves to the `localr` copy instead of the `routines` fallback.
- Duplicate handling: verified through duplicate diagnostics and retained local override behavior.
- Cache behavior: second rebuild reports cache hits.
- Normal logs: include indexed routine count, label count, source folder count, source folder list, cache hits/misses, duplicates removed count, and key routine status.
- Debug-only logs: duplicate routine name lists remain debug-only and are not printed in normal output.

## Performance Measurements

The hardening fixture is intentionally small but exercises production-style patterns. It validates the measurable behavior MForge can guarantee today:

- Rebuilds reuse cached mtime/label entries on a second pass.
- Normal output remains bounded and does not dump duplicate lists.
- Index diagnostics expose elapsed time, source folders, cache hits, cache misses, duplicate counts, and key routine status.

No full lazy routine catalog refactor was implemented in 0.6.2. For very large trees, cached eager label parsing remains the current architecture. A true catalog-first / lazy-label parsing refactor is the recommended next performance task before any broader Stage 5 analysis expansion.

## Diagnostics and Theme Validation

- Existing standards diagnostics continue to run through the MForge diagnostics pipeline.
- Parser safety was specifically hardened for strings, comments, and globals.
- MForge Dark already distinguishes navigable routine references, unresolved routine references, APIs, commands, labels, globals, locals, strings, comments, and system variables; 0.6.2 adds broader API semantic classification for Hakeem/VistA calls.

## Debugger Validation

- MForge still contributes debug type `mumps`, launch/attach configuration, MDEBUG helper packaging, direct debug commands, Direct Debug view, and safe no-session warning behavior from the parity pass.
- Full live MDEBUG TCP connector hardening remains future runtime work; no unsafe new debug behavior was added in this pass.

## Remaining Limitations

- Dynamic indirection is not resolved.
- Cross-document local variable references are intentionally not resolved.
- Full lazy routine catalog with deferred label parsing is not implemented yet.
- Tree-sitter structural parsing is not integrated.
- Live MDEBUG TCP connector behavior still needs dedicated production hardening.

## Recommendations Before Stage 5.2

1. Run the hardening test matrix in any available real Hakeem container or Remote SSH workspace.
2. Validate the VSIX manually against `/var/worldvista/prod/hakeem/localr` and `/var/worldvista/prod/hakeem/routines`.
3. Prioritize a catalog-first lazy label parsing task if real routine trees still show slow activation or rebuild times.
4. Keep Rename Symbol, Call Hierarchy, Dependency Graph, and Metrics deferred until real Hakeem navigation/indexing behavior is confirmed stable in production-like workspaces.
