# MForge-MUMPS-Vista-IDE

## Version 0.6.0 — Legacy Debugger Feature Parity

MForge 0.6.0 completes the feature-by-feature audit of `Old Extensions/mumps-debugger---upgrade` and ports the useful missing pieces into the current MForge architecture. MForge now includes the legacy routine header and patch change block templates, VistA/UJO standards diagnostics, MDEBUG launch/attach contribution, MDEBUG direct debug controls (`ZSTEP`, `ZWRITE`, `ZSHOW`, `ZBREAK`, `ZPRINT`, `$ZPOSITION`, raw commands, setup, and smoke test), debugger settings, and automated parity tests while retaining existing highlighting, semantic tokens, navigation, references, hover, completion, signature help, snippets, packaging, and routine indexing.

See `Src/README.md` and `docs/features/legacy-debugger-audit.md` for the comparison table, ported feature list, deferred items, and superset rationale.
