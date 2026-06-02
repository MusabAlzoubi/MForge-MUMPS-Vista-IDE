# Local installation and testing

## Prerequisites

- Node.js 18.19.1 or newer. Node 18 LTS and Node 20 LTS are the intended local packaging targets.
- npm
- Visual Studio Code with the `code` command available on your PATH

## First-time setup

Run `cd Src` only from the repository root. If your terminal is already inside `Src`, do not run `cd Src` again.

```bash
cd Src
npm install
```

## Check packaging environment

```bash
npm run env:check
```

This prints the Node version, npm version, VSIX packager dependency, whether the local VSIX packager is installed, and whether local packaging requirements are met.

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

## Troubleshooting

| Problem | Cause | Fix |
| --- | --- | --- |
| `sh: 1: tsc: not found` | Dependencies were not installed. | Run `npm install` inside `Src`, then rerun `npm run compile`. |
| `npm ERR! Missing script: "package"` | The local checkout does not include the Stage 3 package scripts or the command is being run in the wrong folder. | Pull the latest changes and check `Src/package.json` scripts. Run commands from inside `Src`. |
| `ReferenceError: File is not defined` in `node_modules/undici/...` | Current `@vscode/vsce` releases can install dependencies that require Node 20+ globals. This is common on Node 18. | Pull the latest MForge package changes, run `npm install` inside `Src`, confirm `npm run env:check` reports `vsce@2.15.0`, then rerun `npm run package`. Alternatively use Node 20 LTS. |
| `Error: ENOENT no such file or directory, open '*.vsix'` | A VSIX was not created or the wildcard was not expanded. | Run `npm run package` or `npm run package:local` first, then use `code --install-extension mforge-mumps-vista-ide-0.3.0.vsix`. |
| `vsce: not found` | Dependencies were not installed or `node_modules/.bin` is unavailable. | Run `npm install` inside `Src`, then rerun `npm run env:check` and `npm run package`. |
| `cd: Src: No such file or directory` | The terminal is already inside `Src` or not at the repository root. | If already inside `Src`, skip `cd Src`. Otherwise return to the repository root before running `cd Src`. |
