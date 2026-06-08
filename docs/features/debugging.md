# Debugging and MDEBUG

MForge contributes a VS Code debug type named `mumps` and packages the legacy `MDEBUG.m` helper routine for sites that use MDEBUG workflows.

## Launch and Attach

Use VS Code's Run and Debug view to create a `mumps` launch or attach configuration. Launch configurations include `program`, `localRoutinesPath`, and `stopOnEntry`. Attach configurations include `hostname`, `port`, `localRoutinesPath`, and `stopOnEntry`.

## Direct Debug Commands

When an active `mumps` debug session exists, MForge direct debug commands send `mumps.rawCommand` requests for common GT.M/YottaDB debug commands:

- `ZSTEP`
- `ZSTEP INTO`
- `ZSTEP OUTOF`
- `ZCONTINUE`
- `ZWRITE`
- `ZSHOW`
- `ZBREAK`
- `ZPRINT @$ZPOSITION`
- `WRITE $ZPOSITION`
- raw user-entered commands

If no active `mumps` session exists, commands fail safely with a warning and output-channel message.

## Status

MForge 0.6.1 preserves the useful editor-facing MDEBUG command surface. Full live MDEBUG TCP connector hardening remains an explicit follow-up runtime task.
