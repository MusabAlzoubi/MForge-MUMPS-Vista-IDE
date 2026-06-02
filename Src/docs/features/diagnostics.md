# Diagnostics

## Overview

MForge Stage 2 adds lightweight diagnostics for common MUMPS editing mistakes. Diagnostics are parser-assisted but intentionally conservative; they are designed to catch obvious issues without requiring a full language server.

Diagnostics update when MUMPS documents are opened, changed, saved, and closed. Diagnostics are cleared when a document is closed.

## Current diagnostic rules

| Rule | Code | Severity | Description |
| --- | --- | --- | --- |
| Unterminated string | `mforge.unterminatedString` | Warning | Detects a string that starts with `"` but does not close before the comment boundary or line end. |
| Suspicious unknown command token | `mforge.unknownCommand` | Warning | Warns on command-position tokens that are not recognized MUMPS commands or Z-commands. |
| Invalid label format | `mforge.invalidLabel` | Warning | Warns when a non-indented line starts with a token that does not match the basic MUMPS label pattern. |
| Unbalanced parentheses | `mforge.unbalancedParentheses` | Warning | Warns when a line has more opening than closing parentheses, or vice versa, outside strings. |
| Trailing whitespace | `mforge.trailingWhitespace` | Information | Marks trailing spaces or tabs that the formatter can remove safely. |

## Severity levels

- **Warning:** Likely edit issue that should be reviewed.
- **Information:** Low-risk cleanup suggestion.

## Examples

Unterminated string:

```mumps
 S X="missing end
```

Invalid label:

```mumps
1BAD S X=1
```

Unbalanced parentheses:

```mumps
 S X=$G(^DPT(1,0)
```

Trailing whitespace is highlighted at the end of a line and can be removed with **Format Document**.

## Configuration

| Setting | Default | Description |
| --- | --- | --- |
| `mforge.diagnostics.enabled` | `true` | Enables or disables Stage 2 diagnostics. |

To disable diagnostics:

```jsonc
{
  "mforge.diagnostics.enabled": false
}
```

## Limitations

- Diagnostics are line-based and do not yet understand the full MUMPS grammar.
- Unknown-command detection is intentionally conservative but may still flag unusual vendor-specific command positions.
- Parenthesis balance is checked per line, not across multiline constructs.
- Diagnostics avoid comments and strings where possible but are not a substitute for runtime validation.

## Troubleshooting

- **No diagnostics appear:** Confirm the file language mode is `mumps` and `mforge.diagnostics.enabled` is `true`.
- **A warning appears inside unusual syntax:** Add a small fixture and disable diagnostics temporarily if needed.
- **Trailing whitespace keeps returning:** Check editor settings or workspace tooling that may add spaces on save.
