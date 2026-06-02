# Signature Help

## Overview

MForge Stage 4 adds signature help for frequently used MUMPS intrinsic functions. Signature help appears after `(` and updates active parameters after commas.

## Examples

- `$P(` shows `$PIECE(string,delimiter,piece)` with parameter descriptions.
- `$G(` shows `$GET(variable,default)`.
- `$NA(` shows `$NAME(variable,subscriptLevel)`.

Supported Stage 4 signatures: `$P`, `$G`, `$O`, `$D`, `$L`, `$E`, `$F`, and `$NA`.

## Configuration

```jsonc
{
  "mforge.signatureHelp.enabled": true
}
```

Disable the setting and reload the extension host to turn signature help registration off.

## Troubleshooting

- Confirm the file language mode is `mumps`.
- Confirm `mforge.signatureHelp.enabled` is `true`.
- Signature help is triggered by `(` and `,`; use **Trigger Parameter Hints** from VS Code if the popup was dismissed.

## Limitations

- Only Stage 4 intrinsic functions are covered.
- Runtime-specific overloads are represented conservatively.
- Signature help does not evaluate expressions or validate argument values.
