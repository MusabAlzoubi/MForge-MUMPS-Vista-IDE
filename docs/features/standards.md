# VistA/UJO Standards Diagnostics

MForge 0.6.1 includes optional VistA/UJO standards diagnostics ported from the legacy debugger and integrated with the current diagnostics pipeline.

## Enabling Standards Checks

Standards checks are optional. Set `mforge.standards.profile` to `vista`, `ujo`, or `custom` to enable them. Most users can leave this off until a project asks for those conventions.

## Checks

- Routine header metadata separator (`;;`) checks.
- Namespace prefix checks through `mforge.standards.namespacePrefixes`.
- VistA entry point label length warnings when labels exceed 8 characters.
- Local variable naming checks for names longer than 16 characters or containing lowercase letters.
- `^TMP` scoping checks that prefer `$J` or package namespace plus `$J`.
- `^%` global protection warnings for READ/KILL/SET/MERGE operations.

## Commands and Workflow

Use normal VS Code Problems output to review standards diagnostics. If a routine tree is not indexed, run **MForge: Show Navigation Diagnostics** first; standards diagnostics themselves run on open MUMPS documents.
