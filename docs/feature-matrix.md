# Feature Matrix

Legend: **High** = production-like or broad coverage; **Medium** = useful but incomplete; **Low** = minimal or proof-of-concept; **None** = not detected.

| Feature name | Which old extension provides it | Quality level | Implementation complexity | Priority for MForge | Decision | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Syntax highlighting | All five extensions | Medium to High | Medium | MVP | Reimplement | Use original TextMate JSON in Stage 1; consider tree-sitter/LSP semantic tokens later. |
| Language configuration | All five extensions | Medium | Low | MVP | Reimplement | Comments, brackets, word pattern, indentation, auto closing pairs. |
| Snippets | Template commands in `mumps-debugger---upgrade`; no snippet manifests | Low | Low | MVP | Reimplement | Add native VS Code snippets for labels, routines, loops, globals, FileMan/VistA-friendly patterns. |
| Formatter | `mumps-vscode`, `mumps-debugger---upgrade` | Medium | Medium | MVP then Stage 2 | Reimplement | Start with basic whitespace/dot-block conventions after Stage 1. |
| Auto indentation | `mumps-vscode`, `mumps-debugger---upgrade`, editor defaults in `tree-sitter-m-vscode` | Medium | Medium | MVP | Reimplement | Stage 1 language config plus future formatter indentation provider. |
| Go to Routine | `mumps-lsp`; partial old label lookup near files | Medium | Medium | Stage 2 | Reimplement | Workspace index by routine filename and entryrefs. |
| Go to Label | `mumps-language-vscode`, `mumps-vscode`, `mumps-debugger---upgrade`, `mumps-lsp` | Medium | Medium | MVP | Reimplement | Start intra-document, then cross-routine. |
| Document symbols | `mumps-vscode`, `mumps-debugger---upgrade`, `mumps-lsp` | Medium | Medium | MVP | Reimplement | Parse labels and sublabels. |
| Workspace symbols | `mumps-lsp` | Medium | Medium-High | Stage 2 | Reimplement | Requires workspace scanner/index. |
| Hover documentation | `mumps-language-vscode`, `mumps-vscode`, `mumps-debugger---upgrade`, `mumps-lsp` | Medium | Medium | MVP | Reimplement | Built-in commands/functions first; label comments later. |
| Completion/IntelliSense | `mumps-debugger---upgrade`, `mumps-lsp` | Medium | Medium | Stage 2 | Reimplement | Commands, intrinsics, system variables, labels/routines. |
| Signature help | `mumps-language-vscode`, `mumps-vscode`, `mumps-debugger---upgrade` | Medium | Medium | Stage 3 | Reimplement | Intrinsics and extrinsic function calls. |
| Diagnostics/linting | `mumps-debugger---upgrade`, `mumps-lsp` | Medium | Medium-High | MVP basic; Stage 3 advanced | Reimplement | Basic unmatched quotes/unknown commands; advanced standards later. |
| MUMPS command validation | `mumps-debugger---upgrade`, `mumps-lsp` | Medium | Medium | Stage 2 | Reimplement | Needs command abbreviation table and parser. |
| Routine explorer | Not directly; symbols approximate | Low | Medium | Stage 2 | Reimplement | Tree view of routines/entry points. |
| Global explorer | `mumps-lsp` setting hints global analysis; no full explorer | Low | High | Stage 5 | Reimplement | Requires runtime adapter and safety rules. |
| VistA RPC explorer | Not detected | None | High | Stage 5 | Reimplement | New MForge VistA tool. |
| FileMan dictionary helper | Not detected | None | High | Stage 5 | Reimplement | Requires VistA metadata connection. |
| GT.M/YottaDB integration | `mumps-debugger---upgrade` README/debugger; runtime mentions in `mumps-lsp` | Medium | High | Stage 4 | Reimplement | Runtime paths, environment variables, MDEBUG compatibility. |
| Docker/Remote SSH support | `mumps-debugger---upgrade` docs | Medium | Medium | Stage 4 | Reimplement/docs | Document workflows first; integrate later. |
| Debugger integration | `mumps-debugger---upgrade` | Medium-High | High | Stage 4 | Reimplement | Requires debug adapter design and MDEBUG protocol review. |
| Routine compare | Not detected | None | Medium | Stage 5+ | Reimplement | Useful for VistA patch/routine workflows. |
| Routine dependency analyzer | `mumps-lsp` references/navigation imply parse basis | Low-Medium | High | Stage 3 | Reimplement | Analyze DO/GOTO/extrinsic/routine references. |
| Code metrics | Not detected | None | Medium | Stage 3 | Reimplement | Lines, labels, cyclomatic proxies, command density. |
| Marketplace packaging | `tree-sitter-m-vscode`, `mumps-lsp`, debugger package metadata | Medium | Low | Stage 8 | Reimplement | MForge metadata, icon, README, changelog, vsce package. |
