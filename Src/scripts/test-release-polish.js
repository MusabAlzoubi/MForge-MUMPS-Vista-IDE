const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}
function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}
function assertIncludes(text, expected, label) {
  assert(text.includes(expected), `${label}: expected README/content to include ${expected}`);
}

const readme = read('README.md');
for (const section of [
  '# MForge MUMPS & VistA IDE',
  'Core Language Support',
  'Editing',
  'Diagnostics',
  'Navigation',
  'Find References',
  'IntelliSense',
  'Routine Indexing',
  'Templates',
  'Debugging',
  'Supported Files',
  'Quick Start',
  'Commands',
  'Important Settings',
  'MForge Dark Theme',
  'Troubleshooting',
  'Author'
]) {
  assertIncludes(readme, section, 'major README section');
}
for (const phrase of [
  'A modern VS Code IDE toolkit for MUMPS, GT.M/YottaDB, InterSystems-style M code, and VistA/Hakeem development.',
  'D EN^XUP',
  'S X=$$GET1^DIQ(200,DUZ,.01)',
  'D FILE^DIE("","FDA","ERR")',
  "I '$D(ASKINGVC)!'$$GET^XPAR",
  'MForge: Apply Recommended Hakeem Settings',
  'MForge: Repair Hakeem Routine Settings',
  'MForge: Reset MForge Settings To Defaults',
  'MForge: Show Navigation Diagnostics',
  'MForge: Insert Routine Header Template',
  'MForge: ZSTEP',
  'MForge: Send Raw Debug Command'
]) {
  assertIncludes(readme, phrase, 'README required content');
}

const packageJson = readJson('package.json');
assert.equal(packageJson.version, '0.7.0', 'version is 0.7.0 for lazy routine catalog performance release');
const commands = new Set(packageJson.contributes.commands.map((command) => command.command));
for (const command of [
  'mforge.applyRecommendedHakeemSettings',
  'mforge.repairHakeemRoutineSettings',
  'mforge.resetSettingsToDefaults',
  'mforge.rebuildRoutineIndex',
  'mforge.showNavigationDiagnostics',
  'mforge.insertRoutineHeaderTemplate',
  'mforge.insertPatchChangeBlockTemplate',
  'mforge.sendRawDebugCommand'
]) {
  assert(commands.has(command), `${command} command is contributed`);
}
const properties = packageJson.contributes.configuration.properties;
assert.equal(properties['mforge.autoDetectRoutinePaths'].default, true, 'auto-detect defaults on');
assert.equal(properties['mforge.autoRebuildIndexOnActivation'].default, true, 'auto rebuild defaults on');
assert.equal(properties['mforge.indexExtensionlessRoutines'].default, false, 'extensionless indexing defaults off');
assert.equal(properties['mforge.trace.level'].default, 'off', 'trace level defaults off');
assert.deepEqual(properties['mforge.routineSearchPaths'].default, [], 'routineSearchPaths defaults empty');

const theme = readJson('themes/MForge Dark-color-theme.json');
assert.equal(theme.semanticHighlighting, true, 'theme enables semantic highlighting');
assert.equal(theme.colors['editor.background'], '#1E1E1E', 'theme uses production dark background');
assert.deepEqual(theme.semanticTokenColors['mumps-navigable-routine-reference'], { foreground: '#F5D76E', underline: true }, 'navigable routine references are underlined gold');
assert.deepEqual(theme.semanticTokenColors['mumps-unresolved-routine-reference'], { foreground: '#C586C0', italic: true }, 'unresolved routine references are italic purple');
assert.equal(theme.semanticTokenColors['mumps-api'].foreground, '#4EC9B0', 'FileMan/VistA APIs use teal');

const routineIndexSource = read('src/features/navigation/routineIndex.ts');
assert(!routineIndexSource.includes("this.output?.appendLine(`[navigation] Duplicate routine names"), 'normal index logs do not dump duplicate routine names');
assert(routineIndexSource.includes('logDebugIndexSummary'), 'debug index summary remains available for detailed logs');
assertIncludes(routineIndexSource, 'Ignored broad Hakeem root path. Use localr and routines instead.', 'broad Hakeem root ignore warning');
assertIncludes(routineIndexSource, 'MForge: Repair Hakeem Routine Settings', 'slow index recommendation');

console.log('Release polish validation passed.');
