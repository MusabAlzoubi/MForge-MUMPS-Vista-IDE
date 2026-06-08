# MForge Dark Theme

MForge Dark is the recommended theme for MForge MUMPS & VistA IDE. It is a professional dark theme tuned for MUMPS, GT.M/YottaDB, InterSystems-style M code, and VistA/Hakeem routines.

## Palette

| Token | Color | Style |
| --- | --- | --- |
| Background | `#1E1E1E` | Dark editor background |
| Foreground | `#D4D4D4` | Main editor text |
| Labels | `#FFD166` | Bold |
| Commands | `#61AFEF` | Bold |
| Intrinsics | `#C678DD` | Normal |
| System variables | `#E06C75` | Normal |
| Globals | `#56B6C2` | Normal |
| Local variables | `#E5C07B` | Normal |
| Parameters | `#98C379` | Normal |
| Strings | `#CE9178` | Normal |
| Comments | `#6A9955` | Italic |
| Numbers | `#B5CEA8` | Normal |
| FileMan/VistA APIs | `#4EC9B0` | Bold |
| Navigable routine references | `#F5D76E` | Underline |
| Unresolved routine references | `#C586C0` | Italic |
| Debug/MDEBUG scopes | `#D19A66` | Bold |

## Semantic Token Clarity

MForge contributes semantic token types for labels, commands, intrinsics, globals, system variables, parameters, local variables, FileMan/VistA APIs, navigable routine references, and unresolved routine references. The theme keeps `GET1^DIQ`/`FILE^DIE` FileMan APIs visually separate from normal intrinsics, and underlines navigable routine references so they look like links rather than documentation tokens.

## Usage

1. Open **Preferences: Color Theme**.
2. Select **MForge Dark**.
3. Open a `.m`, `.M`, `.rou`, `.int`, `.mps`, or `.mumps` file.
4. Run **MForge: Rebuild Routine Index** if routine references are not yet classified as navigable.
