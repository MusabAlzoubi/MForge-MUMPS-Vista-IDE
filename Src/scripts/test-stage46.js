const assert = require('node:assert/strict');
const Module = require('node:module');

class Position {
  constructor(line, character) { this.line = line; this.character = character; }
}
class Range {
  constructor(a, b, c, d) {
    if (typeof a === 'number') {
      this.start = new Position(a, b);
      this.end = new Position(c, d);
    } else {
      this.start = a;
      this.end = b;
    }
  }
}
class Location {
  constructor(uri, range) { this.uri = uri; this.range = range; }
}
class DocumentLink {
  constructor(range, target) { this.range = range; this.target = target; }
}
class MarkdownString { constructor(value = '') { this.value = value; } }
class Hover { constructor(contents, range) { this.contents = Array.isArray(contents) ? contents : [contents]; this.range = range; } }
class Uri {
  constructor(scheme, path) { this.scheme = scheme; this.path = path; this.fsPath = scheme === 'file' ? path : ''; }
  static file(filePath) { return new Uri('file', filePath); }
  static parse(value) { const index = value.indexOf(':'); return new Uri(value.slice(0, index), value.slice(index + 1)); }
  static joinPath(base, ...segments) {
    const clean = segments.map((segment) => String(segment).replace(/^\/+|\/+$/g, '')).filter(Boolean).join('/');
    const basePath = base.path.endsWith('/') ? base.path.slice(0, -1) : base.path;
    return new Uri(base.scheme, `${basePath}/${clean}`);
  }
  toString() { return `${this.scheme}:${this.path}`; }
}
class SemanticTokensLegend {
  constructor(tokenTypes, tokenModifiers = []) { this.tokenTypes = tokenTypes; this.tokenModifiers = tokenModifiers; }
}
class SemanticTokensBuilder {
  push() {}
  build() { return { data: [] }; }
}

function createDocument(uri, text, languageId = 'mumps') {
  const lines = text.split(/\r?\n/);
  return {
    uri,
    languageId,
    lineCount: lines.length,
    getText: () => text,
    lineAt: (line) => ({ text: lines[line], rangeIncludingLineBreak: new Range(line, 0, line, lines[line].length) })
  };
}

function remoteRoutineUri(name) {
  return new Uri('vscode-remote', `/ssh-remote+dev/workspace/${name}.m`);
}

const remoteUri = remoteRoutineUri('XUP');
const routineBUri = remoteRoutineUri('ROUTINEB');
const ujowxusUri = Uri.file('/extra/routines/UJOWXUS.m');
const ujowxus2Uri = Uri.file('/extra/routines/UJOWXUS2.m');
const dieUri = Uri.file('/extra/routines/DIE.m');
const diqUri = remoteRoutineUri('DIQ');
const xushshUri = remoteRoutineUri('XUSHSH');
const xparUri = Uri.file('/extra/routines/XPAR.m');
const xlfstrUri = Uri.file('/extra/routines/XLFSTR.m');
const noLabelUri = Uri.file('/extra/routines/NOLABEL.m');
const extensionlessUri = Uri.file('/extra/routines/EXTLESS');
const xlfdtUri = Uri.file('/var/worldvista/prod/hakeem/routines/XLFDT.m');
const xus4Uri = Uri.file('/var/worldvista/prod/hakeem/localr/XUS4.m');
const xtvUri = Uri.file('/workspace/routines/XTV.m');
const skippedObjectUri = Uri.file('/var/worldvista/prod/hakeem/objects/SKIPOBJ.m');
const rou1Uri = remoteRoutineUri('ROU1');
const rou2Uri = remoteRoutineUri('ROU2');
const rou3Uri = remoteRoutineUri('ROU3');
const localUri = Uri.file('/workspace/ROUTINEA.m');
const outputUri = new Uri('output', 'rendererLog');
const untitledUri = new Uri('untitled', '/scratch/NEWROU.m');
const texts = new Map([
  [remoteUri.toString(), 'EN(X,Y) Q\nINIT Q'],
  [routineBUri.toString(), 'VALUE() Q 1'],
  [ujowxusUri.toString(), 'ACCEPT Q 1'],
  [ujowxus2Uri.toString(), 'START Q'],
  [dieUri.toString(), 'FILE(FLAGS,FDA,ERR) Q\nUPDATE(FLAGS,FDA,IEN,ERR) Q'],
  [diqUri.toString(), 'GET1(FILE,IEN,FIELD) Q 1'],
  [xushshUri.toString(), 'EN(X) Q 1'],
  [xparUri.toString(), 'GET(ENT,PAR) Q 1'],
  [xlfstrUri.toString(), 'UP(X) Q X'],
  [noLabelUri.toString(), 'OTHER Q'],
  [extensionlessUri.toString(), 'ENTRY Q'],
  [xlfdtUri.toString(), 'NOW() Q'],
  [xus4Uri.toString(), 'VALID() Q'],
  [xtvUri.toString(), 'TEST Q'],
  [skippedObjectUri.toString(), 'BAD Q'],
  [rou1Uri.toString(), 'ONE() Q 1'],
  [rou2Uri.toString(), 'TWO Q 2'],
  [rou3Uri.toString(), 'THREE Q'],
  [localUri.toString(), [
    'START D EN^XUP D BUILD G EXIT S V=$$VALUE^ROUTINEB()',
    'BUILD Q',
    'DIRUT Q',
    'INLINE SET X=$$ACCEPT^UJOWXUS IF (X["^")!(\'$L(X)) DO DIRUT',
    'FILEMAN S FDA(200,IEN,2)=XUH D FILE^DIE("","FDA","ERR")',
    'INTR I \'$D(ASKINGVC)!\'$$GET^XPAR("SYS","XU VC CASE SENSITIVE") S X=$$UP^XLFSTR(X) ;for VOE allow case sensitive Verify Code',
    'MULTI S A=$$ONE^ROU1(),B=$$TWO^ROU2 D THREE^ROU3',
    'VARS N X,Y S X=1 W X',
    'EXIT Q'
  ].join('\n')]
]);

