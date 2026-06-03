import * as vscode from 'vscode';
import { isMumpsUri } from '../../config/language';
import { normalizeMumpsCommand } from '../../parser/mumpsCommands';
import { parseMumpsLine } from '../../parser/mumpsLineParser';
import { findMumpsReferenceAt } from '../../parser/routineParser';
import { MumpsReference, ParsedMumpsLine } from '../../parser/types';
import { MumpsRoutineIndex } from './routineIndex';

const IDENTIFIER_PATTERN = /%?[A-Za-z][A-Za-z0-9]*/y;
const VARIABLE_DECLARATION_COMMANDS = new Set(['NEW']);
const VARIABLE_ASSIGNMENT_COMMANDS = new Set(['SET']);

interface IdentifierAtPosition {
  name: string;
  start: number;
  end: number;
}

export class MumpsDefinitionProvider implements vscode.DefinitionProvider {
  constructor(private readonly routineIndex: MumpsRoutineIndex, private readonly output?: vscode.OutputChannel) {}

  async provideDefinition(document: vscode.TextDocument, position: vscode.Position): Promise<vscode.Definition | null> {
    if (!isMumpsUri(document.uri, document.languageId)) {
      return null;
    }

    const reference = findMumpsReferenceAt(document.lineAt(position.line).text, position.character);
    if (reference) {
      return this.resolveReference(document, reference);
    }

    const variableDefinition = findLocalVariableDefinition(document, position);
    if (variableDefinition) {
      return variableDefinition;
    }

    this.debug('No MUMPS label, routine, or local variable reference at cursor.');
    return null;
  }

  async resolveReference(document: vscode.TextDocument, reference: MumpsReference): Promise<vscode.Location | null> {
    if (reference.routine) {
      await this.routineIndex.ensureBuilt();
      const routine = this.routineIndex.findRoutine(reference.routine);
      if (!routine) {
        this.debug(`Routine '${reference.routine}' not found in workspace index.`);
        return null;
      }

      if (!reference.label) {
        return new vscode.Location(routine.uri, new vscode.Range(0, 0, 0, 0));
      }

      const label = routine.labels.find((candidate) => candidate.name.toUpperCase() === reference.label?.toUpperCase());
      if (!label) {
        this.debug(`Label '${reference.label}' not found in routine '${reference.routine}'; opening routine top.`);
        return new vscode.Location(routine.uri, new vscode.Range(0, 0, 0, 0));
      }
      return new vscode.Location(routine.uri, new vscode.Range(label.line, label.nameStartCharacter, label.line, label.nameEndCharacter));
    }

    if (reference.label) {
      const localLabel = this.routineIndex.parseDocument(document)?.labels.find((label) => label.name.toUpperCase() === reference.label?.toUpperCase());
      if (!localLabel) {
        this.debug(`Local label '${reference.label}' not found.`);
        return null;
      }
      return new vscode.Location(document.uri, new vscode.Range(localLabel.line, localLabel.nameStartCharacter, localLabel.line, localLabel.nameEndCharacter));
    }

    return null;
  }

  private debug(message: string): void {
    const traceLevel = vscode.workspace.getConfiguration('mforge').get<string>('trace.level', 'off');
    if (traceLevel === 'debug') {
      this.output?.appendLine(`[navigation] ${message}`);
    }
  }
}

function findLocalVariableDefinition(document: vscode.TextDocument, position: vscode.Position): vscode.Location | null {
  const identifier = getIdentifierAtPosition(document.lineAt(position.line).text, position.character);
  if (!identifier || identifier.name.startsWith('%')) {
    return null;
  }

  const targetName = identifier.name.toUpperCase();
  let best: vscode.Location | null = null;
  for (let lineNumber = 0; lineNumber <= position.line; lineNumber++) {
    const lineText = document.lineAt(lineNumber).text;
    const parsed = parseMumpsLine(lineText, lineNumber);
    const limit = lineNumber === position.line ? identifier.start : parsed.code.length;
    for (const candidate of findLocalVariableDefinitionsInParsedLine(parsed, targetName, limit)) {
      best = new vscode.Location(document.uri, new vscode.Range(lineNumber, candidate.start, lineNumber, candidate.end));
    }
  }

  return best;
}

