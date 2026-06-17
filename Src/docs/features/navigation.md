# Navigation

MForge navigation supports Ctrl+Click, F12 Go To Definition, Peek Definition, document links, Document Symbols, Workspace Symbols, and Shift+F12 Find References for common MUMPS and VistA routine patterns.

## Routine Catalog Defaults

MForge uses a fast VistA-style routine catalog for large Hakeem/WorldVistA trees. Rebuild and activation scan effective routine folders for filenames only and store routine name, URI, source priority, and mtime. They do not read every routine body and do not parse the full label set during catalog build.

MForge auto-detects routine folders and prefers focused source folders over broad project roots. In common Hakeem layouts, `localr` is preferred before `routines`, so local overrides win when duplicate routine names exist. Manual `mforge.routineSearchPaths` entries are optional; auto-detected effective paths are used internally even when the setting remains `[]`.

Labels are parsed lazily: when Ctrl+Click/F12 targets `GET^XPAR`, `UP^XLFSTR`, `FILE^DIE`, `GET1^DIQ`, `FMADD^XLFDT`, or `ACCEPT^UJOWXUS`, MForge reads only that target routine, caches its labels by mtime, and reuses the cached labels until the file changes.

## Commands

- **MForge: Rebuild Routine Index** rebuilds the routine catalog from configured and auto-detected routine paths.
- **MForge: Show Routine Index Status** shows catalog routine count, parsed-label cache counts, limits, effective paths, and key routine catalog status.
- **MForge: Show Navigation Diagnostics** shows catalog routine count, parsed routine cache count, parsed labels cached, catalog build time, lazy parse count/average time, duplicates removed, source folders, and localr/routines counts.
- **MForge: Repair Hakeem Routine Settings** applies focused `/var/worldvista/prod/hakeem/localr` and `/var/worldvista/prod/hakeem/routines` paths.

## Performance Notes

Normal output is intentionally concise and never dumps thousands of duplicate routine names. Detailed duplicate information is reserved for `mforge.trace.level = debug`. If indexing is slow, prefer focused `localr` and `routines` folders or run **MForge: Repair Hakeem Routine Settings**.

A healthy Hakeem rebuild should show many catalog routines but few or zero parsed labels immediately after rebuild, except labels from already-open routines or labels resolved by recent navigation.
