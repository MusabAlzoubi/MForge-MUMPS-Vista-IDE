import { isKnownMumpsCommand, normalizeMumpsCommand } from './mumpsCommands';
import { parseMumpsDocument, parseMumpsLine } from './mumpsLineParser';
import { MumpsLabel, MumpsReference, ParsedMumpsLine, RoutineParseResult } from './types';

const LABEL_WITH_PARAMS_PATTERN = /^((?:%?[A-Za-z][A-Za-z0-9]*))(?:\(([^;\s]*)\))?/;
const ROUTINE_NAME_PATTERN = /^%?[A-Za-z][A-Za-z0-9]*$/;
const REFERENCE_NAME_PATTERN = /%?[A-Za-z][A-Za-z0-9]*/y;

export function parseMumpsRoutine(text: string, routineName?: string): RoutineParseResult {
  const lines = parseMumpsDocument(text);
  const labels: MumpsLabel[] = [];

  for (const line of lines) {
    const label = parseRoutineLabelFromLine(line);
    if (label) {
      labels.push(label);
    }
  }

  return { routineName, labels, lines };
}

export function parseRoutineLabelFromText(text: string, lineNumber = 0): MumpsLabel | null {
  return parseRoutineLabelFromLine(parseMumpsLine(text, lineNumber));
}

export function parseRoutineLabelFromLine(line: ParsedMumpsLine): MumpsLabel | null {
  if (!line.label || line.labelStart === null || line.labelEnd === null) {
    return null;
  }

  const match = LABEL_WITH_PARAMS_PATTERN.exec(line.code);
  if (!match || !match[1]) {
    return null;
  }

  const parametersText = match[2] ?? null;
  const parameters = parametersText === null || parametersText.length === 0
    ? []
    : parametersText.split(',').map((parameter) => parameter.trim()).filter((parameter) => parameter.length > 0);
  const signature = match[0];
  const lineNumber = line.lineNumber ?? 0;

  return {
    name: match[1],
    parameters,
    signature,
    line: lineNumber,
    startCharacter: line.labelStart,
    endCharacter: line.labelStart + signature.length,
    nameStartCharacter: line.labelStart,
    nameEndCharacter: line.labelEnd
  };
}

export function findMumpsReferenceAt(lineText: string, character: number): MumpsReference | null {
  const parsed = parseMumpsLine(lineText);
  const codeLimit = parsed.commentStart ?? lineText.length;
  if (character > codeLimit) {
    return null;
  }

  const references = findMumpsReferencesInLine(lineText);
  return references.find((reference) => referenceContainsPosition(reference, character)) ?? null;
}

export function referenceContainsPosition(reference: MumpsReference, character: number): boolean {
  const visibleStart = Math.min(
    reference.labelStartCharacter ?? reference.startCharacter,
    reference.routineStartCharacter ?? reference.startCharacter,
    reference.startCharacter
  );
  const visibleEnd = Math.max(
    reference.labelEndCharacter ?? reference.endCharacter,
    reference.routineEndCharacter ?? reference.endCharacter,
    reference.endCharacter
  );
  return character >= visibleStart && character <= visibleEnd;
}

export function findMumpsReferencesInLine(lineText: string): MumpsReference[] {
  const parsed = parseMumpsLine(lineText);
  const references: MumpsReference[] = [];
  const code = parsed.code;

  for (let index = 0; index < code.length; index++) {
    if (isInsideString(index, parsed)) {
      continue;
    }

    if (code.startsWith('$$', index)) {
      const reference = readExtrinsicReference(code, index);
      if (reference) {
        references.push(reference);
        index = reference.endCharacter - 1;
      }
      continue;
    }

    if (code[index] === '^') {
      const reference = readCaretRoutineReference(code, index);
      if (reference) {
        references.push(reference);
        index = reference.endCharacter - 1;
      }
      continue;
    }

    if (isDoOrGotoCommandTokenAt(code, index, parsed)) {
      const operandStart = skipSpaces(code, index + readCommandLength(code, index));
      collectCommandLabelReferences(code, operandStart, references, parsed);
    }
  }

  return dedupeReferences(references);
}