function findLocalVariableDefinitionsInParsedLine(parsed: ParsedMumpsLine, targetName: string, limit: number): IdentifierAtPosition[] {
  const definitions: IdentifierAtPosition[] = [];
  const commands = parsed.commands.filter((command) => command.start < limit);

  for (let commandIndex = 0; commandIndex < commands.length; commandIndex++) {
    const command = commands[commandIndex];
    if (!command) {
      continue;
    }
    const normalized = normalizeMumpsCommand(command.token);
    if (!VARIABLE_DECLARATION_COMMANDS.has(normalized) && !VARIABLE_ASSIGNMENT_COMMANDS.has(normalized)) {
      continue;
    }

    const commandEnd = Math.min(limit, commands[commandIndex + 1]?.start ?? limit);
    const operandsStart = skipSpaces(parsed.code, command.end);
    const definitionsInOperand = normalized === 'NEW'
      ? findNewCommandVariables(parsed, operandsStart, commandEnd)
      : findSetCommandVariables(parsed, operandsStart, commandEnd);
    for (const definition of definitionsInOperand) {
      if (definition.name.toUpperCase() === targetName) {
        definitions.push(definition);
      }
    }
  }

  return definitions;
}

function findNewCommandVariables(parsed: ParsedMumpsLine, start: number, end: number): IdentifierAtPosition[] {
  const variables: IdentifierAtPosition[] = [];
  for (let index = start; index < end; index++) {
    if (isInsideString(index, parsed)) {
      continue;
    }
    const identifier = readIdentifier(parsed.code, index);
    if (!identifier) {
      continue;
    }
    variables.push(identifier);
    index = skipVariableSubscripts(parsed.code, identifier.end) - 1;
  }
  return variables;
}

function findSetCommandVariables(parsed: ParsedMumpsLine, start: number, end: number): IdentifierAtPosition[] {
  const variables: IdentifierAtPosition[] = [];
  let index = start;
  while (index < end) {
    if (isInsideString(index, parsed)) {
      index++;
      continue;
    }
    const identifier = readIdentifier(parsed.code, index);
    if (!identifier) {
      index++;
      continue;
    }
    if (isLocalVariableDefinition(parsed.code, identifier, end)) {
      variables.push(identifier);
    }
    index = Math.max(index + 1, skipToNextSetArgument(parsed.code, identifier.end, end));
  }
  return variables;
}

function isLocalVariableDefinition(code: string, identifier: IdentifierAtPosition, end: number): boolean {
  const previous = code[identifier.start - 1] ?? '';
  if (previous === '$' || previous === '^' || previous === '%' || /[A-Za-z0-9]/u.test(previous)) {
    return false;
  }
  const afterVariable = skipVariableSubscripts(code, identifier.end);
  return afterVariable < end && code[afterVariable] === '=';
}

function getIdentifierAtPosition(lineText: string, character: number): IdentifierAtPosition | null {
  const parsed = parseMumpsLine(lineText);
  if (character > parsed.code.length || isInsideString(character, parsed)) {
    return null;
  }
  let start = character;
  while (start > 0 && /[A-Za-z0-9%]/u.test(lineText[start - 1] ?? '')) {
    start--;
  }
  return readIdentifier(parsed.code, start);
}

function readIdentifier(code: string, start: number): IdentifierAtPosition | null {
  IDENTIFIER_PATTERN.lastIndex = start;
  const match = IDENTIFIER_PATTERN.exec(code);
  if (!match || match.index !== start) {
    return null;
  }
  return { name: match[0], start, end: start + match[0].length };
}

function skipToNextSetArgument(code: string, start: number, end: number): number {
  let depth = 0;
  for (let index = start; index < end; index++) {
    const char = code[index];
    if (char === '(') {
      depth++;
    } else if (char === ')') {
      depth = Math.max(0, depth - 1);
    } else if (char === ',' && depth === 0) {
      return index + 1;
    }
  }
  return end;
}

function skipVariableSubscripts(code: string, start: number): number {
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

function skipSpaces(text: string, start: number): number {
  let index = start;
  while (text[index] === ' ' || text[index] === '\t') {
    index++;
  }
  return index;
}

function isInsideString(index: number, parsed: ParsedMumpsLine): boolean {
  return parsed.strings.some((span) => index >= span.start && index < span.end);
}