const workspaceUris = [remoteUri, routineBUri, diqUri, xushshUri, rou1Uri, rou2Uri, rou3Uri];
const settings = {
  'trace.level': 'debug',
  routineSearchPaths: ['/extra/routines', '/workspace/routines'],
  autoDetectRoutinePaths: true,
  autoRebuildIndexOnActivation: true,
  indexExtensionlessRoutines: true,
  maxWorkspaceFiles: 2000
};
const directoryEntries = new Map([
  ['file:/extra/routines', [
    ['UJOWXUS.m', 1],
    ['UJOWXUS2.m', 1],
    ['DIE.m', 1],
    ['XPAR.m', 1],
    ['XLFSTR.m', 1],
    ['NOLABEL.m', 1],
    ['EXTLESS', 1],
    ['README.txt', 1]
  ]],
  ['file:/var/worldvista/prod/hakeem/routines', [
    ['XLFDT.m', 1]
  ]],
  ['file:/var/worldvista/prod/hakeem/localr', [
    ['XUS4.m', 1]
  ]],
  ['file:/var/worldvista/prod/hakeem/localroutines', []],
  ['file:/var/worldvista/prod/hakeem/r', []],
  ['file:/var/worldvista/prod/hakeem/local', []],
  ['file:/var/worldvista/prod/hakeem', [
    ['routines', 2],
    ['localr', 2],
    ['objects', 2],
    ['localo', 2]
  ]],
  ['file:/var/worldvista/prod/hakeem/objects', [
    ['SKIPOBJ.m', 1]
  ]],
  ['file:/workspace/routines', [
    ['XTV.m', 1]
  ]],
  ['file:/workspace/localr', []],
  ['file:/workspace/localroutines', []],
  ['file:/workspace/r', []],
  ['file:/workspace/src/routines', []]
]);
const outputLines = [];
const updateCalls = [];
const registeredCommands = new Map();
let informationMessageResponse = 'Cancel';
const output = { appendLine: (line) => outputLines.push(line), show: () => undefined, dispose: () => undefined };