function readExtrinsicReference(code: string, start: number): MumpsReference | null {
  const label = readReferenceName(code, start + 2);
  if (!label) {
    return null;
  }

  const routineStart = code[label.end] === '^' ? label.end + 1 : null;
  const routine = routineStart === null ? null : readReferenceName(code, routineStart);
  return {
    label: label.text,
    routine: routine?.text ?? null,
    startCharacter: label.start,
    endCharacter: routine?.end ?? label.end,
    labelStartCharacter: label.start,
    labelEndCharacter: label.end,
    routineStartCharacter: routine?.start ?? null,
    routineEndCharacter: routine?.end ?? null,
    raw: code.slice(label.start, routine?.end ?? label.end)
  };
}

function readCaretRoutineReference(code: string, caretIndex: number): MumpsReference | null {
  const routine = readReferenceName(code, caretIndex + 1);
  if (!routine || !isRoutineName(routine.text)) {
    return null;
  }

  const label = readLabelBeforeRoutine(code, caretIndex);
  return {
    label: label?.text ?? null,
    routine: routine.text,
    startCharacter: label?.start ?? caretIndex,
    endCharacter: routine.end,
    routineStartCharacter: routine.start,
    routineEndCharacter: routine.end,
    labelStartCharacter: label?.start ?? null,
    labelEndCharacter: label?.end ?? null,
    raw: code.slice(label?.start ?? caretIndex, routine.end)
  };
}

function collectCommandLabelReferences(code: string, start: number, references: MumpsReference[], parsed: ParsedMumpsLine): void {
  let index = start;
  while (index < code.length) {
    if (isInsideString(index, parsed)) {
      index++;
      continue;
    }

    const char = code[index];
    if (char === ' ' || char === '\t') {
      const next = skipSpaces(code, index);
      if (next >= code.length || isKnownCommandBoundaryAt(code, next)) {
        break;
      }
      index = next;
      continue;
    }
    if (char === ',') {
      index++;
      continue;
    }
    if (char === ':') {
      index = skipPostconditionalExpression(code, index + 1, parsed);
      continue;
    }
    if (char === '@') {
      index++;
      continue;
    }
    if (char === '$' || char === '^') {
      break;
    }

    const label = readReferenceName(code, index);
    if (!label) {
      index++;
      continue;
    }

    const afterLabel = skipCallArguments(code, label.end);
    const routineStart = code[afterLabel] === '^' ? afterLabel + 1 : null;
    const routine = routineStart === null ? null : readReferenceName(code, routineStart);
    references.push({
      label: label.text,
      routine: routine?.text ?? null,
      startCharacter: label.start,
      endCharacter: routine?.end ?? label.end,
      labelStartCharacter: label.start,
      labelEndCharacter: label.end,
      routineStartCharacter: routine?.start ?? null,
      routineEndCharacter: routine?.end ?? null,
      raw: code.slice(label.start, routine?.end ?? label.end)
    });
    index = routine ? skipCallArguments(code, routine.end) : afterLabel;
  }
}

function readLabelBeforeRoutine(code: string, caretIndex: number): { text: string; start: number; end: number } | null {
  let end = caretIndex;
  while (end > 0 && /\s/.test(code[end - 1] ?? '')) {
    end--;
  }
  if (end > 0 && code[end - 1] === ')') {
    end = findMatchingOpenParenBackward(code, end - 1) ?? end;
  }
  let start = end;
  while (start > 0 && /[A-Za-z0-9%]/.test(code[start - 1] ?? '')) {
    start--;
  }
  if (start === end) {
    return null;
  }
  const text = code.slice(start, end);
  return isRoutineName(text) ? { text, start, end } : null;
}

