# Navigation

MForge navigation includes document symbols, workspace symbols, document links, Ctrl+Click/F12 definition lookup, Peek Definition support through VS Code, and Stage 5.1 Find References.

Navigation is static and parser-based. It resolves local labels, local variable definitions, and indexed `LABEL^ROUTINE` targets without requiring a MUMPS runtime, Python LSP, or tree-sitter dependency.

## Stage 5.1 reliability notes

- Peek Definition and Find References share the same scanner for inline calls, no-parentheses extrinsics, unary-NOT/logical extrinsics, and multiple references per line.
- Cross-routine results depend on the cached routine index.
- Missing labels fall back to the top of an indexed routine for definitions and declarations where appropriate.
- Strings, comments, and ignored folders are skipped.

See [Find References](references.md) for reference-specific settings and limitations.
