const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');

class Position { constructor(line, character) { this.line = line; this.character = character; } }
class Range {
  constructor(a, b, c, d) {
    if (typeof a === 'number') { this.start = new Position(a, b); this.end = new Position(c, d); }
    else { this.start = a; this.end = b; }
  }
}
class Location { constructor(uri, range) { this.uri = uri; this.range = range; } }
class DocumentLink { constructor(range, target) { this.range = range; this.target = target; } }
class MarkdownString { constructor(value) { this.value = value; this.isTrusted = false; } }
class Hover { constructor(contents, range) { this.contents = Array.isArray(contents) ? contents : [contents]; this.range = range; } }
class Uri {
  constructor(scheme, pathValue) { this.scheme = scheme; this.path = pathValue; this.fsPath = scheme === 'file' ? pathValue : ''; }
  static file(filePath) { return new Uri('file', filePath); }
  static parse(value) { const index = value.indexOf(':'); return new Uri(value.slice(0, index), value.slice(index + 1)); }
  static joinPath(base, ...parts) { return Uri.file(path.posix.join(base.path, ...parts)); }
  toString() { return `${this.scheme}:${this.path}`; }
}
class SemanticTokensLegend { constructor(tokenTypes, tokenModifiers = []) { this.tokenTypes = tokenTypes; this.tokenModifiers = tokenModifiers; } }
class SemanticTokensBuilder { constructor() { this.tokens = []; } push(line, start, length, tokenType, tokenModifiers) { this.tokens.push({ line, start, length, tokenType, tokenModifiers }); } build() { return { data: this.tokens }; } }

const fixtureDir = path.join(__dirname, '..', 'test-fixtures', 'hakeem-hardening');
const callerText = fs.readFileSync(path.join(fixtureDir, 'HKCALL.m'), 'utf8');
const dieText = fs.readFileSync(path.join(fixtureDir, 'DIE.m'), 'utf8');
const diqText = fs.readFileSync(path.join(fixtureDir, 'DIQ.m'), 'utf8');
const xparText = fs.readFileSync(path.join(fixtureDir, 'XPAR.m'), 'utf8');
const xlfstrText = fs.readFileSync(path.join(fixtureDir, 'XLFSTR.m'), 'utf8');
const xlfdtFallbackText = fs.readFileSync(path.join(fixtureDir, 'XLFDT.routines.m'), 'utf8');
const xlfdtLocalText = fs.readFileSync(path.join(fixtureDir, 'XLFDT.localr.m'), 'utf8');

const callerUri = Uri.file('/workspace/hakeem/HKCALL.m');
const localXlfdtUri = Uri.file('/var/worldvista/prod/hakeem/localr/XLFDT.m');
const fallbackXlfdtUri = Uri.file('/var/worldvista/prod/hakeem/routines/XLFDT.m');
const dieUri = Uri.file('/var/worldvista/prod/hakeem/routines/DIE.m');
const diqUri = Uri.file('/var/worldvista/prod/hakeem/routines/DIQ.m');
const xparUri = Uri.file('/var/worldvista/prod/hakeem/routines/XPAR.m');
const xlfstrUri = Uri.file('/var/worldvista/prod/hakeem/routines/XLFSTR.m');
const xupUri = Uri.file('/var/worldvista/prod/hakeem/routines/XUP.m');

const texts = new Map([
  [callerUri.toString(), callerText],
  [localXlfdtUri.toString(), xlfdtLocalText],
  [fallbackXlfdtUri.toString(), xlfdtFallbackText],
  [dieUri.toString(), dieText],
  [diqUri.toString(), diqText],
  [xparUri.toString(), xparText],
  [xlfstrUri.toString(), xlfstrText],
  [xupUri.toString(), 'XUP ; Kernel entry\nEN Q']
]);
const directoryEntries = new Map([
  ['file:/var/worldvista/prod/hakeem/localr', [['XLFDT.m', 1]]],
  ['file:/var/worldvista/prod/hakeem/routines', [['XLFDT.m', 1], ['DIE.m', 1], ['DIQ.m', 1], ['XPAR.m', 1], ['XLFSTR.m', 1], ['XUP.m', 1]]]
]);
const mtimes = new Map(Array.from(texts.keys()).map((key, index) => [key, 2000 + index]));
const settings = {
  'trace.level': 'info',
  routineSearchPaths: ['/var/worldvista/prod/hakeem/localr', '/var/worldvista/prod/hakeem/routines'],
  autoDetectRoutinePaths: true,
  autoRebuildIndexOnActivation: true,
  indexExtensionlessRoutines: false,
  maxRoutineSearchPathFiles: 30000,
  maxWorkspaceFiles: 5000,
  'references.enabled': true,
  'references.includeDeclarations': true,
  'references.maxResults': 5000
};
const outputLines = [];
const output = { appendLine: (line) => outputLines.push(line), show: () => undefined, dispose: () => undefined };

