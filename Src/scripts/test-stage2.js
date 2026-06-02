const assert = require('node:assert/strict');
const { formatMumpsDocumentText, suggestIndentationForNewLine } = require('../out/features/formatter/formatter');
const { parseMumpsLine } = require('../out/parser/mumpsLineParser');

const source = 'START ; keep comment\n S X="hello"  \n . W X,!\n';
const formatted = formatMumpsDocumentText(source);
assert.equal(formatted, 'START ; keep comment\n S X="hello"\n . W X,!\n');
assert.equal(formatMumpsDocumentText(formatted), formatted, 'formatter must be idempotent');

const parsed = parseMumpsLine('LABEL(ARG) S X=$G(^DPT(1,0)) ; comment');
assert.equal(parsed.label, 'LABEL');
assert.equal(parsed.commands[0].normalized, 'SET');
assert.equal(parsed.comment, '; comment');
assert.equal(parsed.globals[0].token, '^DPT');

const dotBlock = parseMumpsLine(' . . W "nested"');
assert.equal(dotBlock.dotBlockLevel, 2);

const unterminated = parseMumpsLine(' S X="broken');
assert.equal(unterminated.hasUnterminatedString, true);

console.log('Stage 2 parser/formatter fixture checks passed');

assert.equal(suggestIndentationForNewLine(' F  D'), ' . ');
assert.equal(suggestIndentationForNewLine(' . D'), ' . . ');

assert.equal(formatMumpsDocumentText(' S X=1 ; inline'), ' S X=1 ; inline');
