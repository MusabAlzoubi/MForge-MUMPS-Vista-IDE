const assert = require('node:assert/strict');
const Module = require('node:module');

class SemanticTokensLegend {
  constructor(tokenTypes, tokenModifiers = []) {
    this.tokenTypes = tokenTypes;
    this.tokenModifiers = tokenModifiers;
  }
}

class SemanticTokensBuilder {
  constructor() {
    this.tokens = [];
  }
  push(line, char, length, tokenType) {
    this.tokens.push({ line, char, length, tokenType });
  }
  build() {
    return { data: this.tokens };
  }
}

const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (request === 'vscode') {
    return { SemanticTokensLegend, SemanticTokensBuilder };
  }
  return originalLoad.call(this, request, parent, isMain);
};

const { classifyMumpsSemanticTokens, MUMPS_SEMANTIC_TOKEN_TYPES } = require('../out/features/semanticTokens/semanticTokenProvider');

const text = [
  'EN(DFN,OUT) N FDA S FDA(1)=DFN D UPDATE^DIE S NEXT=$O(^TMP($J,NEXT)) W "ok" ; comment',
  ' D EN^XUP',
  ' S LOCAL=42',
  ' S PIECE=$P(REC,"^",1)'
].join('\n');

const tokens = classifyMumpsSemanticTokens(text);

function tokenText(token) {
  const line = text.split(/\n/)[token.line];
  return line.slice(token.start, token.start + token.length);
}

function has(type, value) {
  return tokens.some((token) => token.type === type && tokenText(token) === value);
}

for (const requiredType of [
  'mumps-label',
  'mumps-command',
  'mumps-intrinsic',
  'mumps-global',
  'mumps-system-variable',
  'mumps-parameter',
  'mumps-local-variable',
  'mumps-api',
  'mumps-routine-reference',
  'mumps-navigable-routine-reference',
  'mumps-unresolved-routine-reference'
]) {
  assert.equal(MUMPS_SEMANTIC_TOKEN_TYPES.includes(requiredType), true, `${requiredType} must be in the semantic legend`);
}

assert.equal(has('mumps-label', 'EN'), true, 'routine label must be classified');
assert.equal(has('mumps-parameter', 'DFN'), true, 'label parameter must be classified');
assert.equal(has('mumps-command', 'S'), true, 'command abbreviation must be classified');
assert.equal(has('mumps-intrinsic', '$O'), true, 'intrinsic must be classified');
assert.equal(has('mumps-intrinsic', '$P'), true, 'ambiguous system/intrinsic token must be intrinsic when called');
assert.equal(has('mumps-global', '^TMP'), true, 'global must be classified');
assert.equal(has('mumps-system-variable', '$J'), true, 'system variable must be classified');
assert.equal(has('mumps-local-variable', 'LOCAL'), true, 'local variable must be classified');
assert.equal(has('mumps-api', 'UPDATE^DIE'), true, 'FileMan API must be classified');
assert.equal(has('mumps-navigable-routine-reference', 'EN^XUP'), true, 'routine reference must be classified as navigable by default');
assert.equal(has('mumps-intrinsic', '$O'), true, 'intrinsic and routine references must have distinct token types');

console.log('Stage 4.5 semantic token fixture checks passed');