function createDocument(uri, text) {
  const lines = text.split(/\r?\n/);
  return { uri, languageId: 'mumps', fileName: uri.fsPath, lineCount: lines.length, getText: () => text, lineAt: (line) => ({ text: lines[line] ?? '' }) };
}
function pos(doc, line, token, offset = 0) {
  const text = doc.lineAt(line).text;
  const index = text.indexOf(token);
  assert.notEqual(index, -1, `${token} must be present on line ${line}`);
  return new Position(line, index + offset);
}
function lineText(line) { return callerText.split(/\r?\n/)[line]; }
function sliceAt(location) { const text = texts.get(location.uri.toString()) ?? callerText; const line = text.split(/\r?\n/)[location.range.start.line] ?? ''; return line.slice(location.range.start.character, location.range.end.character); }

const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (request === 'vscode') {
    return {
      Position, Range, Location, DocumentLink, MarkdownString, Hover, Uri, SemanticTokensLegend, SemanticTokensBuilder,
      FileType: { Unknown: 0, File: 1, Directory: 2, SymbolicLink: 64 },
      DiagnosticSeverity: { Error: 0, Warning: 1, Information: 2, Hint: 3 },
      workspace: {
        workspaceFolders: [{ uri: Uri.file('/workspace'), name: 'workspace', index: 0 }],
        textDocuments: [createDocument(callerUri, callerText)],
        fs: {
          readFile: async (uri) => Buffer.from(texts.get(uri.toString()) ?? ''),
          stat: async (uri) => ({ mtime: mtimes.get(uri.toString()) ?? 0 }),
          readDirectory: async (uri) => {
            if (!directoryEntries.has(uri.toString())) throw new Error(`No directory fixture for ${uri.toString()}`);
            return directoryEntries.get(uri.toString());
          }
        },
        findFiles: async () => [callerUri],
        getConfiguration: () => ({ get: (name, fallback) => Object.prototype.hasOwnProperty.call(settings, name) ? settings[name] : fallback })
      },
      languages: { registerReferenceProvider: () => ({ dispose() {} }) }
    };
  }
  return originalLoad.call(this, request, parent, isMain);
};

const { findMumpsReferenceAt, findMumpsReferencesInLine } = require('../out/parser/routineParser');
const { MumpsRoutineIndex } = require('../out/features/navigation/routineIndex');
const { MumpsDefinitionProvider } = require('../out/features/navigation/definitionProvider');
const { MumpsDocumentLinkProvider } = require('../out/features/navigation/documentLinkProvider');
const { MumpsNavigationHoverProvider } = require('../out/features/navigation/navigationHoverProvider');
const { MForgeReferenceProvider } = require('../out/features/references/referenceProvider');
const { classifyMumpsSemanticTokens } = require('../out/features/semanticTokens/semanticTokenProvider');

