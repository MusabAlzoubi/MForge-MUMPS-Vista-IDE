# MForge MUMPS & VistA IDE

MForge MUMPS & VistA IDE is a VS Code extension for MUMPS and VistA development. Stage 0/1 established the scaffold, syntax highlighting, language configuration, and snippets. Stage 2 adds editing productivity with conservative formatting, parser-assisted indentation awareness, and basic diagnostics. Advanced navigation, hover/completion, runtime, debugger, and VistA tools are planned but intentionally not implemented yet.

## Current Stage 2 features

- Syntax highlighting for common MUMPS constructs:
  - labels and label parameters
  - commands and Z-commands
  - intrinsic functions
  - system variables
  - globals and indirection
  - strings, numbers, comments, operators, and postconditionals
- Language configuration:
  - semicolon line comments
  - bracket and quote auto-closing pairs
  - MUMPS-aware word pattern
  - one-space editor default for dot-block-oriented code
- Snippets for routine headers, labels, DO calls, extrinsic calls, loops, globals, VistA RPC skeletons, and FileMan FDA skeletons.
- Conservative document formatter that removes trailing whitespace while preserving labels, comments, and dot-block structure.
- Parser-assisted line analysis for labels, comments, strings, globals, commands, and dot-block levels.
- Basic diagnostics for unterminated strings, suspicious command tokens, invalid labels, unbalanced parentheses, and trailing whitespace.
- Getting Started command: **MForge: Show Getting Started**.

## Supported file extensions

MForge registers the `mumps` language for:

| Extension | Notes |
| --- | --- |
| `.m` | Common MUMPS routine extension. |
| `.M` | Uppercase routine extension for case-sensitive filesystems. |
| `.mumps` | Explicit MUMPS source extension. |
| `.mps` | Legacy/common MUMPS source extension. |
| `.rou` | Routine file extension used by some workflows. |
| `.int` | Intermediate routine file extension used by some M runtimes. |

## Formatter usage

1. Open a MUMPS file.
2. Run **Format Document**.
3. The formatter removes trailing whitespace and performs only safe spacing cleanup.

Example:

```mumps
START ; comment
 S X="hello"  
 . W X,!   
```

formats to:

```mumps
START ; comment
 S X="hello"
 . W X,!
```

## Diagnostics usage

Diagnostics appear automatically in MUMPS files when enabled. Stage 2 rules include:

| Diagnostic | Severity |
| --- | --- |
| Unterminated string | Warning |
| Suspicious unknown command token | Warning |
| Invalid label format at line start | Warning |
| Unbalanced parentheses | Warning |
| Trailing whitespace | Information |

## Configuration

| Setting | Default | Description |
| --- | --- | --- |
| `mforge.trace.level` | `off` | Controls diagnostic logging for MForge extension features. |
| `mforge.formatter.enabled` | `true` | Enables the conservative MForge document formatter. |
| `mforge.diagnostics.enabled` | `true` | Enables basic MForge diagnostics for MUMPS files. |

## Snippet examples

| Prefix | Description |
| --- | --- |
| `routine` | Basic routine header. |
| `label` | Entry point with parameters and a `QUIT`. |
| `do` | `DO` label/routine call. |
| `$$` | Extrinsic function call. |
| `for` | Basic `FOR` loop with a dot block. |
| `order` | `$ORDER` loop over a global/local array. |
| `new` | `NEW` local variables. |
| `sglobal` | `SET` a global node. |
| `write` | `WRITE` a line. |
| `rpc` | VistA-style RPC entry point skeleton. |
| `fda` | FileMan FDA update skeleton. |

## Roadmap overview

- **Stage 3:** document symbols, Go to Label, Go to Routine, workspace symbols.
- **Stage 4:** hover documentation, completion, signature help, command reference.
- **Stage 5:** parser-backed references, dependency analyzer, code metrics.
- **Stage 6:** GT.M/YottaDB runtime research, MDEBUG/debugger integration, Docker/Remote SSH guidance.
- **Stage 7:** VistA RPC explorer, FileMan dictionary helper, global explorer, routine upload/download.
- **Stage 8:** marketplace packaging, screenshots, release notes, and publication readiness.

## License and old extension reuse policy

This extension is implemented cleanly under `Src/`. Old extensions in the repository were analyzed for feature planning. Source code was not copied into Stage 0/1 or Stage 2. Future reuse must document source, license, attribution, and rationale before merging.

## Development

```bash
npm install
npm run compile
npm run test:stage2
```

Open this folder in VS Code and launch an Extension Development Host to test highlighting, snippets, formatting, and diagnostics manually.
