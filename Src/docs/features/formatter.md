# Formatter

## Overview

MForge Stage 2 adds a conservative document formatter for MUMPS files. The formatter is intentionally small and safe: it removes trailing whitespace, keeps labels at column 1, preserves comments, preserves dot-block structure, and only normalizes command-area spacing when doing so is unlikely to alter semantics.

## Usage instructions

1. Open a file whose language mode is `mumps`.
2. Run **Format Document** from the Command Palette or use the default VS Code formatting shortcut.
3. Review the edits before saving, especially in routines with unusual vendor-specific syntax.

## Examples before/after

Before:

```mumps
START ; comment is preserved
 S X="hello"  
 . W X,!   
```

After:

```mumps
START ; comment is preserved
 S X="hello"
 . W X,!
```

Labels remain at column 1:

```mumps
ENTRY(ARG) S X=ARG
```

Dot-block lines keep their leading dots:

```mumps
 . W "nested",!
```

## Configuration

| Setting | Default | Description |
| --- | --- | --- |
| `mforge.formatter.enabled` | `true` | Enables or disables the MForge document formatter. |

To disable formatting:

```jsonc
{
  "mforge.formatter.enabled": false
}
```

## Limitations

- The formatter is not a full MUMPS pretty-printer.
- It does not reorder commands or expand abbreviations.
- It does not format across multiple lines.
- It avoids changing comments and string contents.
- Advanced style profiles are planned for later stages.

## Troubleshooting

- **Format Document does nothing:** Confirm the file language mode is `mumps` and `mforge.formatter.enabled` is `true`.
- **Spacing is not fully normalized:** This is expected. Stage 2 prioritizes preserving semantics over aggressive formatting.
- **A line uses vendor-specific syntax:** Review formatted output and report a fixture so the safe formatter can be improved.
