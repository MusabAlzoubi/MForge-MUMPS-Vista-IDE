# MForge MUMPS & VistA IDE

**Current release stage:** Stage 2 — Editing Productivity  
**Extension version:** `0.2.0`  
**Recommended release tag:** `v0.2.0-stage2`

MForge MUMPS & VistA IDE is a Visual Studio Code extension for MUMPS and VistA development. The current Stage 2 release includes the Stage 0/1 language foundation plus conservative editing-productivity features: formatting, parser-assisted indentation, and basic diagnostics.

Advanced navigation, hover/completion, debugger integration, runtime integration, and VistA tools are intentionally **not implemented yet**. Those remain future roadmap stages.

## What is included in Stage 2?

### Stage 0: Extension setup

- VS Code extension scaffold under `Src/`.
- Extension identity:
  - Display Name: **MForge MUMPS & VistA IDE**
  - Name: `mforge-mumps-vista-ide`
  - Publisher: `dopamind`
- TypeScript activation scaffold.
- Extension icon reference.
- README, CHANGELOG, LICENSE, TODO, and roadmap docs.

### Stage 1: Core language support

- MUMPS language registration for:
  - `.m`
  - `.M`
  - `.mumps`
  - `.mps`
  - `.rou`
  - `.int`
- Syntax highlighting for common MUMPS constructs:
  - labels and label parameters
  - commands and Z-commands
  - intrinsic functions
  - system variables
  - globals and indirection
  - strings, numbers, comments, operators, and postconditionals
- Language configuration:
  - semicolon line comments
  - bracket and quote auto-closing pairs
  - MUMPS-aware word pattern
  - one-space editor default for dot-block-oriented code
- Native snippets for routine headers, labels, DO calls, extrinsic calls, loops, globals, VistA RPC skeletons, and FileMan FDA skeletons.

### Stage 2: Editing productivity

- Conservative document formatter.
- Parser-assisted on-type indentation for dot-block workflows.
- Lightweight MUMPS line parser for editor features.
- Basic diagnostics for common editing mistakes.
- Stage 2 fixture checks through `npm run test:stage2`.

## Supported file extensions

MForge registers the `mumps` language for:

| Extension | Notes |
| --- | --- |
| `.m` | Common MUMPS routine extension. |
| `.M` | Uppercase routine extension for case-sensitive filesystems. |
| `.mumps` | Explicit MUMPS source extension. |
| `.mps` | Legacy/common MUMPS source extension. |
| `.rou` | Routine file extension used by some workflows. |
| `.int` | Intermediate routine file extension used by some M runtimes. |

## Formatter

The Stage 2 formatter is deliberately conservative. It is designed to clean up safe whitespace issues without changing MUMPS semantics.

### Formatter behavior

- Removes trailing whitespace.
- Preserves comments.
- Preserves labels at column 1.
- Preserves dot-block indentation.
- Preserves strings and string contents.
- Performs only safe command-area spacing cleanup.
- Is intended to be idempotent: formatting an already formatted file should not keep changing it.

### Formatter usage

1. Open a MUMPS file.
2. Confirm the language mode is `mumps`.
3. Run **Format Document** from the Command Palette.
4. Review the diff before saving when working with unusual vendor-specific syntax.

Before:

```mumps
START ; comment
 S X="hello"  
 . W X,!   
```

After:

```mumps
START ; comment
 S X="hello"
 . W X,!
```

## Diagnostics

Diagnostics appear automatically for open MUMPS files when `mforge.diagnostics.enabled` is enabled.

| Diagnostic | Severity | Description |
| --- | --- | --- |
| Unterminated string | Warning | A string starts with `"` but does not close on the line. |
| Suspicious unknown command token | Warning | A command-position token is not recognized as a known MUMPS command or Z-command. |
| Invalid label format at line start | Warning | A non-indented line starts with a token that does not match the basic MUMPS label pattern. |
| Unbalanced parentheses | Warning | Parentheses are unbalanced on the line outside strings. |
| Trailing whitespace | Information | Spaces or tabs at the end of a line can be removed safely. |

Example diagnostics:

```mumps
1BAD S X=1          ; invalid label
 S X="missing end   ; unterminated string
 S Y=$G(^DPT(1,0)  ; unbalanced parentheses
```

## Snippet examples

| Prefix | Description |
| --- | --- |
| `routine` | Basic routine header. |
| `label` | Entry point with parameters and a `QUIT`. |
| `do` | `DO` label/routine call. |
| `$$` | Extrinsic function call. |
| `for` | Basic `FOR` loop with a dot block. |
| `order` | `$ORDER` loop over a global/local array. |
| `new` | `NEW` local variables. |
| `sglobal` | `SET` a global node. |
| `write` | `WRITE` a line. |
| `rpc` | VistA-style RPC entry point skeleton. |
| `fda` | FileMan FDA update skeleton. |

