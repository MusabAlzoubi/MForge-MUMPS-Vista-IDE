import * as vscode from 'vscode';
import { isMumpsUri } from '../../config/language';
import { parseMumpsDocument } from '../../parser/mumpsLineParser';
import { isKnownMumpsCommand } from '../../parser/mumpsCommands';

export const MUMPS_SEMANTIC_TOKEN_TYPES = [
  'mumps.label',
  'mumps.command',
  'mumps.intrinsic',
  'mumps.global',
  'mumps.systemVariable',
  'mumps.parameter',
  'mumps.localVariable',
  'mumps.api',
  'mumps.routineReference'
] as const;

export type MumpsSemanticTokenType = typeof MUMPS_SEMANTIC_TOKEN_TYPES[number];

export interface ClassifiedMumpsSemanticToken {
  line: number;
  start: number;
  length: number;
  type: MumpsSemanticTokenType;
}

const TOKEN_TYPE_SET = new Set<string>(MUMPS_SEMANTIC_TOKEN_TYPES);
const COMMON_FILEMAN_APIS = new Set(['UPDATE^DIE', 'FILE^DIE', 'FIND1^DIC', 'GETS^DIQ', 'GET1^DIQ']);
const SYSTEM_VARIABLES = new Set([
  '$DEVICE', '$D', '$ECODE', '$EC', '$ESTACK', '$ES', '$ETRAP', '$ET', '$HOROLOG', '$H', '$IO', '$I', '$JOB', '$J', '$KEY', '$K',
  '$PRINCIPAL', '$P', '$QUIT', '$Q', '$REFERENCE', '$R', '$STACK', '$S', '$STORAGE', '$ST', '$TEST', '$T', '$X', '$Y',
  '$ZA', '$ZB', '$ZC', '$ZEOF', '$ZEOS', '$ZERROR', '$ZHOROLOG', '$ZIO', '$ZJOB', '$ZLEVEL', '$ZMODE', '$ZPOSITION', '$ZSTATUS',
  '$ZSTEP', '$ZSYSTEM', '$ZTEXIT', '$ZTRAP'
]);
const INTRINSIC_PATTERN = /\$(?:ASCII|CHAR|DATA|EXTRACT|FIND|FNUMBER|GET|JUSTIFY|LENGTH|NAME|ORDER|PIECE|QLENGTH|QSUBSCRIPT|QUERY|RANDOM|REVERSE|SELECT|STACK|TEXT|TRANSLATE|VIEW|A|C|D|E|F|FN|G|J|L|NA|O|P|QL|QS|Q|R|RE|S|ST|T|TR|V|Z[A-Z][A-Z0-9]*)\b/gi;
const SYSTEM_VARIABLE_PATTERN = /\$(?:DEVICE|D|ECODE|EC|ESTACK|ES|ETRAP|ET|HOROLOG|H|IO|I|JOB|J|KEY|K|PRINCIPAL|P|QUIT|Q|REFERENCE|R|STACK|S|STORAGE|ST|TEST|T|X|Y|ZA|ZB|ZC|ZEOF|ZEOS|ZERROR|ZHOROLOG|ZIO|ZJOB|ZLEVEL|ZMODE|ZPOSITION|ZSTATUS|ZSTEP|ZSYSTEM|ZTEXIT|ZTRAP)\b/gi;
const GLOBAL_PATTERN = /\^%?[A-Za-z][A-Za-z0-9]*/g;
const ROUTINE_REFERENCE_PATTERN = /%?[A-Za-z][A-Za-z0-9]*\^%?[A-Za-z][A-Za-z0-9]*/g;
const IDENTIFIER_PATTERN = /%?[A-Za-z][A-Za-z0-9]*/g;

export const MUMPS_SEMANTIC_LEGEND = new vscode.SemanticTokensLegend([...MUMPS_SEMANTIC_TOKEN_TYPES], []);

export class MumpsSemanticTokenProvider implements vscode.DocumentSemanticTokensProvider {
  provideDocumentSemanticTokens(document: vscode.TextDocument): vscode.SemanticTokens {
    const builder = new vscode.SemanticTokensBuilder(MUMPS_SEMANTIC_LEGEND);
    if (!isMumpsUri(document.uri, document.languageId)) {
      return builder.build();
    }
    for (const token of classifyMumpsSemanticTokens(document.getText())) {
      builder.push(token.line, token.start, token.length, tokenTypeOrder(token.type), 0);
    }
    return builder.build();
  }
}

