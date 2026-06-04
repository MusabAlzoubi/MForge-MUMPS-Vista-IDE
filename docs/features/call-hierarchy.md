# Call Hierarchy

Call Hierarchy is deferred beyond Stage 5.1.

The planned implementation will use the routine index and reference scanner to show incoming calls to `LABEL^ROUTINE` targets and outgoing calls from a routine label body. Results will be capped for performance and will not resolve dynamic indirection.

Planned setting:

| Setting | Default | Purpose |
| --- | --- | --- |
| `mforge.callHierarchy.enabled` | `true` | Enables static call hierarchy once implemented. |
| `mforge.callHierarchy.maxResults` | `2000` | Caps call hierarchy results once implemented. |
