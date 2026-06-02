# Old Extensions Analysis

This analysis reviews every project under `Old Extensions/` before implementing MForge. The guiding decision is to treat legacy projects as product and architecture references, not as source-code donors, unless a license clearly permits reuse and the reuse is documented.

## License summary

| Folder | Declared license | License evidence | Reuse risk |
| --- | --- | --- | --- |
| `mumps-debugger---upgrade` | Not declared for project code | No `license` in `package.json`; no top-level `LICENSE`; bundled third-party notices only | High |
| `mumps-language-vscode` | Not declared | No `license` in `package.json`; no top-level `LICENSE` | High |
| `mumps-lsp` | Apache-2.0 | `package.json` `license` field | Medium-low with attribution |
| `mumps-vscode` | Not declared | No `license` in `package.json`; no top-level `LICENSE` | High |
| `tree-sitter-m-vscode` | MIT | `package.json` `license` field and top-level `LICENSE` | Low with attribution |

No MForge Stage 0/1 source code was copied from old extensions. The old extensions are used as feature references only.

---

## `mumps-debugger---upgrade`

- **Extension name:** VistA MUMPS Toolkit
- **Repository/folder name:** `mumps-debugger---upgrade`
- **Main purpose:** Combined MUMPS language tooling and debugger support, including MDEBUG-oriented direct debugging controls for GT.M/VistA workflows.
- **Language/tech stack:** TypeScript source, compiled JavaScript in `out/` and webpack bundle in `dist/`; VS Code Extension API; debug adapter contribution; M routine `MDEBUG.m`.
- **package.json contributions:** Commands for command expansion, function documentation, VistA-style templates, direct debug commands, ZSTEP/ZCONTINUE/ZWRITE/ZSHOW/ZBREAK/ZPRINT; debugger type `mumps`; variables; language and grammar; keybindings; MUMPS breakpoints; semantic token scopes; settings for variable checks, standards profiles, and direct debug timeouts; debug toolbar and debug view contributions.
- **Supported file extensions:** `.int`, `.m`, `.mps`, `.zwr`.
- **Syntax highlighting support:** TextMate grammar plus semantic token scopes.
- **Formatter support:** Yes; includes formatting helper and autospace behavior.
- **Snippets support:** No dedicated VS Code snippet contribution; provides template insertion commands.
- **Hover support:** Yes; `mumpsHoverProvider` exists.
- **Completion/IntelliSense support:** Yes; `mumpsCompletionItemProvider` exists.
- **Go to Definition / Go to Label support:** Yes; definition and reference providers exist.
- **Diagnostics/linting support:** Yes; diagnostics provider plus variable NEW checks and standards rules.
- **Debugging support:** Strongest legacy debug support; launch/attach configuration, breakpoints, MDEBUG direct commands, and debug output view.
- **Language Server support:** No LSP contribution detected; implementation appears extension-host based.
- **VistA-specific features:** VistA/UJO/custom standards profile settings; routine header and patch change templates; VistA-like namespace and global standards checks.
- **GT.M/YottaDB-specific features:** MDEBUG workflow and README references to GT.M Docker/Remote SSH.
- **Strengths:** Broadest feature coverage; practical debugger workflow; standards checks; command palette integration; useful template concepts.
- **Weaknesses:** Large compiled artifacts committed; mixed old/new structure; no clear project license; debug implementation appears tightly coupled to MDEBUG and local path mapping.
- **Code quality notes:** Feature-rich but legacy-style organization. Several generated folders (`dist/`, `out/`) make provenance and maintainability harder. Architecture should be studied conceptually, not copied.
- **License:** Project license not found. Third-party notices exist for bundled dependencies only.
- **Reuse risk:** High. Do not reuse code without obtaining license clarification.

---

## `mumps-language-vscode`

- **Extension name:** M/MUMPS/Caché language syntax highlighting
- **Repository/folder name:** `mumps-language-vscode`
- **Main purpose:** Basic syntax highlighting and simple language hints for M/MUMPS/Caché.
- **Language/tech stack:** JavaScript VS Code extension, TextMate grammar, JSON command/function definitions.
- **package.json contributions:** Language registration and grammar only.
- **Supported file extensions:** `.int`, `.m`, `.mps`, `.zwr`.
- **Syntax highlighting support:** Yes; TextMate grammar converted from an M/MUMPS/Caché TextMate bundle.
- **Formatter support:** Not contributed.
- **Snippets support:** None.
- **Hover support:** README describes hover hints for commands, variables, functions, and label comments.
- **Completion/IntelliSense support:** Not detected.
- **Go to Definition / Go to Label support:** README describes jumping to labels in open and nearby files.
- **Diagnostics/linting support:** None detected.
- **Debugging support:** None.
- **Language Server support:** None.
- **VistA-specific features:** None explicit beyond Caché/MUMPS context.
- **GT.M/YottaDB-specific features:** None detected.
- **Strengths:** Small and easy to understand; useful hover and label-navigation ideas.
- **Weaknesses:** Old and explicitly unmaintained; package manifest under-declares runtime providers; simple parsing only.
- **Code quality notes:** Lightweight JavaScript implementation suitable as conceptual reference for label/comment heuristics.
- **License:** Not found.
- **Reuse risk:** High. Do not reuse source or grammar without license clarification.

---

## `mumps-lsp`