const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (request === 'vscode') {
    return {
      Position, Range, Location, DocumentLink, MarkdownString, Hover, Uri, SemanticTokensLegend, SemanticTokensBuilder,
      FileType: { Unknown: 0, File: 1, Directory: 2, SymbolicLink: 64 },
      workspace: {
        workspaceFolders: [{ uri: Uri.file('/workspace'), name: 'workspace', index: 0 }],
        textDocuments: [],
        fs: {
          readFile: async (uri) => Buffer.from(texts.get(uri.toString()) ?? ''),
          readDirectory: async (uri) => {
            if (!directoryEntries.has(uri.toString())) {
              throw new Error(`No directory fixture for ${uri.toString()}`);
            }
            return directoryEntries.get(uri.toString());
          }
        },
        findFiles: async () => workspaceUris,
        getConfiguration: () => ({
          get: (name, fallback) => Object.prototype.hasOwnProperty.call(settings, name) ? settings[name] : fallback,
          update: async (name, value, target) => updateCalls.push({ name, value, target })
        })
      },
      window: {
        showInputBox: async () => 'XPAR',
        showInformationMessage: async () => informationMessageResponse
      },
      commands: {
        registerCommand: (command, callback) => { registeredCommands.set(command, callback); return { dispose: () => undefined }; },
        executeCommand: async (command, ...args) => registeredCommands.get(command)?.(...args)
      },
      ConfigurationTarget: { Global: 1, Workspace: 2, WorkspaceFolder: 3 }
    };
  }
  return originalLoad.call(this, request, parent, isMain);
};

const { isMumpsUri } = require('../out/config/language');
const { MumpsRoutineIndex, buildRoutineIndexFromFiles, routineNameFromUri } = require('../out/features/navigation/routineIndex');
const { MumpsDefinitionProvider } = require('../out/features/navigation/definitionProvider');
const { MumpsDocumentLinkProvider } = require('../out/features/navigation/documentLinkProvider');
const { MumpsReferenceProvider } = require('../out/features/navigation/referenceProvider');
const { MumpsNavigationHoverProvider } = require('../out/features/navigation/navigationHoverProvider');
const { registerNavigationDebugCommands } = require('../out/features/navigation/debugCommands');
const { classifyMumpsSemanticTokens } = require('../out/features/semanticTokens/semanticTokenProvider');
const { findMumpsReferenceAt, findMumpsReferencesInLine } = require('../out/parser/routineParser');

function summarizeReferences(line) {
  return findMumpsReferencesInLine(line).map(summarizeReference);
}

function summarizeReference(reference) {
  return {
    label: reference.label,
    routine: reference.routine,
    raw: reference.raw,
    start: reference.startCharacter,
    end: reference.endCharacter
  };
}

function assertReferenceAt(line, token, expected, message) {
  const index = line.indexOf(token);
  assert.notEqual(index, -1, `${token} must appear in test line`);
  assert.deepEqual(summarizeReference(findMumpsReferenceAt(line, index + Math.floor(token.length / 2))), expected, message);
}

function documentTextForLink(document, link) {
  const line = document.lineAt(link.range.start.line).text;
  return line.slice(link.range.start.character, link.range.end.character);
}

