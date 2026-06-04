# Navigation

MForge navigation includes document symbols, workspace symbols, document links, Ctrl+Click/F12 definition lookup, Peek Definition support through VS Code, and Stage 5.1 Find References.

Navigation is static and parser-based. It resolves local labels, local variable definitions, and indexed `LABEL^ROUTINE` targets without requiring a MUMPS runtime, Python LSP, or tree-sitter dependency.

## Stage 5.1 reliability notes

- Peek Definition and Find References share the same scanner for inline calls, no-parentheses extrinsics, unary-NOT/logical extrinsics, and multiple references per line.
- Cross-routine results depend on the cached routine index.
- Missing labels fall back to the top of an indexed routine for definitions and declarations where appropriate.
- Strings, comments, and ignored folders are skipped.

See [Find References](references.md) for reference-specific settings and limitations.

## Hakeem / WorldVistA indexing

Auto-detection now selects only routine source folders such as `/var/worldvista/prod/hakeem/routines` and `/var/worldvista/prod/hakeem/localr`; it does not auto-detect the broad `/var/worldvista/prod/hakeem` project root.

## Old extension review

Stage 5.2 reviewed `Old Extensions/mumps-lsp`, `Old Extensions/tree-sitter-m-vscode`, and `Old Extensions/mumps-debugger---upgrade`. The old Python LSP indexes a whole workspace glob, the tree-sitter extension focuses on semantic tokens/parser integration, and the debugger extension provides document-level symbols/definition helpers. None provided a faster Hakeem-specific routine-source index, so MForge keeps its native TypeScript index and adds localr-first, routine-search-path-only, incremental caching.
