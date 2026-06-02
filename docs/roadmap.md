# MForge Staged Roadmap

## Stage 0: Cleanup and project setup

- **Goal:** Establish a valid VS Code extension scaffold under `Src/` with MForge identity.
- **Tasks:** Verify `Src` structure; initialize package metadata; configure TypeScript; add icon metadata; add marketplace metadata; add supported extensions `.m`, `.M`, `.mumps`, `.mps`, `.rou`, `.int`; add base README.
- **Files to modify:** `Src/package.json`, `Src/tsconfig.json`, `Src/.vscodeignore`, `Src/README.md`, `Src/CHANGELOG.md`, `Src/LICENSE`, `Src/src/extension.ts`.
- **Expected output:** Extension compiles and has correct display name, name, publisher, description, icon, activation events, and scripts.
- **Acceptance criteria:** `npm run compile` succeeds in `Src`; package JSON validates; MForge identity is visible.
- **Documentation updates:** README and changelog describe Stage 0 scaffold.
- **README updates:** Add overview, supported files, and roadmap.

## Stage 1: Core language support

- **Goal:** Provide static language support for MUMPS files.
- **Tasks:** Add syntax highlighting; language configuration; comments; brackets; auto closing pairs; file associations; snippets.
- **Files to modify:** `Src/package.json`, `Src/syntaxes/mumps.tmLanguage.json`, `Src/language-configuration.json`, `Src/snippets/mumps.json`, `Src/docs/features/syntax-highlighting.md`, `Src/docs/features/snippets.md`, `Src/README.md`, `Src/CHANGELOG.md`.
- **Expected output:** VS Code recognizes supported MUMPS extensions, highlights common MUMPS tokens, and offers snippets.
- **Acceptance criteria:** JSON files validate; compile succeeds; manual Extension Development Host shows highlighting and snippets.
- **Documentation updates:** Feature docs for syntax highlighting and snippets.
- **README updates:** Add feature usage and snippet list.

## Stage 2: Editing productivity

- **Goal:** Improve day-to-day editing quality.
- **Tasks:** Formatter; auto indentation; basic lint rules; basic diagnostics.
- **Files to modify:** `Src/src/features/formatter/`, `Src/src/features/diagnostics/`, `Src/src/parser/`, `Src/docs/features/formatter.md`, `Src/docs/features/diagnostics.md`, README, changelog.
- **Expected output:** Basic formatting command and diagnostics for common mistakes.
- **Acceptance criteria:** Formatter is idempotent on fixtures; diagnostics appear and clear reliably.
- **Documentation updates:** Formatter and diagnostics docs.
- **README updates:** Add commands/settings and examples.

## Stage 3: Navigation

- **Goal:** Make routine and label navigation reliable.
- **Tasks:** Document symbols; Go to Label; Go to Routine; Workspace symbols.
- **Files to modify:** `Src/src/features/symbols/`, `Src/src/features/navigation/`, `Src/src/parser/`, `Src/docs/features/navigation.md`, README, changelog.
- **Expected output:** Outline, F12 label/routine navigation, and workspace symbol search.
- **Acceptance criteria:** Navigation works on fixture workspaces with multiple routines.
- **Documentation updates:** Navigation docs.
- **README updates:** Add navigation usage.

## Stage 4: Intelligence

- **Goal:** Add MUMPS language knowledge at the cursor.
- **Tasks:** Hover provider; completion provider; signature help; MUMPS command reference.
- **Files to modify:** `Src/src/features/hover/`, `Src/src/features/completion/`, `Src/src/features/signature/`, `Src/src/reference/`, docs, README, changelog.
- **Expected output:** Commands, intrinsics, variables, labels, and signatures are discoverable.
- **Acceptance criteria:** Provider tests cover common commands/functions and editor smoke tests pass.
- **Documentation updates:** Hover/completion/signature docs.
- **README updates:** Add examples.

## Stage 5: Advanced analysis

- **Goal:** Support large-routine analysis and maintainability.
- **Tasks:** Routine parser; Find references; Dependency analyzer; Code metrics.
- **Files to modify:** `Src/src/parser/`, `Src/src/features/navigation/`, `Src/src/features/analysis/`, docs, README, changelog.
- **Expected output:** Dependency and metrics reports for MUMPS workspaces.
- **Acceptance criteria:** Analyzer matches fixture expectations and handles missing routines gracefully.
- **Documentation updates:** Analyzer and metrics docs.
- **README updates:** Add analysis commands.

## Stage 6: Runtime and debugging

- **Goal:** Research and implement runtime-aware debugging safely.
- **Tasks:** Debug adapter research; MDEBUG integration; GT.M/YottaDB configuration; Docker/Remote SSH notes.
- **Files to modify:** `Src/src/features/debugger/`, `Src/src/features/runtime/`, `Src/docs/features/debugger.md`, README, changelog.
- **Expected output:** Documented debug strategy and initial runtime configuration support.
- **Acceptance criteria:** Launch/attach behavior is tested against controlled environments or mocks.
- **Documentation updates:** Debugger and runtime docs.
- **README updates:** Add debug setup and limitations.

## Stage 7: VistA tools

- **Goal:** Add VistA-specific productivity tools.
- **Tasks:** VistA routine helpers; RPC explorer; FileMan dictionary explorer; Global explorer.
- **Files to modify:** `Src/src/features/vista/`, `Src/src/features/explorer/`, `Src/docs/features/vista-tools.md`, README, changelog.
- **Expected output:** Read-only VistA explorers and helper commands with safety controls.
- **Acceptance criteria:** Mock VistA metadata tests pass; write actions require explicit confirmation.
- **Documentation updates:** VistA tools docs.
- **README updates:** Add VistA workflows.

## Stage 8: Packaging and publishing

- **Goal:** Prepare a marketplace-quality release.
- **Tasks:** Testing; build; `vsce package`; Marketplace README; screenshots; release notes.
- **Files to modify:** `Src/package.json`, `Src/README.md`, `Src/CHANGELOG.md`, packaging docs/assets.
- **Expected output:** Versioned `.vsix` ready for review and publication.
- **Acceptance criteria:** Build/package succeeds; README and changelog are complete; no license/provenance gaps.
- **Documentation updates:** Packaging notes and release checklist.
- **README updates:** Add screenshots and installation instructions.
