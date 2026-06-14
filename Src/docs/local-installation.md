# Local Installation and Verification

From the `Src/` folder:

```bash
npm install
npm run compile
npm run test
npm run package
code --install-extension mforge-mumps-vista-ide-0.6.3.vsix
```

## JSON Validation

From the repository root:

```bash
python3 -m json.tool Src/package.json >/dev/null
python3 -m json.tool Src/language-configuration.json >/dev/null
python3 -m json.tool Src/syntaxes/mumps.tmLanguage.json >/dev/null
python3 -m json.tool Src/snippets/mumps.json >/dev/null
python3 -m json.tool 'Src/themes/MForge Dark-color-theme.json' >/dev/null
```

## Manual Smoke Test

1. Install the VSIX.
2. Open a `.m` file.
3. Select **MForge Dark**.
4. Run **MForge: Repair Hakeem Routine Settings** if using `/var/worldvista/prod/hakeem`.
5. Run **MForge: Show Navigation Diagnostics**.
6. Test Ctrl+Click, F12, Shift+F12, template commands, standards diagnostics, and debug commands without an active session to confirm safe warnings.
