# Syntax Highlighting

## Overview

MForge registers an original TextMate grammar for MUMPS source files. The Stage 1 grammar is intentionally conservative and line-oriented. It is designed to make common MUMPS and VistA code readable while leaving deeper semantic analysis to future parser-backed stages.

## Usage instructions

1. Open a file with one of the supported extensions: `.m`, `.M`, `.mumps`, `.mps`, `.rou`, or `.int`.
2. VS Code should automatically select the `mumps` language.
3. If it does not, choose **Change Language Mode** and select **MUMPS** or **MForge MUMPS**.

## Highlighted constructs

- Labels at the start of a line.
- Label parameters.
- Standard MUMPS commands and Z-commands.
- Intrinsic functions such as `$PIECE`, `$ORDER`, `$GET`, and `$DATA`.
- System variables such as `$HOROLOG`, `$JOB`, `$ZPOSITION`, and `$ZTRAP`.
- Globals such as `^DIC`, `^TMP($J)`, and `^XTMP`.
- Strings, escaped double quotes, numeric literals, comments, operators, and postconditionals.

## Examples

```mumps
START ; Entry point
 N IEN,NAME
 S IEN=1
 S NAME=$P($G(^DPT(IEN,0)),"^",1)
 I NAME'="" W NAME,!
 Q
```

## Configuration options

Stage 1 syntax highlighting has no MForge-specific settings. Standard VS Code theme and token color customization settings apply.

## Troubleshooting

- **File opens as another language:** Use **Change Language Mode** and choose `MUMPS`; check that the file extension is one of the supported extensions.
- **Highlighting looks theme-dependent:** Use **Developer: Inspect Editor Tokens and Scopes** to inspect scopes and adjust theme token colors.
- **Complex syntax is not highlighted perfectly:** Stage 1 uses a regular-expression grammar. Parser-backed semantic support is planned for later stages.