(async () => {
assert.equal(isMumpsUri(outputUri, 'mumps'), false, 'output rendererLog documents must be ignored');
assert.equal(isMumpsUri(untitledUri, 'mumps'), true, 'untitled MUMPS documents are supported');
assert.equal(routineNameFromUri(remoteUri), 'XUP', 'remote routine names come from uri.path when fsPath is unavailable');

assert.deepEqual(summarizeReferences('X=$$ACCEPT^UJOWXUS'), [
  { label: 'ACCEPT', routine: 'UJOWXUS', raw: 'ACCEPT^UJOWXUS', start: 4, end: 18 }
], 'extrinsic calls without parentheses must parse');

assert.deepEqual(summarizeReferences('SET X=$$ACCEPT^UJOWXUS IF (X["^")!(\'$L(X)) DO DIRUT'), [
  { label: 'ACCEPT', routine: 'UJOWXUS', raw: 'ACCEPT^UJOWXUS', start: 8, end: 22 },
  { label: 'DIRUT', routine: null, raw: 'DIRUT', start: 46, end: 51 }
], 'inline extrinsic and later DO references must both parse');

assert.deepEqual(summarizeReferences('S FDA(200,IEN,2)=XUH D FILE^DIE("","FDA","ERR")'), [
  { label: 'FILE', routine: 'DIE', raw: 'FILE^DIE', start: 23, end: 31 }
], 'inline DO routine calls after SET must parse once');

assert.deepEqual(summarizeReferences('$$EN^XUSHSH(X)'), [
  { label: 'EN', routine: 'XUSHSH', raw: 'EN^XUSHSH', start: 2, end: 11 }
], 'extrinsic calls with parentheses must keep parsing');

assert.deepEqual(summarizeReferences('SET EPDAYS=$$GET1^DIQ(4,DIVIEN,400000000)'), [
  { label: 'GET1', routine: 'DIQ', raw: 'GET1^DIQ', start: 13, end: 21 }
], 'FileMan extrinsic calls with parentheses must keep parsing');

assert.deepEqual(summarizeReferences('W "$$FAKE^ROUTINE" ; D FAKE^ROUTINE'), [], 'string and comment references must be ignored');

const acceptLine = 'SET X=$$ACCEPT^UJOWXUS IF (X["^")!(\'$L(X)) DO DIRUT';
assertReferenceAt(acceptLine, 'ACCEPT', { label: 'ACCEPT', routine: 'UJOWXUS', raw: 'ACCEPT^UJOWXUS', start: 8, end: 22 }, 'cursor on ACCEPT resolves ACCEPT^UJOWXUS');
assertReferenceAt(acceptLine, 'UJOWXUS', { label: 'ACCEPT', routine: 'UJOWXUS', raw: 'ACCEPT^UJOWXUS', start: 8, end: 22 }, 'cursor on UJOWXUS resolves ACCEPT^UJOWXUS');
assertReferenceAt(acceptLine, 'DIRUT', { label: 'DIRUT', routine: null, raw: 'DIRUT', start: 46, end: 51 }, 'cursor on DIRUT resolves local label reference');

const xparLine = 'I \'$D(ASKINGVC)!\'$$GET^XPAR("SYS","XU VC CASE SENSITIVE") S X=$$UP^XLFSTR(X)';
assertReferenceAt(xparLine, 'GET', { label: 'GET', routine: 'XPAR', raw: 'GET^XPAR', start: 19, end: 27 }, 'cursor on GET resolves GET^XPAR');
assertReferenceAt(xparLine, 'XPAR', { label: 'GET', routine: 'XPAR', raw: 'GET^XPAR', start: 19, end: 27 }, 'cursor on XPAR resolves GET^XPAR');
assertReferenceAt(xparLine, 'UP', { label: 'UP', routine: 'XLFSTR', raw: 'UP^XLFSTR', start: 64, end: 73 }, 'cursor on UP resolves UP^XLFSTR');
assertReferenceAt(xparLine, 'XLFSTR', { label: 'UP', routine: 'XLFSTR', raw: 'UP^XLFSTR', start: 64, end: 73 }, 'cursor on XLFSTR resolves UP^XLFSTR');

const fileLine = 'S FDA(200,IEN,2)=XUH D FILE^DIE("","FDA","ERR")';
assertReferenceAt(fileLine, 'FILE', { label: 'FILE', routine: 'DIE', raw: 'FILE^DIE', start: 23, end: 31 }, 'cursor on FILE resolves FILE^DIE');
assertReferenceAt(fileLine, 'DIE', { label: 'FILE', routine: 'DIE', raw: 'FILE^DIE', start: 23, end: 31 }, 'cursor on DIE resolves FILE^DIE');

const get1Line = 'S EPDAYS=$$GET1^DIQ(4,DIVIEN,400000000)';
assertReferenceAt(get1Line, 'GET1', { label: 'GET1', routine: 'DIQ', raw: 'GET1^DIQ', start: 11, end: 19 }, 'cursor on GET1 resolves GET1^DIQ');
assertReferenceAt(get1Line, 'DIQ', { label: 'GET1', routine: 'DIQ', raw: 'GET1^DIQ', start: 11, end: 19 }, 'cursor on DIQ resolves GET1^DIQ');

assert.deepEqual(summarizeReferences('I \'$D(ASKINGVC)!\'$$GET^XPAR("SYS","XU VC CASE SENSITIVE") S X=$$UP^XLFSTR(X) ;for VOE allow case sensitive Verify Code'), [
  { label: 'GET', routine: 'XPAR', raw: 'GET^XPAR', start: 19, end: 27 },
  { label: 'UP', routine: 'XLFSTR', raw: 'UP^XLFSTR', start: 64, end: 73 }
], 'unary NOT and logical operator extrinsics must parse before comments');

assert.deepEqual(summarizeReferences('S A=$$ONE^ROU1(),B=$$TWO^ROU2 D THREE^ROU3'), [
  { label: 'ONE', routine: 'ROU1', raw: 'ONE^ROU1', start: 6, end: 14 },
  { label: 'TWO', routine: 'ROU2', raw: 'TWO^ROU2', start: 21, end: 29 },
  { label: 'THREE', routine: 'ROU3', raw: 'THREE^ROU3', start: 32, end: 42 }
], 'multiple extrinsic and inline DO references on one line must parse');


const semanticText = ' S X=$$GET^XPAR() S Y=$O(^TMP($J)) S Z=$$MISS^NOPE()';
const semanticTokens = classifyMumpsSemanticTokens(semanticText, new Set(['XPAR']));
function hasSemantic(type, value, text = semanticText) {
  return semanticTokens.some((token) => token.type === type && text.slice(token.start, token.start + token.length) === value);
}
assert.equal(hasSemantic('mumps.navigableRoutineReference', 'GET^XPAR'), true, 'navigable routine references get a dedicated semantic token');
assert.equal(hasSemantic('mumps.unresolvedRoutineReference', 'MISS^NOPE'), true, 'unresolved routine references get a dedicated semantic token');
assert.equal(hasSemantic('mumps.intrinsic', '$O'), true, 'intrinsics keep intrinsic semantic token classification');
assert.equal(hasSemantic('mumps.intrinsic', 'GET^XPAR'), false, 'routine references and intrinsics must not share token type');

const refs = findMumpsReferencesInLine(' D EN^XUP DO FILE^DIE G EXIT GOTO BUILD S X=$$GET1^DIQ() S Y=$$VALUE^ROUTINEB()');
assert.equal(refs.some((ref) => ref.label === 'EN' && ref.routine === 'XUP'), true, 'DO cross-routine references are parsed');
assert.equal(refs.some((ref) => ref.label === 'FILE' && ref.routine === 'DIE'), true, 'FileMan API references are parsed');
assert.equal(refs.some((ref) => ref.label === 'EXIT' && ref.routine === null), true, 'G label references are parsed');
assert.equal(refs.some((ref) => ref.label === 'BUILD' && ref.routine === null), true, 'GOTO label references are parsed');
assert.equal(refs.some((ref) => ref.label === 'GET1' && ref.routine === 'DIQ'), true, 'extrinsic FileMan API references are parsed');
assert.equal(refs.some((ref) => ref.label === 'VALUE' && ref.routine === 'ROUTINEB'), true, 'extrinsic cross-routine references are parsed');

const index = new MumpsRoutineIndex(output);
const localDoc = createDocument(localUri, texts.get(localUri.toString()));
await Promise.all([index.rebuild(), index.rebuild()]);
index.indexOpenDocument(localDoc);
assert.equal(index.findRoutine('UJOWXUS')?.uri.toString(), ujowxusUri.toString(), 'routineSearchPaths index routines outside the workspace root');
assert.equal(index.findRoutine('XPAR')?.uri.toString(), xparUri.toString(), 'configured routineSearchPaths index XPAR outside the workspace root');
assert.equal(index.findRoutine('EXTLESS')?.uri.toString(), extensionlessUri.toString(), 'extensionless routines are indexed when mforge.indexExtensionlessRoutines is enabled');
assert.equal(index.getLastDiagnostics().skippedByExtension >= 1, true, 'scan diagnostics count files skipped by unsupported extension');
assert.equal(index.getLastDiagnostics().keyRoutineStatus.UJOWXUS2.includes('FOUND'), true, 'key routine diagnostics include UJOWXUS2 status');
assert.equal(index.getLastDiagnostics().keyRoutineStatus.XLFDT.includes('FOUND'), true, 'key routine diagnostics include auto-detected XLFDT status');
assert.equal(index.getLastDiagnostics().keyRoutineStatus.XUS4.includes('FOUND'), true, 'key routine diagnostics include auto-detected XUS4 status');
assert.equal(index.getLastDiagnostics().keyRoutineStatus.XTV.includes('FOUND'), true, 'key routine diagnostics include workspace-relative XTV status');
assert.equal(outputLines.some((line) => line.includes('Index contains UJOWXUS2')), true, 'debug logging includes UJOWXUS2 key routine status');
const pathState = await index.getRoutinePathState(false);
assert.equal(pathState.manualPaths.includes('/extra/routines'), true, 'manual routine paths remain part of the effective path state');
assert.equal(pathState.autoDetectedPaths.includes('/var/worldvista/prod/hakeem/routines'), true, 'auto-detect finds common absolute WorldVistA routine path');
assert.equal(pathState.autoDetectedPaths.includes('/workspace/routines'), true, 'auto-detect finds workspace-relative routines folder');
assert.equal(pathState.effectivePaths.filter((entry) => entry === '/workspace/routines').length, 1, 'manual and auto-detected paths are deduplicated');
assert.equal(index.findRoutine('SKIPOBJ'), undefined, 'objects/localo folders are excluded from auto-detected source folder scans');

const autoOutputStart = outputLines.length;
const autoIndex = new MumpsRoutineIndex(output);
autoIndex.scheduleAutoRebuildOnActivation(0);
autoIndex.scheduleAutoRebuildOnActivation(0);
await new Promise((resolve) => setTimeout(resolve, 25));
assert.equal(outputLines.slice(autoOutputStart).filter((line) => line.includes('Auto rebuilding MUMPS routine index after activation')).length, 1, 'auto rebuild is debounced to one activation rebuild');

registerNavigationDebugCommands({ subscriptions: [] }, index, output);
await registeredCommands.get('mforge.showRoutineIndexStatus')();
assert.equal(outputLines.some((line) => line.includes('MUMPS Routine Index Status')), true, 'Show Routine Index Status logs a status header');
assert.equal(outputLines.some((line) => line.includes('Effective routine paths:') && line.includes('/var/worldvista/prod/hakeem/routines')), true, 'Show Routine Index Status includes effective auto-detected paths');
assert.equal(outputLines.some((line) => line.includes('XLFDT: FOUND')), true, 'Show Routine Index Status includes key XLFDT routine status');
assert.equal(updateCalls.length, 0, 'Save Detected Routine Paths To Settings does not update settings unless the explicit command is run and confirmed');
await registeredCommands.get('mforge.saveDetectedRoutinePathsToSettings')();
assert.equal(updateCalls.length, 0, 'Save Detected Routine Paths To Settings respects cancellation');

const definitionProvider = new MumpsDefinitionProvider(index);
const line = localDoc.lineAt(0).text;
const definition = await definitionProvider.provideDefinition(localDoc, new Position(0, line.indexOf('XUP') + 1));
assert.equal(definition.uri.toString(), remoteUri.toString(), 'F12 resolves vscode-remote routine references');
assert.equal(definition.range.start.line, 0, 'F12 resolves target label line');

const localDefinition = await definitionProvider.provideDefinition(localDoc, new Position(0, line.indexOf('BUILD') + 1));
assert.equal(localDefinition.uri.toString(), localUri.toString(), 'local label definitions stay in the current document');
assert.equal(localDefinition.range.start.line, 1, 'local label line is resolved');

const inlineLine = localDoc.lineAt(3).text;
const acceptDefinition = await definitionProvider.provideDefinition(localDoc, new Position(3, inlineLine.indexOf('ACCEPT') + 1));
assert.equal(acceptDefinition.uri.toString(), ujowxusUri.toString(), 'F12 resolves extrinsic references without parentheses');

const fileManLine = localDoc.lineAt(4).text;
const fileDefinition = await definitionProvider.provideDefinition(localDoc, new Position(4, fileManLine.indexOf('FILE^') + 1));
assert.equal(fileDefinition.uri.toString(), dieUri.toString(), 'F12 resolves inline FileMan API references after another command');

const intrinsicLine = localDoc.lineAt(5).text;
const getDefinition = await definitionProvider.provideDefinition(localDoc, new Position(5, intrinsicLine.indexOf('GET^') + 1));
assert.equal(getDefinition.uri.toString(), xparUri.toString(), 'F12 resolves unary-NOT extrinsic references after logical operators');
const upDefinition = await definitionProvider.provideDefinition(localDoc, new Position(5, intrinsicLine.indexOf('UP^') + 1));
assert.equal(upDefinition.uri.toString(), xlfstrUri.toString(), 'F12 resolves later extrinsic references on the same line');

const noLabelDoc = createDocument(localUri, 'MISS S X=$$MISSING^NOLABEL()');
const noLabelDefinition = await definitionProvider.provideDefinition(noLabelDoc, new Position(0, noLabelDoc.lineAt(0).text.indexOf('MISSING') + 1));
assert.equal(noLabelDefinition.uri.toString(), noLabelUri.toString(), 'routine exists but missing label falls back to routine top');
assert.equal(noLabelDefinition.range.start.line, 0, 'missing label fallback opens the routine top');

const missingDoc = createDocument(localUri, 'MISS S X=$$NOPE^NOPE()');
const missingHover = await new MumpsNavigationHoverProvider(index).provideHover(missingDoc, new Position(0, missingDoc.lineAt(0).text.indexOf('NOPE') + 1));
assert.notEqual(missingHover, null, 'unresolved routine references show actionable debug hover when trace debug is enabled');
assert.equal(missingHover.contents[0].value.includes('Target routine `NOPE` is not indexed'), true, 'unresolved hover explains missing routine index entry');
assert.equal(missingHover.contents[0].value.includes('mforge.routineSearchPaths'), true, 'unresolved hover points to routineSearchPaths');

const multiLine = localDoc.lineAt(6).text;
const threeDefinition = await definitionProvider.provideDefinition(localDoc, new Position(6, multiLine.indexOf('THREE') + 1));
assert.equal(threeDefinition.uri.toString(), rou3Uri.toString(), 'F12 resolves inline DO references after multiple extrinsics');

const variableLine = localDoc.lineAt(7).text;
const variableDefinition = await definitionProvider.provideDefinition(localDoc, new Position(7, variableLine.lastIndexOf('X') + 1));
assert.equal(variableDefinition.uri.toString(), localUri.toString(), 'F12 resolves basic local variable usage in the same routine');
assert.equal(variableDefinition.range.start.character, variableLine.indexOf('X=1'), 'local variable usage resolves to nearest SET assignment');

const links = await new MumpsDocumentLinkProvider(index).provideDocumentLinks(localDoc);
assert.equal(links.some((link) => link.target.toString() === remoteUri.toString()), true, 'document links include cross-routine targets');
assert.equal(links.some((link) => link.target.toString() === ujowxusUri.toString()), true, 'document links include extrinsic targets without parentheses');
assert.equal(links.some((link) => link.target.toString() === dieUri.toString()), true, 'document links include inline FileMan API targets');
assert.equal(links.some((link) => link.target.toString() === xparUri.toString()), true, 'document links include unary-NOT/logical extrinsic targets');
assert.equal(links.some((link) => link.target.toString() === rou3Uri.toString()), true, 'document links include inline DO targets after multiple references');
assert.equal(links.some((link) => documentTextForLink(localDoc, link) === 'ACCEPT^UJOWXUS'), true, 'document link range is exactly ACCEPT^UJOWXUS');
assert.equal(links.some((link) => documentTextForLink(localDoc, link) === 'GET^XPAR'), true, 'document link range is exactly GET^XPAR');
assert.equal(links.some((link) => documentTextForLink(localDoc, link) === 'UP^XLFSTR'), true, 'document link range is exactly UP^XLFSTR');
assert.equal(links.some((link) => documentTextForLink(localDoc, link) === 'FILE^DIE'), true, 'document link range is exactly FILE^DIE');
assert.equal(links.some((link) => link.tooltip.includes('BUILD')), true, 'document links include local label targets');

const referenceProvider = new MumpsReferenceProvider(index);
const references = await referenceProvider.provideReferences(localDoc, new Position(0, line.indexOf('XUP') + 1), { includeDeclaration: true });
assert.equal(references.some((location) => location.uri.toString() === remoteUri.toString() && location.range.start.line === 0), true, 'references include declaration');
assert.equal(references.some((location) => location.uri.toString() === localUri.toString()), true, 'references include call sites');

const hover = await new MumpsNavigationHoverProvider(index).provideHover(localDoc, new Position(3, inlineLine.indexOf('ACCEPT') + 1));
assert.notEqual(hover, null, 'Ctrl+Hover navigation hover is available for extrinsic references without parentheses');

const nonMumpsDoc = createDocument(outputUri, 'rendererLog', 'log');
assert.equal(await definitionProvider.provideDefinition(nonMumpsDoc, new Position(0, 0)), null, 'non-MUMPS definitions do not throw');
assert.deepEqual(await new MumpsDocumentLinkProvider(index).provideDocumentLinks(nonMumpsDoc), [], 'non-MUMPS document links do not throw');

const remoteBuilt = buildRoutineIndexFromFiles([{ filePath: remoteUri.path, uri: remoteUri, text: texts.get(remoteUri.toString()) }]);
assert.equal(remoteBuilt.routines[0].uriKey, remoteUri.toString(), 'indexes use uri.toString keys for remote stability');

console.log('Stage 4.6 navigation, remote URI, and stability fixture checks passed');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
