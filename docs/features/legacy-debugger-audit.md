# Legacy Debugger Audit: `mumps-debugger---upgrade`

Date: 2026-06-07

This audit compares the legacy `Old Extensions/mumps-debugger---upgrade` extension against the current MForge MUMPS & VistA IDE and records the parity work completed for MForge 0.6.0.

## A. Comparison Table

| Feature | Legacy Extension | MForge | Action |
| --- | --- | --- | --- |
| Syntax highlighting | TextMate grammar for MUMPS commands, labels, globals, strings, comments, operators, and special variables. | Modern JSON TextMate grammar plus MForge Dark theme and Marketplace-safe language metadata. | Covered; MForge is better documented and packaged. |
| Semantic highlighting | Contributed semantic token scopes through `mumpsHighlighter`. | Native semantic token provider for labels, commands, intrinsics, globals, system variables, parameters, local variables, FileMan APIs, and routine references. | Covered; MForge is superior because it distinguishes navigable/unresolved routine references and validates token contributions. |
| Navigation (Ctrl+Click, F12) | Definition provider for labels/routines. | Local and cross-routine definition providers, document links, routine-top fallback, URI-safe routine index, configured/detected routine paths, extensionless routine support, and remote filesystem support. | Covered; MForge is superior. |
| Find References | Legacy reference provider existed for static MUMPS symbols. | Stage 5.1 reference provider supports local labels, indexed `LABEL^ROUTINE`, common FileMan/VistA APIs, and same-document local variables. | Covered; MForge is superior due to routine-index integration and result caps. |
| Hover documentation | Commands/intrinsics/system-variable hover documentation. | Command, intrinsic, system-variable, and navigation hovers with unresolved-reference guidance. | Covered; MForge is superior. |
| Completion | Commands, intrinsics, variables, labels, and language definitions. | Commands, intrinsics, system variables, labels, routines, and indexed routine references. | Covered; MForge is superior because completions use the routine index. |
| Signature Help | Legacy MUMPS signature provider. | Intrinsic/function signature provider with tests and docs. | Covered. |
| Routine Header Template | `mumps.insertRoutineHeaderTemplate` generated the EHS/VistA-style header. | Ported as `mforge.insertRoutineHeaderTemplate` with legacy `mumps.insertRoutineHeaderTemplate` alias. | Ported. |
| Patch Change Block Template | `mumps.insertPatchChangeBlockTemplate` generated patch start/end markers. | Ported as `mforge.insertPatchChangeBlockTemplate` with legacy `mumps.insertPatchChangeBlockTemplate` alias. | Ported. |
| Standards diagnostics | `standardsRules.ts` checked VistA/UJO headers, namespaces, label length, local variable naming, `^TMP`, and `^%` globals. | Ported into MForge diagnostics under `mforge.standards.*` with legacy `mumps.standards.*` fallback reads. | Ported and integrated. |
| VistA/UJO rules | VistA/UJO/custom standards profiles plus namespace prefixes. | Same profile model with MForge settings and compatibility fallback. | Ported. |
| Snippets | No dedicated snippet contribution in the legacy debugger package. | MForge has MUMPS, VistA RPC, FileMan FDA, and routine workflow snippets. | Covered; MForge is superior. |
| Commands | Legacy command surface for document/template/debug actions. | MForge commands for getting started, navigation/index diagnostics, templates, standards-backed diagnostics, and direct debug commands. | Covered; template/debug command surface ported. |
| Debug commands (`ZSTEP`, `ZWRITE`, `ZSHOW`, `ZBREAK`, etc.) | Direct debug commands sent `mumps.rawCommand` custom requests to an active `mumps` debug session and exposed status/tree controls. | Ported as MForge command IDs with legacy aliases, output channel, status bar controls, Direct Debug view, smoke test, setup, raw command, copy, and clear output. | Ported. |
| Launch/Attach debugging support | Contributed `mumps` debugger with launch and attach configurations for MDEBUG. | Added Marketplace-compatible `mumps` debugger contribution with launch/attach attributes, snippets, initial configuration, and breakpoints. | Ported contribution; live connector hardening deferred. |
| MDEBUG integration | Included `MDEBUG.m`, TCP connector, debug adapter, raw command bridge, and setup workflow. | Added MDEBUG launch/attach contribution and direct-command bridge; retained raw-command custom request shape used by Direct Debug controls. | Partially ported; full live connector parity deferred for runtime hardening. |
| Settings | `mumps.standards.*`, variable check settings, and `mumps.debug.*`. | Added `mforge.standards.*` and `mforge.debug.*`, keeping old standards settings as fallback reads. Existing MForge feature settings remain intact. | Ported useful settings; obsolete variable NEW-check settings deferred. |
| Build/package workflow | TypeScript, webpack/vsce workflow in old package. | Existing MForge TypeScript/vsce workflow with `npm run compile`, `npm run test`, `npm run package`, environment checks, and new parity test. | Covered; MForge is superior. |

