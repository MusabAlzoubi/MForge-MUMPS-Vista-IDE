# Completion

## Overview

MForge Stage 4 adds completion suggestions for MUMPS commands, intrinsic functions, system variables, labels in the current document, labels from the workspace routine index, and routine names from the workspace routine index.

## Examples

- Type `S` or request completion to insert `SET`.
- Type `$` and request completion to insert `$P`, `$G`, `$O`, `$D`, `$L`, `$E`, `$F`, or `$NA`.
- Use label completions such as `BUILD` for labels in the active routine.
- Use workspace completions such as `EN^XUP` or `XUP` when routines are indexed.

## Configuration

```jsonc
{
  "mforge.completion.enabled": true,
  "mforge.maxWorkspaceFiles": 2000
}
```

`mforge.maxWorkspaceFiles` limits how many supported routine files are scanned for workspace label and routine completions.

## Troubleshooting

- Confirm the file language mode is `mumps`.
- Confirm `mforge.completion.enabled` is `true`.
- Save or create supported routine files with `.m`, `.M`, `.mumps`, `.mps`, `.rou`, or `.int` extensions so the index can see them.
- Increase `mforge.maxWorkspaceFiles` if a large workspace omits expected routines.

## Limitations

- Completion is static and conservative.
- Workspace completion excludes `node_modules`, `.git`, `dist`, `out`, and `Old Extensions`.
- Runtime globals, FileMan metadata, RPCs, and debugger symbols are not included in Stage 4.
