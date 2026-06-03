# MForge Professional Syntax Theme

## Overview

MForge Stage 4.5 adds the **MForge Dark** color theme and semantic highlighting for MUMPS source. The theme is designed to improve visual hierarchy while remaining compatible with standard VS Code theme behavior: TextMate scopes provide broad compatibility, and semantic tokens provide MUMPS-aware precision when semantic highlighting is enabled.

## Examples

Use this sample routine to preview the hierarchy:

```mumps
EN(DFN,OUT) ; Professional MForge highlighting preview
 N FDA,ERR
 S FDA(9000010,"+1,",.01)=DFN
 D UPDATE^DIE("","FDA","","ERR")
 S NEXT=$O(^TMP($J,NEXT))
 D EN^XUP
 W "Done",!,42
 Q
```

Expected visual roles in **MForge Dark**:

- Labels use warm yellow (`#F5D76E`).
- Commands use blue (`#61AFEF`).
- Intrinsics use purple (`#B678DD`) and are not underlined.
- Globals use cyan (`#56B6C2`).
- System variables use bright blue (`#4FC1FF`).
- FileMan APIs such as `UPDATE^DIE`, `FILE^DIE`, `FIND1^DIC`, `GETS^DIQ`, and `GET1^DIQ` use a function-style yellow (`#DCDCAA`).
- Navigable routine references such as `EN^XUP` use gold (`#E5C07B`) with underline.
- Unresolved routine references use purple (`#C586C0`) with italic styling when semantic data can distinguish them.

## Configuration

Select the theme from **Preferences: Color Theme** and choose **MForge Dark**.

Semantic highlighting is enabled by default:

```jsonc
{
  "editor.semanticHighlighting.enabled": true,
  "mforge.semanticHighlighting.enabled": true
}
```

## Troubleshooting

- Confirm the file language mode is `mumps`.
- Confirm **MForge Dark** is selected if you want the exact MForge palette.
- Confirm `editor.semanticHighlighting.enabled` and `mforge.semanticHighlighting.enabled` are `true` for semantic color precision.
- Run `npm run compile` before testing provider changes in the Extension Development Host.

## Limitations

- Semantic highlighting is static and does not evaluate runtime indirection.
- API highlighting intentionally covers common FileMan APIs only in Stage 4.5/4.6.
- Other VS Code themes may override TextMate or semantic colors differently, but the scopes and tokens remain available for customization.
