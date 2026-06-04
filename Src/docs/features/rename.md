# Rename Symbol

Rename Symbol is deferred beyond Stage 5.1.

Planned safe rename support will be limited to local labels and same-document local variables first. Cross-routine global label rename, globals, dynamic indirection, and runtime-dependent names will remain blocked until MForge has stronger semantic safety checks.

Planned setting:

| Setting | Default | Purpose |
| --- | --- | --- |
| `mforge.rename.enabled` | `true` | Enables safe static rename once implemented. |
