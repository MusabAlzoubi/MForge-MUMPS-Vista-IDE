# MForge-MUMPS-Vista-IDE

## MForge 0.7.0 — Routine Catalog Performance Release

MForge MUMPS & VistA IDE is a modern VS Code IDE toolkit for MUMPS, GT.M/YottaDB, InterSystems-style M code, and VistA/Hakeem development.

The 0.7.0 pre-release performance release replaces eager full-project label indexing with a fast routine catalog plus lazy label parsing. It keeps Hakeem paths focused on `localr` then `routines`, avoids activation-time parsing of hundreds of thousands of labels, and should not be published until manual 0.7.0 Hakeem verification is complete.

See `Src/README.md` for the Marketplace README and feature guide.