export function classifyMumpsSemanticTokens(text: string): ClassifiedMumpsSemanticToken[] {
  const parsedLines = parseMumpsDocument(text);
  const tokens: ClassifiedMumpsSemanticToken[] = [];

  for (const line of parsedLines) {
    const lineNumber = line.lineNumber ?? 0;
    const occupied: Array<{ start: number; end: number }> = line.strings.map((span) => ({ start: span.start, end: span.end }));

    if (line.label && line.labelStart !== null && line.labelEnd !== null) {
      addToken(tokens, occupied, lineNumber, line.labelStart, line.labelEnd, 'mumps.label');
      const parameterStart = line.labelEnd;
      if (line.code[parameterStart] === '(') {
        addLabelParameters(tokens, occupied, lineNumber, line.code, parameterStart + 1);
      }
    }

    for (const command of line.commands) {
      addToken(tokens, occupied, lineNumber, command.start, command.end, 'mumps.command');
    }

    addPatternTokens(tokens, occupied, lineNumber, line.code, ROUTINE_REFERENCE_PATTERN, (value) => COMMON_FILEMAN_APIS.has(value.toUpperCase()) ? 'mumps.api' : 'mumps.routineReference');

    addPatternTokens(tokens, occupied, lineNumber, line.code, SYSTEM_VARIABLE_PATTERN, (value, _start, end) => SYSTEM_VARIABLES.has(value.toUpperCase()) && line.code[end] !== '(' ? 'mumps.systemVariable' : null);
    addPatternTokens(tokens, occupied, lineNumber, line.code, INTRINSIC_PATTERN, (value, _start, end) => !SYSTEM_VARIABLES.has(value.toUpperCase()) || line.code[end] === '(' ? 'mumps.intrinsic' : null);
    addPatternTokens(tokens, occupied, lineNumber, line.code, GLOBAL_PATTERN, () => 'mumps.global');
    addLocalVariableTokens(tokens, occupied, lineNumber, line.code);
  }

  return tokens.sort((left, right) => left.line - right.line || left.start - right.start || tokenTypeOrder(left.type) - tokenTypeOrder(right.type));
}

function addLabelParameters(tokens: ClassifiedMumpsSemanticToken[], occupied: Array<{ start: number; end: number }>, line: number, code: string, start: number): void {
  const end = code.indexOf(')', start);
  const limit = end === -1 ? code.length : end;
  IDENTIFIER_PATTERN.lastIndex = start;
  let match: RegExpExecArray | null;
  while ((match = IDENTIFIER_PATTERN.exec(code)) !== null) {
    if (match.index >= limit) {
      break;
    }
    addToken(tokens, occupied, line, match.index, match.index + match[0].length, 'mumps.parameter');
  }
}

function addLocalVariableTokens(tokens: ClassifiedMumpsSemanticToken[], occupied: Array<{ start: number; end: number }>, line: number, code: string): void {
  IDENTIFIER_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = IDENTIFIER_PATTERN.exec(code)) !== null) {
    const start = match.index;
    const end = start + match[0].length;
    const previous = code[start - 1] ?? '';
    if (previous === '$' || previous === '^' || previous === '%' || isKnownMumpsCommand(match[0])) {
      continue;
    }
    addToken(tokens, occupied, line, start, end, 'mumps.localVariable');
  }
}

function addPatternTokens(
  tokens: ClassifiedMumpsSemanticToken[],
  occupied: Array<{ start: number; end: number }>,
  line: number,
  code: string,
  pattern: RegExp,
  classify: (value: string, start: number, end: number) => MumpsSemanticTokenType | null
): void {
  pattern.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(code)) !== null) {
    const type = classify(match[0], match.index, match.index + match[0].length);
    if (!type) {
      continue;
    }
    addToken(tokens, occupied, line, match.index, match.index + match[0].length, type);
  }
}

function addToken(
  tokens: ClassifiedMumpsSemanticToken[],
  occupied: Array<{ start: number; end: number }>,
  line: number,
  start: number,
  end: number,
  type: MumpsSemanticTokenType
): void {
  if (end <= start || !TOKEN_TYPE_SET.has(type) || occupied.some((range) => rangesOverlap(start, end, range.start, range.end))) {
    return;
  }
  tokens.push({ line, start, length: end - start, type });
  occupied.push({ start, end });
}

function rangesOverlap(leftStart: number, leftEnd: number, rightStart: number, rightEnd: number): boolean {
  return leftStart < rightEnd && rightStart < leftEnd;
}

function tokenTypeOrder(type: MumpsSemanticTokenType): number {
  return MUMPS_SEMANTIC_TOKEN_TYPES.indexOf(type);
}