(async () => {
function summarize(line) {
  return findMumpsReferencesInLine(line).map((reference) => ({ label: reference.label, routine: reference.routine, raw: reference.raw }));
}

assert(summarize(lineText(2)).some((ref) => ref.raw === 'EN^XUP'), 'D LABEL^ROUTINE parses');
assert(summarize(lineText(3)).some((ref) => ref.raw === 'GET^XPAR'), '$$GET^XPAR parses');
assert(summarize(lineText(3)).some((ref) => ref.raw === 'UP^XLFSTR'), 'multiple references per line parse');
assert(summarize(lineText(4)).some((ref) => ref.raw === 'FMADD^XLFDT'), 'nested FMADD^XLFDT parses');
assert(summarize(lineText(4)).some((ref) => ref.raw === 'GET1^DIQ'), 'nested GET1^DIQ parses');
assert(summarize(lineText(5)).some((ref) => ref.raw === 'FILE^DIE'), 'postconditional FILE^DIE parses');
assert(summarize(lineText(5)).some((ref) => ref.raw === 'UPDATE^DIE'), 'UPDATE^DIE parses after comma');
assert.deepEqual(summarize(lineText(9)), [], 'strings and comments are ignored');
assert.equal(findMumpsReferencesInLine(' S X=^TMP($J,"A")').length, 0, 'globals are not treated as routine references');
assert.equal(findMumpsReferencesInLine(' D ^XUP').some((ref) => ref.routine === 'XUP' && ref.label === null), true, 'routine-only DO ^ROUTINE references are retained');

const callerDoc = createDocument(callerUri, callerText);
const index = new MumpsRoutineIndex(output);
await index.rebuild();
assert.equal(index.findRoutine('XLFDT')?.uri.toString(), localXlfdtUri.toString(), 'localr XLFDT overrides routines fallback');
assert.equal(index.getLastDiagnostics().duplicatesRemoved > 0 || index.getLastDiagnostics().duplicateRoutineNames > 0, true, `duplicate routine handling records removal or duplicate names: ${JSON.stringify(index.getLastDiagnostics())}`);
await index.rebuild();
assert.equal(index.getLastDiagnostics().cacheHits > 0, true, 'second rebuild uses cache hits');
assert(outputLines.some((line) => line.includes('Indexed') && line.includes('source folder')), 'normal diagnostics include index summary');
assert(outputLines.some((line) => line.includes('Cache:')), 'normal diagnostics include cache summary');
assert(outputLines.some((line) => line.includes('Key routines:')), 'normal diagnostics include key routines');
assert.equal(outputLines.some((line) => line.includes('[navigation] Duplicate routine names:')), false, 'normal diagnostics do not dump duplicate details');

const definitionProvider = new MumpsDefinitionProvider(index, output);
for (const [line, label, routine, expectedUri, expectedSlice] of [
  [2, 'EN', 'XUP', xupUri.toString(), 'EN'],
  [3, 'GET', 'XPAR', xparUri.toString(), 'GET'],
  [3, 'UP', 'XLFSTR', xlfstrUri.toString(), 'UP'],
  [4, 'FMADD', 'XLFDT', localXlfdtUri.toString(), 'FMADD'],
  [4, 'GET1', 'DIQ', diqUri.toString(), 'GET1'],
  [5, 'FILE', 'DIE', dieUri.toString(), 'FILE'],
  [5, 'UPDATE', 'DIE', dieUri.toString(), 'UPDATE']
]) {
  const ref = findMumpsReferenceAt(callerDoc.lineAt(line).text, callerDoc.lineAt(line).text.indexOf(label));
  assert.equal(ref?.routine, routine, `${label} routine side parsed`);
  const labelLocation = await definitionProvider.provideDefinition(callerDoc, pos(callerDoc, line, label));
  assert.equal(labelLocation.uri.toString(), expectedUri, `${label} definition from label side`);
  assert.equal(sliceAt(labelLocation), expectedSlice, `${label} definition target slice`);
  const routineLocation = await definitionProvider.provideDefinition(callerDoc, pos(callerDoc, line, routine));
  assert.equal(routineLocation.uri.toString(), expectedUri, `${label} definition from routine side`);
}
const localLabelLocation = await definitionProvider.provideDefinition(callerDoc, pos(callerDoc, 7, 'LOCAL'));
assert.equal(sliceAt(localLabelLocation), 'LOCAL', 'local label navigation resolves');
const localVariableLocation = await definitionProvider.provideDefinition(callerDoc, pos(callerDoc, 5, 'DUZ'));
assert.equal(sliceAt(localVariableLocation), 'DUZ', 'local variable navigation resolves to NEW declaration');

const links = await new MumpsDocumentLinkProvider(index, output).provideDocumentLinks(callerDoc);
assert(links.some((link) => callerDoc.lineAt(4).text.slice(link.range.start.character, link.range.end.character) === 'FMADD^XLFDT'), 'document links include FMADD^XLFDT');
assert(links.some((link) => callerDoc.lineAt(5).text.slice(link.range.start.character, link.range.end.character) === 'UPDATE^DIE'), 'document links include UPDATE^DIE');
const hover = await new MumpsNavigationHoverProvider(index, output).provideHover(callerDoc, pos(callerDoc, 4, 'XLFDT'));
assert(hover?.contents[0].value.includes('FMADD^XLFDT'), 'hover link describes FMADD^XLFDT navigation');

const referenceProvider = new MForgeReferenceProvider(index, output);
const refs = await referenceProvider.provideReferences(callerDoc, pos(callerDoc, 4, 'FMADD'), { includeDeclaration: true }, { isCancellationRequested: false });
assert(refs.some((location) => location.uri.toString() === localXlfdtUri.toString() && sliceAt(location) === 'FMADD'), 'references include FMADD declaration');
assert(refs.filter((location) => location.uri.toString() === callerUri.toString()).length >= 2, 'references include multiple FMADD call sites');

const semanticLine = lineText(4);
const semanticTokens = classifyMumpsSemanticTokens(semanticLine, new Set(['XLFDT', 'DIQ']));
function hasSemantic(type, value) { return semanticTokens.some((token) => token.type === type && semanticLine.slice(token.start, token.start + token.length) === value); }
assert.equal(hasSemantic('mumps-api', 'FMADD^XLFDT'), true, 'FMADD^XLFDT is a FileMan/VistA API semantic token');
assert.equal(hasSemantic('mumps-api', 'GET1^DIQ'), true, 'GET1^DIQ remains a FileMan API semantic token');

console.log('Hakeem hardening regression checks passed.');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
