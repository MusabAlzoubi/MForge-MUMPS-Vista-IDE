# Changelog

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
