# Local installation and testing

## Prerequisites

- Node.js 18 or newer. Node.js 18.19.1 is explicitly supported for local VSIX packaging.
- npm
- Visual Studio Code with the `code` command available on your PATH

## First-time setup

Run `cd Src` only from the repository root. If your terminal is already inside `Src`, do not run `cd Src` again.

```bash
cd Src
rm -rf node_modules
npm install
```

When `npm install` creates `package-lock.json`, keep it for reproducible local packaging. Delete it only when troubleshooting an incompatible dependency tree, then regenerate it with `npm install`.

## Check packaging environment

```bash
npm run env:check
```

This prints the Node version, npm version, package.json packager dependency, installed `vsce` version, local binary path, and whether local packaging requirements are met.

## Compile

```bash
npm run compile
```

## Run tests

```bash
npm run test
```

## Package local VSIX

Run the packaging command after compile and tests pass:

```bash
npm run package
```

The convenience command below performs the environment check, compile, tests, and package step in sequence:

```bash
npm run package:local
```

Expected VSIX filename for version 0.3.0:

```text
mforge-mumps-vista-ide-0.3.0.vsix
```

## Install local VSIX

Prefer the exact VSIX filename because shell wildcard behavior can vary:

```bash
code --install-extension mforge-mumps-vista-ide-0.3.0.vsix
```

The convenience script remains available when wildcard expansion works in your shell:

```bash
npm run install:local
```

## Alternative manual test

1. Open `Src` in VS Code.
2. Press `F5`.
3. Open the Extension Development Host.
4. Open a `.m`, `.rou`, `.int`, `.mumps`, or `.mps` file and test formatting, diagnostics, symbols, and navigation.


## Node 18-safe VSIX packager

MForge pins the legacy `vsce` CLI to exact version `2.11.0` because it is a known Node-18-safe 2.x packager for this extension. Do not replace it with current `@vscode/vsce` on Node 18; newer scoped releases can pull Node-20-only dependencies and fail with `ReferenceError: File is not defined` in `node_modules/undici/...`.

If you previously installed a different packager version, reset local dependencies before reinstalling:

```bash
rm -rf node_modules package-lock.json
npm install
```

## Troubleshooting

| Problem | Cause | Fix |
| --- | --- | --- |
| `sh: 1: tsc: not found` | Dependencies were not installed. | Run `npm install` inside `Src`, then rerun `npm run compile`. |
| `npm ERR! Missing script: "package"` | The local checkout does not include the Stage 3 package scripts or the command is being run in the wrong folder. | Pull the latest changes and check `Src/package.json` scripts. Run commands from inside `Src`. |
| `env:check` expects the wrong version | The checkout still has an older hardcoded environment check. | Pull the latest changes, remove `node_modules`, run `npm install`, and confirm `env:check` reads the installed `vsce` version dynamically. |
| `ReferenceError: File is not defined` in `node_modules/undici/...` | A Node-20-only dependency was installed, usually from current `@vscode/vsce` or an incompatible transient dependency. | Remove `node_modules` and `package-lock.json`, verify `package.json` uses exact `"vsce": "2.11.0"`, then run `npm install`, `npm run env:check`, and `npm run package`. |
| `Error: ENOENT no such file or directory, open '*.vsix'` | A VSIX was not created or the wildcard was not expanded. | Packaging did not complete. Do not run install before `npm run package` succeeds; then use `code --install-extension mforge-mumps-vista-ide-0.3.0.vsix`. |
| `vsce: not found` | Dependencies were not installed or `node_modules/.bin` is unavailable. | Run `npm install` inside `Src`, then rerun `npm run env:check` and `npm run package`. |
| `cd: Src: No such file or directory` | The terminal is already inside `Src` or not at the repository root. | If already inside `Src`, skip `cd Src`. Otherwise return to the repository root before running `cd Src`. |

Do not use wildcard install commands unless `mforge-mumps-vista-ide-0.3.0.vsix` exists.
