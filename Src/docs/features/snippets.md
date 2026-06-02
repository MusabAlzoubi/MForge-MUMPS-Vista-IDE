# Snippets

## Overview

MForge provides native VS Code snippets for common MUMPS, VistA, and FileMan editing patterns. Snippets are original MForge content and do not copy old extension templates.

## Usage instructions

1. Open a MUMPS file.
2. Type a snippet prefix, such as `routine`, `label`, or `order`.
3. Accept the suggestion with Tab or Enter.
4. Use Tab to move through placeholders.

## Available snippets

| Prefix | Inserts |
| --- | --- |
| `routine` | Routine header with author/date comments and final `QUIT`. |
| `label` | Label entry point with parameters, `NEW`, body placeholder, and `QUIT`. |
| `do` | `DO` call to a label or routine. |
| `$$` | Extrinsic function call. |
| `for` | Numeric `FOR` loop with a dot block. |
| `order` | `$ORDER` loop skeleton. |
| `new` | `NEW` variable list. |
| `sglobal` | `SET` a global node. |
| `write` | `WRITE` text followed by a newline. |
| `rpc` | VistA-style RPC entry point skeleton. |
| `fda` | FileMan FDA update skeleton. |

## Examples

Typing `order` expands to:

```mumps
S SUB=""
F  S SUB=$O(^GLOBAL(SUB)) Q:SUB=""  D
 . W SUB,!
```

Typing `rpc` expands to:

```mumps
RPC(RESULT,PARAMS) ; RPC description
 N ERR
 S RESULT=$$BUILD(PARAMS)
 Q
```

## Configuration options

Snippets use VS Code's standard snippet settings. To disable snippets globally, configure VS Code's `editor.snippetSuggestions` setting.

## Troubleshooting

- **Snippets do not appear:** Confirm the file language mode is `mumps`.
- **A prefix conflicts with another extension:** Use **Insert Snippet** from the Command Palette and choose the MForge snippet explicitly.
- **Snippet style differs from local standards:** Treat Stage 1 snippets as starter templates. Project-specific snippets can be added in workspace `.vscode` settings.
