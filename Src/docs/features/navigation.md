# Stage 3 Navigation

## Overview

Stage 3 adds lightweight navigation for MUMPS routines in MForge. The feature is intentionally conservative: it indexes routine files by filename, extracts top-level labels, and resolves common local and cross-routine call patterns without adding hover, completion, signature help, debugger, runtime, RPC explorer, FileMan explorer, or global explorer features.

## Document Symbols usage

Open any file with language id `mumps`, then use the VS Code **Outline** view or run **Go to Symbol in Editor**. MForge shows routine labels as function symbols, including labels with parameters such as:

```mumps
START
EN(X,Y)
BUILD(DATA)
```

Labels inside comments and strings are ignored. Symbol ranges stay on the label text so Outline and editor navigation land on the label definition.

## Go To Label usage

Place the cursor on a local label reference and press `F12`, run **Go to Definition**, or use the context menu. MForge resolves local references in the current file, including:

```mumps
D BUILD
G EXIT
S X=$$VALUE()
```

## Go To Routine usage

MForge builds a lightweight workspace routine index for supported routine files and resolves cross-routine references such as:

```mumps
D EN^XUP
S X=$$VALUE^ROUTINEB()
```

A reference to `^ROUTINE` opens the routine file. A reference to `LABEL^ROUTINE` opens that label inside the routine when both are present in the workspace index.

## Workspace Symbols usage

Run **Go to Symbol in Workspace** and search for routine names, label names, or qualified labels. Results include:

- routine names, for example `XUP`
- qualified labels, for example `EN^XUP`
- label signatures where useful, for example `EN(X,Y)`

## Supported reference patterns

Stage 3 recognizes common static references outside comments and strings:

| Pattern | Example | Result |
| --- | --- | --- |
| Local `DO` | `D BUILD` | Local `BUILD` label. |
| Local `GOTO` | `G EXIT` | Local `EXIT` label. |
| Local extrinsic | `$$VALUE()` | Local `VALUE` label. |
| Routine reference | `^XUP` | `XUP` routine file. |
| Cross-routine label | `D EN^XUP` | `EN` label in `XUP`. |
| Cross-routine extrinsic | `$$VALUE^ROUTINEB()` | `VALUE` label in `ROUTINEB`. |

## Configuration

| Setting | Default | Description |
| --- | --- | --- |
| `mforge.navigation.enabled` | `true` | Enables Document Symbols, Go to Definition, routine indexing, and Workspace Symbols. |
| `mforge.maxWorkspaceFiles` | `2000` | Maximum supported routine files to scan for the workspace index. |

The index scans `.m`, `.M`, `.mumps`, `.mps`, `.rou`, and `.int` files. It skips `node_modules`, `.git`, `dist`, `out`, and `Old Extensions` by default.

## Examples

```mumps
START ; entry
 D BUILD
 D EN^XUP
 S X=$$VALUE()
 S Y=$$VALUE^ROUTINEB()
 G EXIT
 Q
BUILD(DATA)
 Q
VALUE()
 Q 1
EXIT
 Q
```

- `F12` on `BUILD` resolves to `BUILD(DATA)` in the same file.
- `F12` on `EN^XUP` resolves to `EN` in `XUP.m` when that routine is in the workspace.
- `F12` on `VALUE^ROUTINEB` resolves to `VALUE` in `ROUTINEB.m`.

## Limitations

- Dynamic indirection such as `D @TARGET` is not resolved.
- Routine names are based on filenames without extensions.
- Only static label/routine references are indexed.
- The workspace index is lightweight and intentionally avoids deep semantic analysis.
- Hover, completion, signature help, debugging, runtime integration, and VistA explorers remain future stages.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| No Outline labels appear | Confirm the file language mode is `MForge MUMPS` / `mumps` and `mforge.navigation.enabled` is `true`. |
| `F12` does nothing | Confirm the reference is one of the supported static patterns and is not inside a comment or string. |
| Cross-routine navigation fails | Open the folder containing the routine file and ensure the file extension is supported. |
| Large workspace feels slow | Lower `mforge.maxWorkspaceFiles` or narrow the opened workspace folder. |
| Legacy files appear unexpectedly | Move reference-only legacy files under `Old Extensions`, `node_modules`, `.git`, `dist`, or `out`, which are ignored by default. |
