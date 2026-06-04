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

- [x] Add MUMPS command reference data.
- [x] Implement hover provider.
- [x] Implement completion provider.
- [x] Implement signature help provider.
- [x] Add provider tests.
- [x] Document intelligence features.

## Stage 4.5: Professional syntax theme

- [x] Improve TextMate scopes for MUMPS visual hierarchy.
- [x] Add semantic token provider.
- [x] Add MForge Dark theme.
- [x] Highlight common FileMan APIs.
- [x] Add semantic token tests.
- [x] Document theme usage and limitations.

## Stage 4.6: Navigation review and remote stability

- [x] Audit `Old Extensions/tree-sitter-m-vscode` navigation, AST, tree-sitter, LSP, and remote capabilities.
- [x] Audit `Old Extensions/mumps-lsp` definition, reference, symbol, workspace, and LSP navigation capabilities.
- [x] Add DocumentLinkProvider for resolvable MUMPS references.
- [x] Harden Ctrl+Hover, Ctrl+Click, F12, and Peek Definition for static local/cross-routine references.
- [x] Add Find References for static routine and label references.
- [x] Support remote-safe URI indexing with `uri.toString()` and `vscode.workspace.fs`.
- [x] Ignore non-MUMPS, output, and `rendererLog` documents.
- [x] Add lazy indexing, parse/document cache, and debounced dirty marking.
- [x] Add Stage 4.6 fixture tests.
- [x] Update navigation documentation and version to 0.4.2.
- [x] Fix inline command and no-parentheses extrinsic reference parsing for 0.4.3.
- [x] Fix unary-NOT/logical extrinsic scanning and add basic local variable navigation for 0.4.4.
- [x] Fix cursor-range matching and exact document-link ranges for inline routine references for 0.4.5.
- [x] Add navigation debug commands, routine-top fallback, and semantic distinction for routine references for 0.4.6.
- [x] Add routine search-path indexing, extensionless routine option, index diagnostics, and unresolved navigation guidance for 0.4.7.
- [x] Add automatic routine path detection, activation-time index rebuild, routine-index status command, and optional save-detected-paths command for 0.4.8.
- [x] Complete pre-release Marketplace polish for 0.4.9, including activation-safe semantic token identifiers, Marketplace metadata, README refresh, and semantic token contribution validation.

## Stage 5: Advanced analysis

- [x] Stage 5.1: Implement robust Find References for local labels, indexed cross-routine `LABEL^ROUTINE` calls, common FileMan/VistA APIs, and same-document local variables.
- [x] Stage 5.1: Add reference settings and `npm run test:stage5` coverage.
- [x] Stage 5.1: Document references and deferred Stage 5 safety limits.
- [x] Stage 5.1 stabilization: make Hakeem/WorldVistA indexing deterministic, safe for extensionless files, and reliable for Find References.
- [ ] Stage 5.2: Implement safe Rename Symbol for local labels and same-document local variables.
- [ ] Stage 5.3: Implement Call Hierarchy.
- [ ] Stage 5.4: Implement routine dependency analyzer.
- [ ] Stage 5.5: Implement code metrics.
- [ ] Add analysis reports after dependency and metrics commands land.

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
- [x] Add Node 18-compatible `vsce` development dependency.
- [x] Document local install and testing workflow.
- [x] Document local packaging troubleshooting.
- [x] Add packaging environment check script.
- [x] Align packaging workflow with owner-approved old debugger extension approach.
- [x] Override Node-18-incompatible packaging transitive dependencies.

## Stage 8: Packaging and publishing

- [ ] Add release checklist.
- [ ] Run full test/build suite.
- [ ] Package with `vsce`.
- [ ] Prepare screenshots.
- [x] Finalize Marketplace README.
- [x] Finalize release notes.
