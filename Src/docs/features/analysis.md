# Routine Analysis

Routine Dependency Analyzer and Code Metrics are deferred beyond Stage 5.1.

Planned commands:

| Command | Command ID | Status |
| --- | --- | --- |
| `MForge: Analyze Routine Dependencies` | `mforge.analyzeRoutineDependencies` | Deferred |
| `MForge: Show Routine Metrics` | `mforge.showRoutineMetrics` | Deferred |

Planned dependency analysis will list external routines and same-routine labels called by the active routine. Planned metrics include total lines, executable lines, comments, labels, local variables, globals, routine references, external dependency count, intrinsic usage, command usage, and an approximate complexity score.

The current Stage 5.1 scanner and routine-index integration are designed so these future features can reuse the same string/comment-safe reference extraction.