function readReferenceName(code: string, start: number): { text: string; start: number; end: number } | null {
  REFERENCE_NAME_PATTERN.lastIndex = start;
  const match = REFERENCE_NAME_PATTERN.exec(code);
  if (!match || match.index !== start) {
    return null;
  }
  return { text: match[0], start, end: start + match[0].length };
}

function isRoutineName(name: string): boolean {
  return ROUTINE_NAME_PATTERN.test(name);
}


function isDoOrGotoCommandTokenAt(code: string, index: number, parsed: ParsedMumpsLine): boolean {
  if (isInsideString(index, parsed) || !isCommandTokenBoundaryBefore(code, index)) {
    return false;
  }
  const command = readReferenceName(code, index);
  if (!command || !isCommandTokenBoundaryAfter(code, command.end)) {
    return false;
  }
  const normalized = normalizeMumpsCommand(command.text);
  return normalized === 'DO' || normalized === 'GOTO';
}

function isKnownCommandBoundaryAt(code: string, index: number): boolean {
  if (!isCommandTokenBoundaryBefore(code, index)) {
    return false;
  }
  const command = readReferenceName(code, index);
  return Boolean(command && isCommandTokenBoundaryAfter(code, command.end) && isKnownCommandWord(command.text));
}

function isKnownCommandWord(token: string): boolean {
  return isKnownMumpsCommand(token);
}

function isCommandTokenBoundaryBefore(code: string, index: number): boolean {
  if (index === 0) {
    return true;
  }
  const previous = code[index - 1] ?? '';
  return /\s/u.test(previous) || previous === '.';
}

function isCommandTokenBoundaryAfter(code: string, index: number): boolean {
  const next = code[index] ?? '';
  return next === '' || /\s/u.test(next) || next === ':';
}

function skipPostconditionalExpression(code: string, start: number, parsed: ParsedMumpsLine): number {
  let index = start;
  let depth = 0;
  while (index < code.length) {
    if (isInsideString(index, parsed)) {
      index++;
      continue;
    }
    const char = code[index] ?? '';
    if (char === '(') {
      depth++;
    } else if (char === ')') {
      depth = Math.max(0, depth - 1);
    } else if (depth === 0 && (char === ',' || /\s/u.test(char))) {
      return index;
    }
    index++;
  }
  return index;
}

function dedupeReferences(references: MumpsReference[]): MumpsReference[] {
  const seen = new Set<string>();
  const deduped: MumpsReference[] = [];
  for (const reference of references) {
    const key = `${reference.startCharacter}:${reference.endCharacter}:${reference.label ?? ''}:${reference.routine ?? ''}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(reference);
    }
  }
  return deduped.sort((left, right) => left.startCharacter - right.startCharacter || left.endCharacter - right.endCharacter);
}

function readCommandLength(code: string, index: number): number {
  const command = readReferenceName(code, index);
  return command?.text.length ?? 0;
}

function skipSpaces(code: string, start: number): number {
  let index = start;
  while (code[index] === ' ' || code[index] === '\t') {
    index++;
  }
  return index;
}

function skipCallArguments(code: string, start: number): number {
  if (code[start] !== '(') {
    return start;
  }
  let depth = 0;
  let inString = false;
  for (let index = start; index < code.length; index++) {
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
      depth++;
    } else if (char === ')') {
      depth--;
      if (depth === 0) {
        return index + 1;
      }
    }
  }
  return start;
}

function findMatchingOpenParenBackward(code: string, closeIndex: number): number | null {
  let depth = 0;
  for (let index = closeIndex; index >= 0; index--) {
    if (code[index] === ')') {
      depth++;
    } else if (code[index] === '(') {
      depth--;
      if (depth === 0) {
        return index;
      }
    }
  }
  return null;
}

function isInsideString(index: number, parsed: ParsedMumpsLine): boolean {
  return parsed.strings.some((span) => index >= span.start && index < span.end);
}