## B. Features Ported from `mumps-debugger---upgrade`

- Routine header template generator and insertion command.
- Patch change block template generator and insertion command.
- VistA/UJO/custom standards settings and diagnostics for:
  - routine header metadata separators,
  - namespace prefix enforcement,
  - 8-character label warnings,
  - 16-character local variable warnings,
  - lowercase local variable informational diagnostics,
  - `^TMP` `$J` scoping warnings,
  - guarded `^%` global mutation warnings.
- Legacy `MDEBUG.m` helper routine.
- MDEBUG/direct-debug command surface:
  - `ZSTEP`, `ZCONTINUE`, `ZSTEP INTO`, `ZSTEP OUTOF`,
  - `ZWRITE`, `ZSHOW`, `ZBREAK`, `ZPRINT`, `ZPRINT @$ZPOSITION`,
  - `$ZSTEP` line-printing setup,
  - `$ZPOSITION` display,
  - raw command entry,
  - setup and smoke test workflows,
  - debug output open/copy/clear commands,
  - status bar controls and Direct Debug tree view.
- Marketplace debugger metadata:
  - `mumps` debug type,
  - launch and attach configuration attributes,
  - launch/attach snippets,
  - MUMPS breakpoint contribution.
- Debug and standards settings under MForge naming.
- Legacy command aliases for the ported template and direct-debug commands.
- Automated legacy parity test coverage.

## C. Areas Where MForge Is Now Superior

- MForge combines the useful legacy debugger features with newer routine indexing, remote-safe URI handling, configured and auto-detected routine paths, extensionless routine support, and deterministic indexing diagnostics.
- MForge has stronger navigation than the legacy debugger: Ctrl+Click/F12, document links, routine-top fallback, unresolved guidance, workspace symbols, and indexed cross-routine support.
- MForge has Find References coverage for local labels, indexed routine calls, common FileMan/VistA APIs, and same-document locals.
- MForge has validated Marketplace-compatible semantic token declarations and a dedicated MForge Dark theme.
- MForge has a broader snippet set than the legacy debugger.
- MForge keeps all feature settings under the `mforge.*` namespace while reading useful old standards settings for compatibility.
- MForge has repeatable automated tests for parser/formatter, navigation, semantic tokens, references, and legacy parity.
- MForge package scripts keep compile, test, and VSIX generation in the current extension architecture instead of reverting to the old webpack-oriented layout.

## D. Deferred Items

- Full live MDEBUG TCP connector parity from the legacy `mumpsConnect.ts` and full debug adapter runtime behavior remains deferred for a dedicated runtime-hardening stage. MForge 0.6.0 contributes the debugger type, launch/attach metadata, breakpoints, the legacy `MDEBUG.m` helper routine, and direct-command bridge shape without removing any current IDE behavior.
- Legacy variable `NEW` checks (`mumps.enableVariableCheck` and `mumps.variablesToBeIgnoredAtNewCheck`) are deferred because MForge needs a safer parser-backed implementation before enforcing subroutine variable scope rules.
- Legacy auto-documentation command behavior remains deferred; MForge hover/signature/snippet documentation already covers the useful interactive documentation scenarios.
- VistA explorers, RPC browsing, FileMan dictionary browsing, read-only global exploration, rename, call hierarchy, dependency analysis, and metrics remain planned follow-up work.

## What Was Found

The old debugger carried three useful feature groups that MForge did not fully expose before 0.6.0: VistA/UJO template insertion, VistA/UJO standards diagnostics, and MDEBUG-oriented direct debug controls plus launch/attach Marketplace metadata. The rest of the legacy language-service feature set was already covered or exceeded by MForge.

## What Was Reused

The template text and standards rule behavior were reused directly where safe. The direct debug command vocabulary, smoke-test workflow, output-channel behavior, `$ZSTEP` setup, `$ZPOSITION` tracking, and `mumps.rawCommand` custom-request shape were reused and adapted to MForge command names.

## What Was Improved

MForge added the reused features under `mforge.*` settings and command names, preserved legacy aliases for compatibility, added automated tests, documented the full audit, and kept the current TypeScript module layout. Standards diagnostics now integrate with the existing MForge diagnostics pipeline rather than replacing it.

## Why MForge Is Now a Superset

MForge now contains every useful editor-facing feature from `mumps-debugger---upgrade` while preserving all existing MForge capabilities: modern syntax and semantic highlighting, snippets, formatting, diagnostics, navigation, references, hover, completion, signature help, remote-safe routine indexing, Marketplace packaging, and tests. The only deferred legacy items are runtime-heavy or safety-sensitive pieces that require a dedicated implementation pass; they are documented and do not block MForge from being the superior day-to-day IDE extension.
