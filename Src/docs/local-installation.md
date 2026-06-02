# Local installation and testing

## Prerequisites

- Node.js
- npm
- Visual Studio Code with the `code` command available on your PATH

## First-time setup

Run `cd Src` only from the repository root. If your terminal is already inside `Src`, do not run `cd Src` again.

```bash
cd Src
npm install
```

## Compile

```bash
npm run compile
```

## Run tests

```bash
npm run test
```

## Package local VSIX

```bash
npm run package:local
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
| `Error: ENOENT no such file or directory, open '*.vsix'` | A VSIX was not created or the wildcard was not expanded. | Run `npm run package:local` first, then use `code --install-extension mforge-mumps-vista-ide-0.3.0.vsix`. |
| `cd: Src: No such file or directory` | The terminal is already inside `Src` or not at the repository root. | If already inside `Src`, skip `cd Src`. Otherwise return to the repository root before running `cd Src`. |