## Configuration

| Setting | Default | Description |
| --- | --- | --- |
| `mforge.trace.level` | `off` | Controls diagnostic logging for MForge extension features. |
| `mforge.formatter.enabled` | `true` | Enables the conservative MForge document formatter. |
| `mforge.diagnostics.enabled` | `true` | Enables basic MForge diagnostics for MUMPS files. |

Example settings:

```jsonc
{
  "mforge.formatter.enabled": true,
  "mforge.diagnostics.enabled": true,
  "mforge.trace.level": "off"
}
```

## How to test the current stage

Run all commands from the repository root unless noted otherwise.

### 1. Validate JSON contribution files

```bash
python3 -m json.tool Src/package.json >/dev/null \
  && python3 -m json.tool Src/language-configuration.json >/dev/null \
  && python3 -m json.tool Src/syntaxes/mumps.tmLanguage.json >/dev/null \
  && python3 -m json.tool Src/snippets/mumps.json >/dev/null
```

Expected result: no output and exit code `0`.

### 2. Compile the extension

```bash
cd Src
npm run compile
```

Expected result: TypeScript compilation completes and updates `Src/out/`.

### 3. Run Stage 2 fixture checks

```bash
cd Src
npm run test:stage2
```

Expected result:

```text
Stage 2 parser/formatter fixture checks passed
```

This checks:

- formatter idempotence
- trailing-whitespace cleanup
- comment preservation
- label parsing
- command parsing
- global parsing
- dot-block level parsing
- unterminated string detection
- parser-assisted indentation suggestions

### 4. Manual VS Code smoke test

1. Open the repository in VS Code.
2. Open the `Src/` extension folder.
3. Press `F5` to start an Extension Development Host.
4. Create or open a file such as `TEST.m`.
5. Verify:
   - syntax highlighting appears
   - snippets appear for prefixes such as `routine`, `label`, `order`, and `rpc`
   - **Format Document** removes trailing whitespace safely
   - diagnostics appear for broken examples such as invalid labels or unterminated strings

Sample test file:

```mumps
START ; Stage 2 smoke test
 S X="hello"  
 . W X,!   
1BAD S Y=1
 S BROKEN="unterminated
 S OPEN=(1+2
 Q
```

## How to create the Stage 2 tag

After tests pass and the branch is ready, create an annotated git tag for this stage:

```bash
git tag -a v0.2.0-stage2 -m "MForge Stage 2 editing productivity"
```

Verify the tag locally:

```bash
git tag --list "v0.2.0-stage2"
```

Push the branch and tag when ready:

```bash
git push origin HEAD
git push origin v0.2.0-stage2
```

If you prefer strict semantic-version tags for marketplace releases, use `v0.2.0`. The recommended stage-specific tag is `v0.2.0-stage2` so it is clear this release corresponds to the Stage 2 roadmap milestone.

## Current roadmap status

| Stage | Status | Notes |
| --- | --- | --- |
| Stage 0: Cleanup and setup | Done | Extension scaffold and metadata are in place. |
| Stage 1: Core language support | Done | Syntax highlighting, language configuration, snippets, and docs are in place. |
| Stage 2: Editing productivity | Done | Formatter, parser-assisted indentation, diagnostics, docs, and fixture checks are in place. |
| Stage 3: Navigation | Planned | Document symbols, Go to Label, Go to Routine, workspace symbols. |
| Stage 4: Intelligence | Planned | Hover, completion, signature help, command reference. |
| Stage 5: Advanced analysis | Planned | References, dependency analyzer, code metrics. |
| Stage 6: Runtime and debugging | Planned | GT.M/YottaDB, Docker/Remote SSH, MDEBUG/debugger research. |
| Stage 7: VistA tools | Planned | RPC explorer, FileMan dictionary helper, global explorer. |
| Stage 8: Packaging and publishing | Planned | Marketplace packaging, screenshots, release notes. |

## License and old extension reuse policy

This extension is implemented cleanly under `Src/`. Old extensions in the repository were analyzed for feature planning. Source code was not copied into Stage 0/1 or Stage 2. Future reuse must document source, license, attribution, and rationale before merging.

## Development quick reference

```bash
cd Src
npm install
npm run compile
npm run test:stage2
```

If `npm install` is blocked by registry or security policy, use the available local/global tooling for compilation and document the environment limitation in the PR summary.
