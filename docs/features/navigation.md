# Navigation

MForge navigation supports Ctrl+Click, F12 Go To Definition, Peek Definition, document links, Document Symbols, Workspace Symbols, and Shift+F12 Find References for common MUMPS and VistA routine patterns.

## Routine Indexing Defaults

MForge auto-detects routine folders and prefers focused source folders over broad project roots. In common Hakeem layouts, `localr` is preferred before `routines`, so local overrides win when duplicate routine names exist. Manual `mforge.routineSearchPaths` entries are optional; auto-detected effective paths are used internally even when the setting remains `[]`.

## Commands

- **MForge: Rebuild Routine Index** rebuilds configured and auto-detected routine paths.
- **MForge: Show Routine Index Status** shows routine count, label count, limits, effective paths, and key routine status.
- **MForge: Show Navigation Diagnostics** shows build time, cache hits/misses, duplicates removed, source folders, and localr/routines counts.
- **MForge: Apply Recommended Hakeem Settings** applies focused `/var/worldvista/prod/hakeem/localr` and `/var/worldvista/prod/hakeem/routines` paths.

## Performance Notes

Normal output is intentionally concise and never dumps thousands of duplicate routine names. Detailed duplicate information is reserved for `mforge.trace.level = debug`. If indexing is slow, prefer focused `localr` and `routines` folders or run **MForge: Apply Recommended Hakeem Settings**.

MForge currently uses cached routine indexing with incremental file metadata reuse. A fuller lazy routine catalog that defers label parsing for very large trees remains the next required performance task and is documented as future work rather than claimed complete.
