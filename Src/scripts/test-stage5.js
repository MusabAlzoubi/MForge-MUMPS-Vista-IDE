const assert = require('node:assert/strict');
const Module = require('node:module');

class Position { constructor(line, character) { this.line = line; this.character = character; } }
class Range {
  constructor(a, b, c, d) {
    if (typeof a === 'number') { this.start = new Position(a, b); this.end = new Position(c, d); }
    else { this.start = a; this.end = b; }
  }
}
class Location { constructor(uri, range) { this.uri = uri; this.range = range; } }
class Uri {
  constructor(scheme, path) { this.scheme = scheme; this.path = path; this.fsPath = scheme === 'file' ? path : ''; }
  static file(filePath) { return new Uri('file', filePath); }
  static parse(value) { const index = value.indexOf(':'); return new Uri(value.slice(0, index), value.slice(index + 1)); }
  toString() { return `${this.scheme}:${this.path}`; }
}
function remoteRoutineUri(name) { return new Uri('vscode-remote', `/ssh-remote+dev/workspace/${name}.m`); }
function createDocument(uri, text, languageId = 'mumps') {
  const lines = text.split(/\r?\n/);
  return { uri, languageId, lineCount: lines.length, getText: () => text, lineAt: (line) => ({ text: lines[line] }) };
}

const localUri = Uri.file('/workspace/STAGE5.m');
const remoteCallerUri = remoteRoutineUri('REMOTECL');
const diqUri = remoteRoutineUri('DIQ');
const dieUri = Uri.file('/extra/routines/DIE.m');
const dicUri = Uri.file('/extra/routines/DIC.m');
const xparUri = Uri.file('/extra/routines/XPAR.m');
const xlfstrUri = Uri.file('/extra/routines/XLFSTR.m');
const ujowxusUri = Uri.file('/extra/routines/UJOWXUS.m');
const skippedObjectUri = Uri.file('/workspace/objects/SKIPOBJ.m');
const skippedGeneratedUri = Uri.file('/workspace/generated/SKIPGEN.m');

const localText = [
  'BUILD ; declaration',
  ' D BUILD G BUILD S X=$$BUILD()',
  ' S A=$$GET1^DIQ(200,IEN,.01),B=$$GET1^DIQ(2,DFN,.01)',
  ' S X=$$ACCEPT^UJOWXUS',
  ' I \'$D(ASKINGVC)!\'$$GET^XPAR("SYS","XU VC CASE SENSITIVE") S X=$$UP^XLFSTR(X)',
  ' S FDA(200,IEN,2)=XUH D FILE^DIE("","FDA","ERR") D UPDATE^DIE("","FDA","IEN","ERR")',
  ' S Y=$$FIND1^DIC(200,"","X",X)',
  ' N RESULT S RESULT=1 W RESULT S OTHER="RESULT" ; RESULT comment',
  ' D FILE^DIE D FILE^DIE'
].join('\n');
const remoteCallerText = 'ENTRY D FILE^DIE S X=$$GET1^DIQ(200,1,.01)';

const texts = new Map([
  [localUri.toString(), localText],
  [remoteCallerUri.toString(), remoteCallerText],
  [diqUri.toString(), 'GET1(FILE,IEN,FIELD) Q 1'],
  [dieUri.toString(), 'FILE(FLAGS,FDA,ERR) Q\nUPDATE(FLAGS,FDA,IEN,ERR) Q'],
  [dicUri.toString(), 'FIND1(FILE,FLAGS,VALUE,INDEX) Q 1'],
  [xparUri.toString(), 'GET(ENT,PAR) Q 1'],
  [xlfstrUri.toString(), 'UP(X) Q X'],
  [ujowxusUri.toString(), 'ACCEPT Q 1'],
  [skippedObjectUri.toString(), 'FILE Q'],
  [skippedGeneratedUri.toString(), 'FILE Q']
]);
let settings = {
  'references.enabled': true,
  'references.includeDeclarations': true,
  'references.maxResults': 5000,
  'trace.level': 'debug'
};

const originalLoad = Module._load;
Module._load = function(request, parent, isMain) {
  if (request === 'vscode') {
    return {
      Position, Range, Location, Uri,
      workspace: {
        textDocuments: [],
        fs: { readFile: async (uri) => Buffer.from(texts.get(uri.toString()) ?? '') },
        getConfiguration: () => ({ get: (name, fallback) => Object.prototype.hasOwnProperty.call(settings, name) ? settings[name] : fallback })
      },
      languages: { registerReferenceProvider: () => ({ dispose() {} }) }
    };
  }
  return originalLoad.call(this, request, parent, isMain);
};

const { buildRoutineIndexFromFiles, uriKey } = require('../out/features/navigation/routineIndex');
const { parseMumpsRoutine } = require('../out/parser/routineParser');
const { MForgeReferenceProvider } = require('../out/features/references/referenceProvider');

class FakeRoutineIndex {
  constructor(files) {
    this.data = buildRoutineIndexFromFiles(files, { includeExtensionless: true });
    this.built = false;
  }
  async ensureBuilt() { this.built = true; }
  getRoutines() { return this.data.routines; }
  findRoutine(name) { return this.data.routines.find((routine) => routine.name.toUpperCase() === name.toUpperCase()); }
  parseDocument(document) { return parseMumpsRoutine(document.getText(), document.uri.path.split('/').pop().replace(/\..*$/, '')); }
}

function pos(doc, line, token, offset = 0) {
  const text = doc.lineAt(line).text;
  const index = text.indexOf(token);
  assert.notEqual(index, -1, `${token} must be present on line ${line}`);
  return new Position(line, index + offset);
}
function snippets(doc, locations) {
  return locations.map((location) => {
    const text = texts.get(location.uri.toString()) ?? doc.getText();
    const line = text.split(/\r?\n/)[location.range.start.line] ?? '';
    return `${location.uri.toString()}:${location.range.start.line}:${line.slice(location.range.start.character, location.range.end.character)}`;
  });
}