- **Extension name:** MUMPS/M Language Support
- **Repository/folder name:** `mumps-lsp`
- **Main purpose:** LSP-backed MUMPS/M support with cross-file navigation and language intelligence.
- **Language/tech stack:** TypeScript VS Code client plus Python language server; TextMate grammar JSON.
- **package.json contributions:** Language registration, grammar, settings for Python path, server path, LSP trace level, and maximum global analysis depth.
- **Supported file extensions:** `.m`, `.mps`, `.mumps`, `.ros`, `.int`, `.zwr`.
- **Syntax highlighting support:** Yes; JSON TextMate grammar.
- **Formatter support:** Not emphasized in manifest; server could be extended.
- **Snippets support:** None.
- **Hover support:** README lists hover information with documentation.
- **Completion/IntelliSense support:** README lists completion for commands, functions, and variables.
- **Go to Definition / Go to Label support:** README lists cross-file go-to definition for labels and routines.
- **Diagnostics/linting support:** LSP architecture supports diagnostics; README emphasizes language services rather than a detailed lint rule list.
- **Debugging support:** None.
- **Language Server support:** Yes; primary differentiator.
- **VistA-specific features:** Healthcare examples and MUMPS global context, but no dedicated VistA explorer tools.
- **GT.M/YottaDB-specific features:** Mentions YottaDB as a runtime context, but no direct integration detected.
- **Strengths:** Best architectural direction for future advanced features; cross-file symbols/references are high-value.
- **Weaknesses:** Requires Python runtime; mixed TypeScript/Python deployment; no snippets or debugger.
- **Code quality notes:** Useful reference for separating client and server responsibilities. MForge should eventually implement a TypeScript-first or carefully packaged LSP to reduce runtime friction.
- **License:** Apache-2.0 declared in `package.json`.
- **Reuse risk:** Medium-low if attribution and Apache-2.0 obligations are followed; MForge Stage 0/1 still reimplements cleanly.

---

## `mumps-vscode`

- **Extension name:** M/MUMPS/Caché language syntax highlighting and basic formatting
- **Repository/folder name:** `mumps-vscode`
- **Main purpose:** M/MUMPS/Caché language support with syntax highlighting, basic formatting/autospace, hover/signature helpers, label navigation, and document symbols.
- **Language/tech stack:** TypeScript VS Code extension, TextMate grammar, JSON language definitions.
- **package.json contributions:** Language registration, grammar, keybindings for documentation/autospace, configuration defaults for MUMPS files.
- **Supported file extensions:** `.int`, `.m`, `.mps`, `.zwr`.
- **Syntax highlighting support:** Yes; TextMate grammar.
- **Formatter support:** Yes; document range formatting and autospace commands are present.
- **Snippets support:** None.
- **Hover support:** Yes; provider exists.
- **Completion/IntelliSense support:** Not obvious in source; language definitions support hover/signature.
- **Go to Definition / Go to Label support:** Yes; definition provider and label lookup exist.
- **Diagnostics/linting support:** None detected.
- **Debugging support:** None.
- **Language Server support:** None.
- **VistA-specific features:** None explicit.
- **GT.M/YottaDB-specific features:** None explicit.
- **Strengths:** Practical editor productivity baseline and document symbols.
- **Weaknesses:** No license found; older VS Code engine; sparse manifest; limited advanced analysis.
- **Code quality notes:** Useful feature decomposition ideas, but implementation should be rebuilt with modern TypeScript and tests.
- **License:** Not found.
- **Reuse risk:** High.

---

## `tree-sitter-m-vscode`

- **Extension name:** M (MUMPS)
- **Repository/folder name:** `tree-sitter-m-vscode`
- **Main purpose:** Modern parser-aware M/MUMPS support using a committed `tree-sitter-m` WASM grammar.
- **Language/tech stack:** TypeScript VS Code extension, Web Tree-sitter/WASM, TextMate grammar JSON, Makefile tooling.
- **package.json contributions:** Language `m`, grammar, semantic token scopes, M-file editor defaults, commands for about/open all/smoke report/LSP restart, and optional `m-cli` LSP settings.
- **Supported file extensions:** `.m`, `.mac`, `.int`.
- **Syntax highlighting support:** Strong; TextMate scopes plus semantic token mapping from parse-tree concepts.
- **Formatter support:** Planned/available through optional `m-cli` setting, not core contribution.
- **Snippets support:** None.
- **Hover support:** Not primary feature.
- **Completion/IntelliSense support:** Optional future/companion `m-cli` LSP integration.
- **Go to Definition / Go to Label support:** Not primary feature.
- **Diagnostics/linting support:** Smoke report and optional `m-cli` lint diagnostics.
- **Debugging support:** None.
- **Language Server support:** Optional `m-cli` LSP configuration and restart command.
- **VistA-specific features:** Notes coexistence with VistA metadata tooling; no dedicated VistA features.
- **GT.M/YottaDB-specific features:** None direct.
- **Strengths:** Modern VS Code engine; parser-aware strategy; clear docs and guardrails; MIT license.
- **Weaknesses:** Narrow feature scope; depends on external grammar artifacts for full parser behavior.
- **Code quality notes:** Best reference for modern packaging, syntax fidelity, smoke testing, and semantic token architecture.
- **License:** MIT.
- **Reuse risk:** Low with attribution, but Stage 0/1 avoids code reuse and creates an original grammar/snippet baseline.
