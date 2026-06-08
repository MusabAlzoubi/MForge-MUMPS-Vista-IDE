const assert = require('node:assert/strict');
const Module = require('node:module');

class Position { constructor(line, character) { this.line = line; this.character = character; } }
class Range { constructor(line, start, endLine, end) { this.start = new Position(line, start); this.end = new Position(endLine, end); } }
class Diagnostic { constructor(range, message, severity) { this.range = range; this.message = message; this.severity = severity; } }
const severity = { Error: 0, Warning: 1, Information: 2, Hint: 3 };
const settings = {
  'standards.profile': 'vista',
  'standards.enforceRoutineHeader': true,
  'standards.namespacePrefixes': ['UJO'],
  'standards.enforceLabelLength': true,
  'standards.enforceLocalVariableNames': true,
  'standards.enforceTmpGlobalSubscript': true,
  'standards.enforcePercentGlobalProtection': true
};
const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
  if (request === 'vscode') {
    return {
      Position, Range, Diagnostic,
      DiagnosticSeverity: severity,
      workspace: { getConfiguration: () => ({ get: (name, fallback) => Object.prototype.hasOwnProperty.call(settings, name) ? settings[name] : fallback }) }
    };
  }
  return originalLoad.call(this, request, parent, isMain);
};

const pkg = require('../package.json');
assert.equal(pkg.version, '0.6.1', 'version remains on the legacy parity release line or newer');
const commandIds = new Set(pkg.contributes.commands.map((command) => command.command));
for (const id of ['mforge.insertRoutineHeaderTemplate','mforge.insertPatchChangeBlockTemplate','mforge.zstep','mforge.zwrite','mforge.zshow','mforge.zbreak','mforge.directDebugSetup','mforge.directDebugSmokeTest']) {
  assert(commandIds.has(id), `${id} is contributed`);
}
assert(pkg.contributes.debuggers?.some((debuggerContribution) => debuggerContribution.type === 'mumps'), 'mumps debug type is contributed');
assert(pkg.contributes.breakpoints?.some((breakpoint) => breakpoint.language === 'mumps'), 'mumps breakpoints are contributed');

const { createRoutineHeaderTemplate, createPatchChangeBlockTemplate } = require('../out/features/templates/templateEngine');
const header = createRoutineHeaderTemplate({ routineName: 'UJOROUT', company: 'EHS', author: 'DEV', description: 'Routine description', version: '2.0', namespace: 'UJO', patch: '1', date: 'JUN 07, 2026', build: '1' });
assert(header.includes('UJOROUT ;;EHS/DEV - Routine description ;JUN 07, 2026'), 'routine header template mirrors legacy header line');
assert(header.includes(';;2.0;UJO;**1**;JUN 07, 2026;Build 1'), 'routine header template includes patch metadata');
const block = createPatchChangeBlockTemplate({ company: 'EHS', author: 'DEV', patch: 'UJO*2.0*1', date: 'JUN 07, 2026', fixType: 'Update', reason: 'Change reason', scope: 'Unit test' });
assert(block.includes('START OF CODE CHANGES FOR UJO*2.0*1'), 'patch block includes change start sentinel');
assert(block.includes('Scope         : Unit test'), 'patch block includes optional scope');

const { analyzeStandards } = require('../out/features/diagnostics/standardsRules');
const text = [
  'BADROU ; missing metadata and namespace',
  'TOOLONGLABEL S lowercase=1,THISVARIABLEISTOOLONG=2',
  ' S ^TMP("X",1)=1',
  ' K ^%ZIS(1)'
].join('\n');
const lines = text.split(/\r?\n/);
const document = { lineCount: lines.length, lineAt: (line) => ({ text: lines[line] }) };
const issues = analyzeStandards(document);
const codes = new Set(issues.map((issue) => issue.code));
assert(codes.has('mforge.standards.namespacePrefix'), 'standards check flags disallowed namespace');
assert(codes.has('mforge.standards.labelLength'), 'standards check flags long labels');
assert(codes.has('mforge.standards.localVariableCase'), 'standards check flags lowercase locals');
assert(codes.has('mforge.standards.localVariableLength'), 'standards check flags long locals');
assert(codes.has('mforge.standards.tmpGlobalSubscript'), 'standards check flags unscoped ^TMP');
assert(codes.has('mforge.standards.percentGlobalProtection'), 'standards check flags ^% global writes/kills');

console.log('Legacy debugger parity tests passed.');
