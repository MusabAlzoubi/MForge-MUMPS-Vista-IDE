import { isKnownMumpsCommand, normalizeMumpsCommand } from './mumpsCommands';
import { MumpsCommandToken, MumpsGlobalToken, MumpsStringSpan, ParsedMumpsLine } from './types';

const LABEL_PATTERN = /^%?[A-Za-z][A-Za-z0-9]*(?:\([^;\s]*\))?/;
const INVALID_LABEL_PATTERN = /^\S+/;
const COMMAND_PATTERN = /(^|\s)([A-Za-z][A-Za-z0-9]*)(?=:|\s|$)/g;
const GLOBAL_PATTERN = /\^%?[A-Za-z][A-Za-z0-9]*/g;

export function parseMumpsLine(raw: string, lineNumber?: number): ParsedMumpsLine {
  const commentStart = findCommentStart(raw);
  const code = commentStart === null ? raw : raw.slice(0, commentStart);
  const comment = commentStart === null ? null : raw.slice(commentStart);
  const strings = collectStringSpans(raw, commentStart);
  const commandTextStart = findCommandTextStart(code);
  const { label, labelStart, labelEnd, invalidLabel, invalidLabelStart } = parseLabel(code, commandTextStart);

  return {
    raw,
    lineNumber,
    code,
    comment,
    commentStart,
    label,
    labelStart,
    labelEnd,
    invalidLabel,
    invalidLabelStart,
    dotBlockLevel: countDotBlockLevel(code, commandTextStart),
    commandTextStart,
    commands: collectCommands(code, commandTextStart),
    globals: collectGlobals(code),
    strings,
    hasUnterminatedString: strings.some((span) => !span.closed),
    parenBalance: countParenBalance(code),
    hasTrailingWhitespace: /[ \t]+$/.test(raw)
  };
}

export function parseMumpsDocument(text: string): ParsedMumpsLine[] {
  return text.split(/\r?\n/).map((line, index) => parseMumpsLine(line, index));
}

export function isCommandKnown(command: MumpsCommandToken): boolean {
  return isKnownMumpsCommand(command.token);
}

function findCommentStart(raw: string): number | null {
  let inString = false;
  for (let index = 0; index < raw.length; index++) {
    const char = raw[index];
    if (char === '"') {
      if (inString && raw[index + 1] === '"') {
        index++;
        continue;
      }
      inString = !inString;
      continue;
    }
    if (char === ';' && !inString) {
      return index;
    }
  }
  return null;
}

function collectStringSpans(raw: string, commentStart: number | null): MumpsStringSpan[] {
  const limit = commentStart ?? raw.length;
  const spans: MumpsStringSpan[] = [];
  let start: number | null = null;
  for (let index = 0; index < limit; index++) {
    if (raw[index] !== '"') {
      continue;
    }
    if (start !== null && raw[index + 1] === '"') {
      index++;
      continue;
    }
    if (start === null) {
      start = index;
    } else {
      spans.push({ start, end: index + 1, closed: true });
      start = null;
    }
  }
  if (start !== null) {
    spans.push({ start, end: limit, closed: false });
  }
  return spans;
}

function findCommandTextStart(code: string): number {
  const firstNonWhitespace = code.search(/\S/);
  if (firstNonWhitespace === -1) {
    return code.length;
  }

  if (firstNonWhitespace > 0) {
    return firstNonWhitespace;
  }

  const labelMatch = LABEL_PATTERN.exec(code);
  if (!labelMatch) {
    return firstNonWhitespace;
  }

  const next = labelMatch[0].length;
  if (next >= code.length || /\s/.test(code[next] ?? '')) {
    return skipWhitespace(code, next);
  }

  return firstNonWhitespace;
}

function parseLabel(code: string, commandTextStart: number): Pick<ParsedMumpsLine, 'label' | 'labelStart' | 'labelEnd' | 'invalidLabel' | 'invalidLabelStart'> {
  const firstNonWhitespace = code.search(/\S/);
  if (firstNonWhitespace !== 0) {
    return { label: null, labelStart: null, labelEnd: null, invalidLabel: null, invalidLabelStart: null };
  }

  const labelMatch = LABEL_PATTERN.exec(code);
  if (labelMatch && (labelMatch[0].length === code.length || /\s/.test(code[labelMatch[0].length] ?? ''))) {
    const labelName = labelMatch[0].split('(')[0] ?? labelMatch[0];
    return { label: labelName, labelStart: 0, labelEnd: labelName.length, invalidLabel: null, invalidLabelStart: null };
  }

  const invalidMatch = INVALID_LABEL_PATTERN.exec(code);
  if (invalidMatch && commandTextStart === 0) {
    return { label: null, labelStart: null, labelEnd: null, invalidLabel: invalidMatch[0], invalidLabelStart: 0 };
  }

  return { label: null, labelStart: null, labelEnd: null, invalidLabel: null, invalidLabelStart: null };
}

function countDotBlockLevel(code: string, commandTextStart: number): number {
  let index = commandTextStart;
  let level = 0;
  while (code[index] === '.') {
    level++;
    index++;
    if (code[index] === ' ') {
      index++;
    }
  }
  return level;
}

function collectCommands(code: string, commandTextStart: number): MumpsCommandToken[] {
  const commandArea = code.slice(commandTextStart);
  const commands: MumpsCommandToken[] = [];
  let match: RegExpExecArray | null;
  COMMAND_PATTERN.lastIndex = 0;
  while ((match = COMMAND_PATTERN.exec(commandArea)) !== null) {
    const token = match[2];
    if (!token) {
      continue;
    }
    const start = commandTextStart + match.index + (match[1]?.length ?? 0);
    if (isLikelyCommandContext(commandArea, match.index, token)) {
      commands.push({ token, normalized: normalizeMumpsCommand(token), start, end: start + token.length });
    }
  }
  return commands;
}

function isLikelyCommandContext(commandArea: string, matchIndex: number, token: string): boolean {
  const before = commandArea.slice(0, matchIndex).trimEnd();
  if (before === '' || before.endsWith('  ') || before.endsWith('.') || before.endsWith(':')) {
    return true;
  }
  return isKnownMumpsCommand(token);
}

function collectGlobals(code: string): MumpsGlobalToken[] {
  const globals: MumpsGlobalToken[] = [];
  let match: RegExpExecArray | null;
  GLOBAL_PATTERN.lastIndex = 0;
  while ((match = GLOBAL_PATTERN.exec(code)) !== null) {
    globals.push({ token: match[0], start: match.index, end: match.index + match[0].length });
  }
  return globals;
}

function countParenBalance(code: string): number {
  let balance = 0;
  let inString = false;
  for (let index = 0; index < code.length; index++) {
    const char = code[index];
    if (char === '"') {
      if (inString && code[index + 1] === '"') {
        index++;
        continue;
      }
      inString = !inString;
      continue;
    }
    if (inString) {
      continue;
    }
    if (char === '(') {
      balance++;
    } else if (char === ')') {
      balance--;
    }
  }
  return balance;
}

function skipWhitespace(text: string, start: number): number {
  let index = start;
  while (index < text.length && /\s/.test(text[index] ?? '')) {
    index++;
  }
  return index;
}
