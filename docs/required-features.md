# Required Features Decision

All features are planned as clean MForge implementations. Legacy projects provide inspiration only unless a later task explicitly records source, license, and attribution.

## MVP features

### Syntax highlighting
- **Why needed:** Users must immediately distinguish labels, commands, comments, strings, numbers, globals, intrinsics, and operators.
- **Inspired by:** All old extensions, especially `tree-sitter-m-vscode` for modern scope naming.
- **MForge implementation:** Original TextMate JSON grammar at `Src/syntaxes/mumps.tmLanguage.json` registered for the `mumps` language.
- **Acceptance criteria:** `.m`, `.M`, `.mumps`, `.mps`, `.rou`, and `.int` files open as MUMPS and receive token scopes.
- **Testing steps:** Run `npm run compile` in `Src/`; package smoke test with VS Code Extension Development Host.
- **Documentation required:** `Src/docs/features/syntax-highlighting.md`, README feature section, changelog entry.

### Language configuration
- **Why needed:** Correct comments, word detection, brackets, and auto-closing pairs make editing usable.
- **Inspired by:** All old extensions.
- **MForge implementation:** `Src/language-configuration.json` with semicolon comments, MUMPS word pattern, bracket pairs, indentation hints.
- **Acceptance criteria:** VS Code recognizes comments, word boundaries, and auto-closing pairs in MUMPS files.
- **Testing steps:** Inspect contributed language in package manifest and manual editor smoke test.
- **Documentation required:** README supported language/file section.

### Snippets
- **Why needed:** MUMPS developers repeatedly write routine headers, labels, loops, globals, and VistA-style entry points.
- **Inspired by:** Template concepts in `mumps-debugger---upgrade`; native snippets are new.
- **MForge implementation:** `Src/snippets/mumps.json` with concise reusable snippets.
- **Acceptance criteria:** Snippets appear for the `mumps` language and insert valid MUMPS examples.
- **Testing steps:** Compile/package validation and manual snippet insertion in Extension Development Host.
- **Documentation required:** `Src/docs/features/snippets.md`, README snippet table, changelog entry.

### Basic formatter
- **Why needed:** MUMPS style depends on labels, leading dots, and command spacing.
- **Inspired by:** `mumps-vscode` and `mumps-debugger---upgrade`.
- **MForge implementation:** Future Stage 2 provider under `Src/src/features/formatter/`; Stage 1 only prepares architecture.
- **Acceptance criteria:** Format command normalizes basic whitespace without changing semantics.
- **Testing steps:** Unit tests on representative routines.
- **Documentation required:** `Src/docs/features/formatter.md`.

### Auto indentation
- **Why needed:** Dot-blocks are common and easy to misalign.
- **Inspired by:** `mumps-vscode`, `mumps-debugger---upgrade`, and editor defaults in `tree-sitter-m-vscode`.
- **MForge implementation:** Stage 1 language config and editor defaults; future formatter/indentation rules.
- **Acceptance criteria:** New lines preserve practical spacing and dot-block conventions.
- **Testing steps:** Manual editor tests and formatter tests.
- **Documentation required:** README editing defaults section.

### Go to Label
- **Why needed:** Labels are central MUMPS navigation targets.
- **Inspired by:** `mumps-language-vscode`, `mumps-vscode`, `mumps-debugger---upgrade`, `mumps-lsp`.
- **MForge implementation:** Stage 2/3 provider using a clean parser; MVP plan only.
- **Acceptance criteria:** F12 on an intra-routine label reference navigates to the matching label.
- **Testing steps:** Unit tests for label extraction and manual F12 tests.
- **Documentation required:** `Src/docs/features/navigation.md`.

### Document symbols
- **Why needed:** Routines need an outline of entry points and labels.
- **Inspired by:** `mumps-vscode`, `mumps-debugger---upgrade`, `mumps-lsp`.
- **MForge implementation:** Clean label parser and `DocumentSymbolProvider` in a later MVP implementation sprint.
- **Acceptance criteria:** Outline shows top-level labels with ranges.
- **Testing steps:** Unit tests and VS Code outline smoke test.
- **Documentation required:** Navigation feature doc.

### Basic hover
- **Why needed:** MUMPS abbreviations are terse and hard for newcomers.
- **Inspired by:** `mumps-language-vscode`, `mumps-vscode`, `mumps-debugger---upgrade`, `mumps-lsp`.
- **MForge implementation:** Command/intrinsic/system-variable reference table with markdown hovers.
- **Acceptance criteria:** Hovering common commands and intrinsics shows name, abbreviation, syntax, and note.
- **Testing steps:** Unit tests for lookup table and manual hover tests.
- **Documentation required:** `Src/docs/features/hover.md`.

### Basic diagnostics
- **Why needed:** Catch obvious syntax mistakes before runtime.
- **Inspired by:** `mumps-debugger---upgrade`, `mumps-lsp`.
- **MForge implementation:** Basic parser checks for unterminated strings, suspicious commands, and invalid label forms.
- **Acceptance criteria:** Diagnostics appear and clear as file edits are made.
- **Testing steps:** Unit tests and manual diagnostic collection tests.
- **Documentation required:** `Src/docs/features/diagnostics.md`.

