# MForge TODO

## Stage 0: Cleanup and project setup

- [x] Verify current `Src/` contents.
- [x] Create `Src/package.json` with MForge metadata.
- [x] Configure TypeScript with `Src/tsconfig.json`.
- [x] Add `Src/src/extension.ts` activation scaffold.
- [x] Reference the existing icon in marketplace metadata.
- [x] Add base `Src/README.md`.
- [x] Add `Src/CHANGELOG.md`.
- [x] Add `Src/LICENSE`.

## Stage 1: Core language support

- [x] Register MUMPS language id and aliases.
- [x] Add supported extensions: `.m`, `.M`, `.mumps`, `.mps`, `.rou`, `.int`.
- [x] Add syntax highlighting grammar.
- [x] Add language configuration.
- [x] Add comment, bracket, and auto-closing-pair rules.
- [x] Add MUMPS snippets.
- [x] Document syntax highlighting.
- [x] Document snippets.

## Stage 2: Editing productivity

- [x] Implement basic formatter provider.
- [x] Add formatter fixture tests.
- [x] Implement parser-assisted auto indentation.
- [x] Implement basic diagnostics collection.
- [x] Add diagnostics fixture tests.
- [x] Document formatter and diagnostics.
- [x] Update README and changelog.

## Stage 3: Navigation

- [x] Implement routine/label parser.
- [x] Implement document symbols.
- [x] Implement Go to Label.
- [x] Implement Go to Routine.
- [x] Implement workspace symbols.
- [x] Add navigation fixture tests.
- [x] Document navigation.

## Stage 4: Intelligence

- [ ] Add MUMPS command reference data.
- [ ] Implement hover provider.
- [ ] Implement completion provider.
- [ ] Implement signature help provider.
- [ ] Add provider tests.
- [ ] Document intelligence features.

## Stage 5: Advanced analysis

- [ ] Implement find references.
- [ ] Implement routine dependency analyzer.
- [ ] Implement code metrics.
- [ ] Add analysis reports.
- [ ] Add analysis tests.
- [ ] Document advanced analysis.

## Stage 6: Runtime and debugging

- [ ] Research MDEBUG protocol and compatibility requirements.
- [ ] Design debug adapter architecture.
- [ ] Add GT.M/YottaDB runtime configuration.
- [ ] Document Docker/Remote SSH workflows.
- [ ] Add runtime/debugger tests or mocks.

## Stage 7: VistA tools

- [ ] Design VistA connector safety model.
- [ ] Implement VistA routine helpers.
- [ ] Prototype RPC explorer.
- [ ] Prototype FileMan dictionary explorer.
- [ ] Prototype read-only global explorer.
- [ ] Document VistA tools.

## Local packaging and testing documentation

- [x] Add package scripts for VSIX generation.
- [x] Add `@vscode/vsce` development dependency.
- [x] Document local install and testing workflow.
- [x] Document local packaging troubleshooting.

## Stage 8: Packaging and publishing

- [ ] Add release checklist.
- [ ] Run full test/build suite.
- [ ] Package with `vsce`.
- [ ] Prepare screenshots.
- [ ] Finalize Marketplace README.
- [ ] Finalize release notes.
