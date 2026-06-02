# Hover

## Overview

MForge Stage 4 adds hover help for common MUMPS commands, intrinsic functions, and system variables. Hover text expands abbreviations, gives a concise description, and shows syntax plus an example when applicable.

## Examples

- Hover `S` or `SET` to see SET command help and `SET X=1`.
- Hover `$O` to see `$ORDER`, its purpose, and `$ORDER(variable)` syntax.
- Hover `$JOB`, `$HOROLOG`, `$IO`, `$TEST`, or other supported system variables for runtime meaning.

## Configuration

```jsonc
{
  "mforge.hover.enabled": true
}
```

Disable the setting and reload the extension host to turn Stage 4 hover registration off.

## Troubleshooting

- Confirm the file language mode is **MForge MUMPS** / `mumps`.
- Confirm `mforge.hover.enabled` is `true`.
- Run `npm run compile` after source changes before testing in an Extension Development Host.
- Hover is static documentation; it does not require GT.M, YottaDB, or a VistA connection.

## Limitations

- Hover coverage is intentionally limited to Stage 4 commands, intrinsics, and system variables.
- Implementation-specific behavior may vary between MUMPS runtimes.
- Dynamic indirection and runtime state are not evaluated.
