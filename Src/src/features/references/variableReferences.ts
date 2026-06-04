import * as vscode from 'vscode';
import { findMumpsReferencesInLine } from '../../parser/routineParser';
import { parseMumpsLine } from '../../parser/mumpsLineParser';
import { ParsedMumpsLine } from '../../parser/types';

const IDENTIFIER_PATTERN = /%?[A-Za-z][A-Za-z0-9]*/y;

export interface IdentifierOccurrence {
  name: string;
  range: vscode.Range;
}

interface IdentifierAtPosition {
  name: string;
  start: number;
  end: number;
}

export function findVariableAtPosition(document: vscode.TextDocument, position: vscode.Position): IdentifierOccurrence | null {
  const lineText = document.lineAt(position.line).text;
  const parsed = parseMumpsLine(lineText, position.line);
  const identifier = getIdentifierAtPosition(parsed, position.character);
  if (!identifier || !isVariableIdentifier(parsed, identifier)) {
    return null;
  }
  return {
    name: identifier.name,
    range: new vscode.Range(position.line, identifier.start, position.line, identifier.end)
  };
}

export function findLocalVariableReferences(document: vscode.TextDocument, variableName: string, maxResults = Number.MAX_SAFE_INTEGER): vscode.Location[] {
  const target = variableName.toUpperCase();
  const locations: vscode.Location[] = [];

  for (let lineNumber = 0; lineNumber < document.lineCount && locations.length < maxResults; lineNumber++) {
    const parsed = parseMumpsLine(document.lineAt(lineNumber).text, lineNumber);
    const identifiers = findVariableIdentifiersInParsedLine(parsed);
    for (const identifier of identifiers) {
      if (identifier.name.toUpperCase() === target) {
        locations.push(new vscode.Location(document.uri, new vscode.Range(lineNumber, identifier.start, lineNumber, identifier.end)));
        if (locations.length >= maxResults) {
          break;
        }
      }
    }
  }

  return locations;
}

function findVariableIdentifiersInParsedLine(parsed: ParsedMumpsLine): IdentifierAtPosition[] {
  const identifiers: IdentifierAtPosition[] = [];
  for (let index = 0; index < parsed.code.length; index++) {
    if (isInsideString(index, parsed) || isCommandToken(index, parsed) || isLabelToken(index, parsed) || isRoutineReferenceToken(index, parsed)) {
      continue;
    }
    const identifier = readIdentifier(parsed.code, index);
    if (!identifier) {
      continue;
    }
    if (isVariableIdentifier(parsed, identifier)) {
      identifiers.push(identifier);
    }
    index = identifier.end - 1;
  }
  return identifiers;
}

function getIdentifierAtPosition(parsed: ParsedMumpsLine, character: number): IdentifierAtPosition | null {
  if (character > parsed.code.length || isInsideString(character, parsed)) {
    return null;
  }
  let start = character;
  while (start > 0 && /[A-Za-z0-9%]/u.test(parsed.code[start - 1] ?? '')) {
    start--;
  }
  const identifier = readIdentifier(parsed.code, start);
  if (!identifier || character < identifier.start || character > identifier.end) {
    return null;
  }
  return identifier;
}

function readIdentifier(code: string, start: number): IdentifierAtPosition | null {
  IDENTIFIER_PATTERN.lastIndex = start;
  const match = IDENTIFIER_PATTERN.exec(code);
  if (!match || match.index !== start) {
    return null;
  }
  return { name: match[0], start, end: start + match[0].length };
}

function isVariableIdentifier(parsed: ParsedMumpsLine, identifier: IdentifierAtPosition): boolean {
  if (identifier.name.startsWith('%')) {
    return false;
  }
  return !isLabelToken(identifier.start, parsed)
    && !isCommandToken(identifier.start, parsed)
    && !isRoutineReferenceToken(identifier.start, parsed)
    && !isIntrinsicName(identifier, parsed)
    && !isGlobalReference(identifier, parsed)
    && !isIndirection(identifier, parsed);
}

function isLabelToken(index: number, parsed: ParsedMumpsLine): boolean {
  return parsed.labelStart !== null && parsed.labelEnd !== null && index >= parsed.labelStart && index < parsed.labelEnd;
}

function isCommandToken(index: number, parsed: ParsedMumpsLine): boolean {
  return parsed.commands.some((command) => index >= command.start && index < command.end);
}

function isRoutineReferenceToken(index: number, parsed: ParsedMumpsLine): boolean {
  return findMumpsReferencesInLine(parsed.raw).some((reference) => {
    const start = Math.min(reference.labelStartCharacter ?? reference.startCharacter, reference.routineStartCharacter ?? reference.startCharacter);
    const end = Math.max(reference.labelEndCharacter ?? reference.endCharacter, reference.routineEndCharacter ?? reference.endCharacter);
    return index >= start && index < end;
  });
}

function isIntrinsicName(identifier: IdentifierAtPosition, parsed: ParsedMumpsLine): boolean {
  return parsed.code[identifier.start - 1] === '$';
}

function isGlobalReference(identifier: IdentifierAtPosition, parsed: ParsedMumpsLine): boolean {
  return parsed.code[identifier.start - 1] === '^';
}

function isIndirection(identifier: IdentifierAtPosition, parsed: ParsedMumpsLine): boolean {
  return parsed.code[identifier.start - 1] === '@';
}

function isInsideString(index: number, parsed: ParsedMumpsLine): boolean {
  return parsed.strings.some((span) => index >= span.start && index < span.end);
}