(async () => {
  const files = Array.from(texts, ([key, text]) => ({ filePath: Uri.parse(key).path, uri: Uri.parse(key), text }));
  const index = new FakeRoutineIndex(files);
  const localDoc = createDocument(localUri, localText);
  const remoteDoc = createDocument(remoteCallerUri, remoteCallerText);
  const provider = new MForgeReferenceProvider(index);
  const token = { isCancellationRequested: false };

  let refs = await provider.provideReferences(localDoc, pos(localDoc, 0, 'BUILD', 1), { includeDeclaration: true }, token);
  let seen = snippets(localDoc, refs);
  assert(seen.some((entry) => entry.includes(':0:BUILD')), 'local label references include declaration');
  assert(seen.some((entry) => entry.includes(':1:BUILD')), 'local label references include DO/GOTO/extrinsic call sites');
  assert.equal(refs.filter((location) => location.uri.toString() === localUri.toString()).length, 4, 'local label references find declaration plus DO, GOTO, and $$ calls');

  refs = await provider.provideReferences(localDoc, pos(localDoc, 2, 'GET1^DIQ', 1), { includeDeclaration: true }, token);
  seen = snippets(localDoc, refs);
  assert(seen.some((entry) => entry.startsWith(`${diqUri.toString()}:0:GET1`)), 'cross-routine references include declaration when available');
  assert(seen.filter((entry) => entry.includes('GET1^DIQ')).length >= 3, 'cross-routine references include all matching LABEL^ROUTINE call sites across indexed routines');

  refs = await provider.provideReferences(localDoc, pos(localDoc, 2, 'DIQ', 1), { includeDeclaration: true }, token);
  assert(snippets(localDoc, refs).some((entry) => entry.startsWith(`${diqUri.toString()}:0:GET1`)), 'cursor on routine part resolves the same LABEL^ROUTINE target');

  refs = await provider.provideReferences(localDoc, pos(localDoc, 3, 'ACCEPT', 1), { includeDeclaration: true }, token);
  assert(snippets(localDoc, refs).some((entry) => entry.startsWith(`${ujowxusUri.toString()}:0:ACCEPT`)), 'no-parentheses extrinsic references include declaration');

  refs = await provider.provideReferences(localDoc, pos(localDoc, 4, 'GET^XPAR', 1), { includeDeclaration: true }, token);
  assert(snippets(localDoc, refs).some((entry) => entry.startsWith(`${xparUri.toString()}:0:GET`)), 'unary-NOT/logical extrinsic GET^XPAR references work');
  refs = await provider.provideReferences(localDoc, pos(localDoc, 4, 'UP^XLFSTR', 1), { includeDeclaration: true }, token);
  assert(snippets(localDoc, refs).some((entry) => entry.startsWith(`${xlfstrUri.toString()}:0:UP`)), 'later logical-line extrinsic UP^XLFSTR references work');

  refs = await provider.provideReferences(localDoc, pos(localDoc, 5, 'FILE^DIE', 1), { includeDeclaration: true }, token);
  seen = snippets(localDoc, refs);
  assert(seen.some((entry) => entry.startsWith(`${dieUri.toString()}:0:FILE`)), 'inline FileMan FILE^DIE references include declaration');
  assert(seen.filter((entry) => entry.includes('FILE^DIE')).length >= 4, 'multiple FILE^DIE references per line and remote call sites are returned');
  assert(!seen.some((entry) => entry.startsWith(skippedObjectUri.toString())), 'objects folders are excluded from indexed reference results');
  assert(!seen.some((entry) => entry.startsWith(skippedGeneratedUri.toString())), 'generated folders are excluded from indexed reference results');

  refs = await provider.provideReferences(localDoc, pos(localDoc, 5, 'UPDATE^DIE', 1), { includeDeclaration: true }, token);
  assert(snippets(localDoc, refs).some((entry) => entry.startsWith(`${dieUri.toString()}:1:UPDATE`)), 'UPDATE^DIE FileMan API references include declaration');
  refs = await provider.provideReferences(localDoc, pos(localDoc, 6, 'FIND1^DIC', 1), { includeDeclaration: true }, token);
  assert(snippets(localDoc, refs).some((entry) => entry.startsWith(`${dicUri.toString()}:0:FIND1`)), 'FIND1^DIC FileMan API references include declaration');

  refs = await provider.provideReferences(localDoc, pos(localDoc, 7, 'RESULT', 1), { includeDeclaration: true }, token);
  seen = snippets(localDoc, refs);
  assert.deepEqual(seen.map((entry) => entry.split(':').at(-1)), ['RESULT', 'RESULT', 'RESULT'], 'local variable references include NEW declaration, SET assignment, and usage only');
  assert.equal(seen.some((entry) => entry.includes('comment')), false, 'local variable references ignore comments');
  assert.equal(seen.some((entry) => entry.includes('"RESULT"')), false, 'local variable references ignore strings');

  refs = await provider.provideReferences(remoteDoc, pos(remoteDoc, 0, 'FILE^DIE', 1), { includeDeclaration: true }, token);
  assert(refs.some((location) => location.uri.toString() === remoteCallerUri.toString()), 'remote URI documents can request references');

  settings['references.maxResults'] = 2;
  refs = await provider.provideReferences(localDoc, pos(localDoc, 8, 'FILE^DIE', 1), { includeDeclaration: true }, token);
  assert.equal(refs.length, 2, 'max result limit is respected');

  console.log('Stage 5.1 Find References fixture checks passed');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
