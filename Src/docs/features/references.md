# Find References

Stage 5.1 adds a dedicated MForge Find References provider registered with `vscode.languages.registerReferenceProvider`.

## Supported targets

- Local labels in the active routine, including the declaration, `DO`, `GOTO`, and local `$$LABEL()` extrinsic calls.
- Cross-routine `LABEL^ROUTINE` references across the cached routine index, including no-parentheses extrinsics such as `X=$$ACCEPT^UJOWXUS`.
- FileMan/VistA APIs including `GET1^DIQ`, `FILE^DIE`, `UPDATE^DIE`, `FIND1^DIC`, `GET^XPAR`, and `UP^XLFSTR` when the target routine is indexed.
- Local variables in the active document only, including `NEW`, `SET`, and usage tokens.

## Safety and performance

- References ignore strings and comments.
- Dynamic indirection such as `D @TARGET` is intentionally not resolved.
- Local variable references do not cross routine or document boundaries yet.
- Cross-routine searches use the existing cached routine index and VS Code filesystem APIs for `file:` and `vscode-remote:` URIs.
- `objects`, `localo`, generated build output, old extension folders, and other ignored folders are not indexed.
- `mforge.maxWorkspaceFiles` limits routine indexing, and `mforge.references.maxResults` limits returned reference locations.

## Settings

| Setting | Default | Purpose |
| --- | --- | --- |
| `mforge.references.enabled` | `true` | Enables or disables Stage 5.1 Find References. |
| `mforge.references.includeDeclarations` | `true` | Allows declaration locations or routine-top fallback locations when VS Code requests declarations. |
| `mforge.references.maxResults` | `5000` | Caps returned reference locations. |

## Troubleshooting

If cross-routine references are missing, run **MForge: Rebuild Routine Index**, check **MForge: Show Routine Index Status**, and add missing VistA routine folders to `mforge.routineSearchPaths`.

## Index reliability guidance

For large Hakeem/WorldVistA trees, keep `mforge.indexExtensionlessRoutines` disabled when `.m` files exist and configure only routine source folders such as `/var/worldvista/prod/hakeem/routines` and `/var/worldvista/prod/hakeem/localr`. Never configure `/var/worldvista/prod/hakeem`; MForge 0.6.3 ignores that broad Hakeem root and logs `Ignored broad Hakeem root path. Use localr and routines instead.` If Shift+F12 reports that a routine is not indexed, run **MForge: Show Routine Index Status**, remove broad paths, and run **MForge: Rebuild Routine Index**.