### README documentation
- **Why needed:** Marketplace users need clear installation, scope, and roadmap expectations.
- **Inspired by:** Documentation strengths in `mumps-lsp` and `tree-sitter-m-vscode`.
- **MForge implementation:** `Src/README.md` with Stage 0/1 features and planned roadmap.
- **Acceptance criteria:** README names MForge, file extensions, features, snippets, and roadmap.
- **Testing steps:** Markdown review.
- **Documentation required:** README and changelog.

## Stage 2 features

| Feature | Why needed | Inspired by | MForge implementation | Acceptance criteria | Testing steps | Documentation required |
| --- | --- | --- | --- | --- | --- | --- |
| Completion/IntelliSense | Speed and reduce abbreviation errors | `mumps-debugger---upgrade`, `mumps-lsp` | Completion provider for commands, intrinsics, variables, labels | Suggestions appear contextually | Provider unit tests and manual completion tests | Completion docs and README |
| Go to Routine | Cross-file calls are routine-centric | `mumps-lsp` | Workspace routine index based on filenames and labels | `D ^ROU` navigates to routine file | Workspace fixture tests | Navigation docs |
| Workspace symbols | Large VistA trees need symbol search | `mumps-lsp` | WorkspaceSymbolProvider backed by routine index | Ctrl+T finds routines/labels | Workspace fixture tests | Navigation docs |
| Improved formatter | Consistent team style | `mumps-vscode`, debugger | Parser-aware formatter | Formatting is stable/idempotent | Snapshot tests | Formatter docs |
| MUMPS command validation | Prevent typo bugs | debugger, LSP | Command table and abbreviation validation | Invalid commands warn | Diagnostics tests | Diagnostics docs |
| Routine explorer | Visual navigation | Symbol concepts in LSP | VS Code tree view of routines/labels | Explorer lists routines and refreshes | Tree provider tests/manual | Explorer docs |

## Stage 3 features

| Feature | Why needed | Inspired by | MForge implementation | Acceptance criteria | Testing steps | Documentation required |
| --- | --- | --- | --- | --- | --- | --- |
| Language Server architecture | Scales advanced analysis | `mumps-lsp`, tree-sitter concepts | MForge LSP or modular analyzer process | Client/server activates reliably | Integration tests | Architecture docs |
| Advanced diagnostics | Standards and maintainability | debugger standards rules | Rule engine with profiles | Configurable warnings | Rule tests | Diagnostics docs |
| Find references | Impact analysis | `mumps-lsp`, debugger refs | Reference provider using dependency index | Shift+F12 returns calls | Workspace tests | Navigation docs |
| Signature help | Function call confidence | older hover/signature providers | Signature provider from reference database | Intrinsics/extrinsics show args | Provider tests | Hover/signature docs |
| Routine dependency analyzer | Understand VistA call chains | LSP navigation | Graph builder for DO/GOTO/$$ calls | Report dependencies | Fixture graph tests | Analyzer docs |
| Code metrics | Identify risky routines | New MForge feature | Metrics command and report | Metrics emitted per routine | Fixture tests | Metrics docs |

## Stage 4 features

| Feature | Why needed | Inspired by | MForge implementation | Acceptance criteria | Testing steps | Documentation required |
| --- | --- | --- | --- | --- | --- | --- |
| Debugger integration | Runtime productivity | `mumps-debugger---upgrade` | New debug adapter design | Launch/attach documented and functional | Debug adapter tests/manual | Debugger docs |
| GT.M/YottaDB support | Open-source runtime workflows | debugger README, LSP README | Runtime settings and command wrappers | Detect/validate configured runtime | Command tests | Runtime docs |
| Docker/Remote SSH support | Common deployment model | debugger README | Documentation and remote-safe settings | Remote workflow guide works | Manual remote smoke tests | Debugger/runtime docs |
| MDEBUG integration | Practical existing debug protocol | `mumps-debugger---upgrade` | Compatibility layer after protocol review | MDEBUG attach works | Manual MDEBUG tests | Debugger docs |

## Stage 5 features

| Feature | Why needed | Inspired by | MForge implementation | Acceptance criteria | Testing steps | Documentation required |
| --- | --- | --- | --- | --- | --- | --- |
| VistA-specific tools | MForge target audience | debugger standards/templates | Dedicated VistA module | Commands are VistA-profile aware | Fixture/manual tests | VistA docs |
| RPC explorer | Discover broker endpoints | New MForge feature | Tree view from VistA metadata/runtime | RPCs list with details | Mock metadata tests | Vista tools docs |
| FileMan dictionary helper | Understand files/fields | New MForge feature | Dictionary parser/connector | File/field docs available | Mock dictionary tests | FileMan docs |
| Global explorer | Inspect hierarchical globals safely | LSP global awareness | Read-only explorer with safeguards | Globals browse with limits | Mock/runtime tests | Global explorer docs |
| Routine upload/download | Sync with VistA environments | New MForge feature | Safe connector commands | Diff before upload/download | Integration tests | Sync docs |
| Healthcare/VistA productivity tools | Reduce operational friction | VistA workflow observations | Patch, namespace, and metadata helpers | Tools documented and guarded | Manual workflow tests | VistA docs |
