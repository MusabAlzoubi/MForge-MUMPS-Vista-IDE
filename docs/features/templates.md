# Templates

MForge provides two legacy-compatible VistA/UJO templates.

## Routine Header Template

Run **MForge: Insert Routine Header Template** in a MUMPS file. MForge prompts for namespace, author initials, and description, then inserts an EHS/VistA-style header at the top of the file.

## Patch Change Block Template

Run **MForge: Insert Patch Change Block Template** in a MUMPS file. MForge prompts for patch, author, fix type, reason, and optional scope, then inserts a patch start/end marker block at the cursor.

## Compatibility

The MForge command IDs are the preferred public commands. Legacy aliases (`mumps.insertRoutineHeaderTemplate` and `mumps.insertPatchChangeBlockTemplate`) remain registered for compatibility.
