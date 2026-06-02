const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');

class CompletionItem {
  constructor(label, kind) {
    this.label = label;
    this.kind = kind;
  }
}

const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (request === 'vscode') {
    return {
      Uri: { file: (filePath) => ({ fsPath: filePath }) },
      CompletionItem,
      CompletionItemKind: { Function: 2, Variable: 5, Module: 8, Keyword: 13 }
    };
  }
  return originalLoad.call(this, request, parent, isMain);
};

const { COMMAND_DOCS, getCommandDoc } = require('../out/features/hover/commandDocs');
const { INTRINSIC_DOCS, getIntrinsicDoc } = require('../out/features/hover/intrinsicDocs');
const { SYSTEM_VARIABLE_DOCS, getSystemVariableDoc } = require('../out/features/hover/systemVariableDocs');
const { getMumpsHoverMarkdown, getTokenAtPosition } = require('../out/features/hover/hoverProvider');
const { createMumpsCompletionItems } = require('../out/features/completion/completionItems');
const { resolveMumpsSignature } = require('../out/features/signature/signatureProvider');
const { buildRoutineIndexFromFiles } = require('../out/features/navigation/routineIndex');
const { parseMumpsRoutine } = require('../out/parser/routineParser');

assert.equal(COMMAND_DOCS.length >= 17, true, 'command hover data must include Stage 4 commands');
assert.equal(INTRINSIC_DOCS.length >= 16, true, 'intrinsic hover data must include Stage 4 intrinsics');
assert.equal(SYSTEM_VARIABLE_DOCS.length >= 9, true, 'system variable hover data must include Stage 4 system variables');

assert.equal(getCommandDoc('S').name, 'SET');
assert.equal(getCommandDoc('SET').description.includes('Assigns'), true);
assert.equal(getMumpsHoverMarkdown('S').includes('SET'), true);

assert.equal(getIntrinsicDoc('$O').name, '$ORDER');
assert.equal(getMumpsHoverMarkdown('$O').includes('Returns next subscript'), true);
assert.equal(getSystemVariableDoc('$JOB').description.includes('identifier'), true);
assert.equal(getMumpsHoverMarkdown('$JOB').includes('$JOB'), true);

const hoverToken = getTokenAtPosition(' S X=$O(^TMP($J,I))', 6);
assert.equal(hoverToken.token, '$O');

const fixtureRoot = path.join(__dirname, '..', 'test-fixtures', 'stage3');
const routineAPath = path.join(fixtureRoot, 'ROUTINEA.m');
const routineBPath = path.join(fixtureRoot, 'ROUTINEB.m');
const xupPath = path.join(fixtureRoot, 'XUP.m');
const routineAText = fs.readFileSync(routineAPath, 'utf8');
const routineBText = fs.readFileSync(routineBPath, 'utf8');
const xupText = fs.readFileSync(xupPath, 'utf8');
const localLabels = parseMumpsRoutine(routineAText).labels;
const index = buildRoutineIndexFromFiles([
  { filePath: routineAPath, text: routineAText },
  { filePath: routineBPath, text: routineBText },
  { filePath: xupPath, text: xupText }
]);
const completions = createMumpsCompletionItems(localLabels, index.routines);
const completionLabels = completions.map((item) => item.label);
assert.equal(completionLabels.includes('SET'), true, 'completion list must contain commands');
assert.equal(completionLabels.includes('$O'), true, 'completion list must contain intrinsics');
assert.equal(completionLabels.includes('$JOB'), true, 'completion list must contain system variables');
assert.equal(completionLabels.includes('BUILD'), true, 'completion list must contain local labels');
assert.equal(completionLabels.includes('VALUE^ROUTINEB'), true, 'completion list must contain routine-index labels');
assert.equal(completionLabels.includes('XUP'), true, 'completion list must contain workspace routine names');

const pieceSignature = resolveMumpsSignature(' S X=$P(');
assert.equal(pieceSignature.doc.label, '$PIECE(string,delimiter,piece)');
assert.equal(pieceSignature.activeParameter, 0);
const secondParameter = resolveMumpsSignature(' S X=$P(REC,');
assert.equal(secondParameter.activeParameter, 1);
const nameSignature = resolveMumpsSignature(' S ROOT=$NA(^TMP($J),');
assert.equal(nameSignature.doc.label, '$NAME(variable,subscriptLevel)');
assert.equal(nameSignature.activeParameter, 1);

console.log('Stage 4 intelligence fixture checks passed');
