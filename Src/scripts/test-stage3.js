const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');

const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (request === 'vscode') {
    return { Uri: { file: (filePath) => ({ fsPath: filePath }) } };
  }
  return originalLoad.call(this, request, parent, isMain);
};

const { getDocumentLabels } = require('../out/features/symbols/documentSymbols');
const { buildRoutineIndexFromFiles, shouldIgnoreRoutinePath } = require('../out/features/navigation/routineIndex');
const { findMumpsReferenceAt, parseMumpsRoutine } = require('../out/parser/routineParser');

const fixtureRoot = path.join(__dirname, '..', 'test-fixtures', 'stage3');
const routineAPath = path.join(fixtureRoot, 'ROUTINEA.m');
const routineBPath = path.join(fixtureRoot, 'ROUTINEB.m');
const xupPath = path.join(fixtureRoot, 'XUP.m');

const routineAText = fs.readFileSync(routineAPath, 'utf8');
const routineBText = fs.readFileSync(routineBPath, 'utf8');
const xupText = fs.readFileSync(xupPath, 'utf8');

const labels = getDocumentLabels(routineAText);
assert.deepEqual(labels.map((label) => label.signature), ['START', 'BUILD(DATA)', 'VALUE()', 'EXIT']);
assert.equal(labels.find((label) => label.name === 'BUILD').line, 9);
assert.equal(labels.some((label) => label.name === 'COMMENTED'), false, 'labels in comments must be ignored');
assert.equal(labels.some((label) => label.name === 'STRINGONLY'), false, 'labels in strings must be ignored');

const xupLabels = getDocumentLabels(xupText);
assert.deepEqual(xupLabels.map((label) => label.signature), ['EN(X,Y)', 'INIT']);

const index = buildRoutineIndexFromFiles([
  { filePath: routineAPath, text: routineAText },
  { filePath: routineBPath, text: routineBText },
  { filePath: xupPath, text: xupText },
  { filePath: path.join(fixtureRoot, 'Old Extensions', 'IGNORED.m'), text: 'OLD Q' }
]);
assert.deepEqual(index.routines.map((routine) => routine.name), ['ROUTINEA', 'ROUTINEB', 'XUP']);
assert.equal(index.routines.find((routine) => routine.name === 'ROUTINEB').labels.some((label) => label.name === 'VALUE'), true);
assert.equal(shouldIgnoreRoutinePath(path.join('Old Extensions', 'LEGACY.m')), true);

const routineA = parseMumpsRoutine(routineAText, 'ROUTINEA');
const localLine = ' D BUILD';
const localReference = findMumpsReferenceAt(localLine, localLine.indexOf('BUILD') + 1);
assert.equal(localReference.label, 'BUILD');
assert.equal(localReference.routine, null);
assert.equal(routineA.labels.find((label) => label.name === localReference.label).line, 9);

const remoteLine = ' D EN^XUP';
const remoteReference = findMumpsReferenceAt(remoteLine, remoteLine.indexOf('EN') + 1);
assert.equal(remoteReference.label, 'EN');
assert.equal(remoteReference.routine, 'XUP');
const xupRoutine = index.routines.find((routine) => routine.name === remoteReference.routine);
assert.equal(xupRoutine.labels.find((label) => label.name === remoteReference.label).signature, 'EN(X,Y)');

const extrinsicLine = ' S Y=$$VALUE^ROUTINEB()';
const extrinsicReference = findMumpsReferenceAt(extrinsicLine, extrinsicLine.indexOf('ROUTINEB') + 1);
assert.equal(extrinsicReference.label, 'VALUE');
assert.equal(extrinsicReference.routine, 'ROUTINEB');

const workspaceSymbolNames = [];
for (const routine of index.routines) {
  workspaceSymbolNames.push(routine.name);
  for (const label of routine.labels) {
    workspaceSymbolNames.push(`${label.name}^${routine.name}`);
    workspaceSymbolNames.push(label.signature);
  }
}
assert.equal(workspaceSymbolNames.includes('ROUTINEA'), true);
assert.equal(workspaceSymbolNames.includes('BUILD^ROUTINEA'), true);
assert.equal(workspaceSymbolNames.includes('VALUE^ROUTINEB'), true);
assert.equal(workspaceSymbolNames.includes('EN^XUP'), true);

console.log('Stage 3 navigation fixture checks passed');
