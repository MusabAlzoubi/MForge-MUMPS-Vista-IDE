# MForge Extension Architecture

MForge is built as a clean TypeScript VS Code extension under `Src/`. Legacy extensions are feature references only; the MForge implementation should remain modular, documented, and testable.

## Target structure

```text
Src/
  package.json
  README.md
  CHANGELOG.md
  LICENSE
  icon.png
  syntaxes/
    mumps.tmLanguage.json
  snippets/
    mumps.json
  language-configuration.json
  src/
    extension.ts
    features/
      formatter/
      symbols/
      hover/
      completion/
      diagnostics/
      navigation/
      explorer/
      debugger/
      vista/
    utils/
    parser/
    config/
    logging/
  docs/
    features/
      syntax-highlighting.md
      snippets.md
      formatter.md
      navigation.md
      hover.md
      diagnostics.md
      debugger.md
      vista-tools.md
```

Stage 0/1 creates the minimal scaffold and implemented static language contributions. Later stages add provider folders as features are implemented.

## Main extension activation flow

1. VS Code activates on `onLanguage:mumps` and selected MForge commands.
2. `activate(context)` creates a shared output channel and logs startup metadata.
3. Static language contributions are loaded by VS Code from `package.json`, `language-configuration.json`, grammar, and snippets.
4. Runtime providers are registered through feature modules as they become available.
5. Disposables are pushed into `context.subscriptions`.
6. `deactivate()` performs any cleanup for language servers, debug sessions, or runtime connections.

## Feature registration pattern

Each feature module should expose a narrow registration function:

```ts
export function registerHoverFeature(context: vscode.ExtensionContext, services: MForgeServices): void;
```

The `MForgeServices` object should hold shared logging, configuration, parser, and indexing services. Feature modules must not directly own unrelated global state.

## Configuration settings

Initial settings are limited to safe editor defaults and feature flags. Planned settings include:

- `mforge.trace.level`: `off`, `info`, or `debug`.
- `mforge.formatter.enabled`: enables the formatter once implemented.
- `mforge.diagnostics.enabled`: enables diagnostic rules once implemented.
- `mforge.runtime.type`: `none`, `gtm`, `yottadb`, `cache`, or `iris`.
- `mforge.vista.enabled`: enables VistA-specific commands/views.
- `mforge.maxWorkspaceFiles`: safety limit for workspace indexing.

## Logging strategy

- Use one output channel named `MForge MUMPS & VistA IDE`.
- Log activation, feature registration, runtime detection, errors, and long-running analysis summaries.
- Keep default logging quiet; verbose traces require opt-in configuration.
- Never log patient data, global values, credentials, or connection strings.

## Error handling strategy

- Provider failures should be caught at feature boundaries and logged without breaking the extension host.
- User-facing errors should be actionable and avoid exposing sensitive data.
- Runtime/VistA features must be read-only by default and guarded by confirmations for write operations.
- Parser failures should degrade gracefully to line-based heuristics.

## Parser strategy

MForge should evolve through three parser layers:

1. **Stage 1 static grammar:** TextMate grammar for highlighting only.
2. **Stage 2/3 lightweight parser:** TypeScript line/routine parser for labels, commands, globals, strings, comments, and references.
3. **Stage 3+ language server/parser service:** Shared analyzer for diagnostics, navigation, dependency graphs, and metrics. Tree-sitter or an original grammar can be evaluated, but license and packaging obligations must be documented.

## Testing strategy

- `npm run compile` for TypeScript compilation.
- JSON validation for `package.json`, grammar, snippets, and language configuration.
- Unit tests for parser/provider modules when they are added.
- Workspace fixture tests for labels, routines, references, symbols, and diagnostics.
- Manual VS Code Extension Development Host smoke tests for syntax, snippets, and activation.
- Runtime/debugger tests are separated from static language tests and use mocks where possible.
