import * as vscode from 'vscode';
import { findMumpsReferenceAt, findMumpsReferencesInLine } from '../../parser/routineParser';
import { MumpsReference } from '../../parser/types';
import { MumpsRoutineIndex, uriKey } from '../navigation/routineIndex';
import { findLocalVariableReferences, findVariableAtPosition } from './variableReferences';

export type ReferenceTargetKind = 'routineReference' | 'localLabel' | 'localVariable';

export interface ReferenceTarget {
  kind: ReferenceTargetKind;
  name: string;
  range: vscode.Range;
  reference?: MumpsReference;
}

export interface ReferenceSearchOptions {
  includeDeclarations: boolean;
  maxResults: number;
  token?: vscode.CancellationToken;
}

export async function resolveReferenceTarget(document: vscode.TextDocument, position: vscode.Position, routineIndex: MumpsRoutineIndex): Promise<ReferenceTarget | null> {
  const lineText = document.lineAt(position.line).text;
  const reference = findMumpsReferenceAt(lineText, position.character);
  if (reference) {
    return {
      kind: reference.routine ? 'routineReference' : 'localLabel',
      name: reference.routine ? `${reference.label ?? ''}^${reference.routine}` : reference.label ?? '',
      range: new vscode.Range(position.line, reference.startCharacter, position.line, reference.endCharacter),
      reference
    };
  }

  const parsed = routineIndex.parseDocument(document);
  const label = parsed?.labels.find((candidate) => candidate.line === position.line
    && position.character >= candidate.nameStartCharacter
    && position.character <= candidate.nameEndCharacter);
  if (label) {
    return {
      kind: 'localLabel',
      name: label.name,
      range: new vscode.Range(position.line, label.nameStartCharacter, position.line, label.nameEndCharacter),
      reference: {
        label: label.name,
        routine: null,
        startCharacter: label.nameStartCharacter,
        endCharacter: label.nameEndCharacter,
        labelStartCharacter: label.nameStartCharacter,
        labelEndCharacter: label.nameEndCharacter,
        routineStartCharacter: null,
        routineEndCharacter: null,
        raw: label.name
      }
    };
  }

  const variable = findVariableAtPosition(document, position);
  if (variable) {
    return { kind: 'localVariable', name: variable.name, range: variable.range };
  }

  return null;
}

export async function findReferencesForTarget(
  document: vscode.TextDocument,
  target: ReferenceTarget,
  routineIndex: MumpsRoutineIndex,
  options: ReferenceSearchOptions
): Promise<vscode.Location[]> {
  if (target.kind === 'localVariable') {
    return findLocalVariableReferences(document, target.name, options.maxResults);
  }

  if (target.kind === 'localLabel') {
    return findLocalLabelReferences(document, target.reference?.label ?? target.name, routineIndex, options);
  }

  return findCrossRoutineReferences(document, target.reference, routineIndex, options);
}

async function findLocalLabelReferences(
  document: vscode.TextDocument,
  labelName: string,
  routineIndex: MumpsRoutineIndex,
  options: ReferenceSearchOptions
): Promise<vscode.Location[]> {
  const locations: vscode.Location[] = [];
  if (options.includeDeclarations) {
    const declaration = findLocalLabelDeclaration(document, labelName, routineIndex);
    if (declaration) {
      locations.push(declaration);
    }
  }
  scanTextForReference(document.uri, document.getText(), (reference) => !reference.routine && sameName(reference.label, labelName), locations, options.maxResults, options.token);
  return dedupeLocations(locations).slice(0, options.maxResults);
}

async function findCrossRoutineReferences(
  document: vscode.TextDocument,
  target: MumpsReference | undefined,
  routineIndex: MumpsRoutineIndex,
  options: ReferenceSearchOptions
): Promise<vscode.Location[]> {
  if (!target?.routine) {
    return [];
  }

  await routineIndex.ensureBuilt();
  const locations: vscode.Location[] = [];
  if (options.includeDeclarations) {
    const declaration = await declarationForCrossRoutineTarget(target, routineIndex);
    if (declaration) {
      locations.push(declaration);
    }
  }

  let scanned = 0;
  for (const routine of routineIndex.getRoutines()) {
    if (options.token?.isCancellationRequested || locations.length >= options.maxResults) {
      break;
    }
    const text = await getRoutineText(routine.uri, document);
    if (text === null) {
      continue;
    }
    scanTextForReference(
      routine.uri,
      text,
      (reference) => referencesCrossRoutineTarget(reference, target),
      locations,
      options.maxResults,
      options.token
    );
    scanned++;
    if (scanned % 50 === 0) {
      await yieldToExtensionHost();
    }
  }
  return dedupeLocations(locations).slice(0, options.maxResults);
}

async function declarationForCrossRoutineTarget(target: MumpsReference, routineIndex: MumpsRoutineIndex): Promise<vscode.Location | null> {
  if (!target.routine) {
    return null;
  }
  const routine = routineIndex.findRoutine(target.routine);
  if (!routine) {
    return null;
  }
  if (!target.label) {
    return new vscode.Location(routine.uri, new vscode.Range(0, 0, 0, 0));
  }
  const labels = await routineIndex.getRoutineLabels(target.routine);
  const label = labels.find((candidate) => sameName(candidate.name, target.label));
  if (label) {
    return new vscode.Location(routine.uri, new vscode.Range(label.line, label.nameStartCharacter, label.line, label.nameEndCharacter));
  }
  return new vscode.Location(routine.uri, new vscode.Range(0, 0, 0, 0));
}

function findLocalLabelDeclaration(document: vscode.TextDocument, labelName: string, routineIndex: MumpsRoutineIndex): vscode.Location | null {
  const label = routineIndex.parseDocument(document)?.labels.find((candidate) => sameName(candidate.name, labelName));
  return label ? new vscode.Location(document.uri, new vscode.Range(label.line, label.nameStartCharacter, label.line, label.nameEndCharacter)) : null;
}

function scanTextForReference(
  uri: vscode.Uri,
  text: string,
  predicate: (reference: MumpsReference) => boolean,
  locations: vscode.Location[],
  maxResults: number,
  token?: vscode.CancellationToken
): void {
  const lines = text.split(/\r?\n/u);
  for (let lineNumber = 0; lineNumber < lines.length && locations.length < maxResults; lineNumber++) {
    if (token?.isCancellationRequested) {
      break;
    }
    for (const reference of findMumpsReferencesInLine(lines[lineNumber] ?? '')) {
      if (predicate(reference)) {
        locations.push(new vscode.Location(uri, new vscode.Range(lineNumber, reference.startCharacter, lineNumber, reference.endCharacter)));
        if (locations.length >= maxResults) {
          break;
        }
      }
    }
  }
}

function referencesCrossRoutineTarget(reference: MumpsReference, target: MumpsReference): boolean {
  return Boolean(target.routine)
    && sameName(reference.routine, target.routine)
    && (!target.label || sameName(reference.label, target.label));
}

async function getRoutineText(uri: vscode.Uri, fallbackDocument: vscode.TextDocument): Promise<string | null> {
  if (uriKey(uri) === uriKey(fallbackDocument.uri)) {
    return fallbackDocument.getText();
  }
  const openDocument = vscode.workspace.textDocuments.find((candidate) => uriKey(candidate.uri) === uriKey(uri));
  if (openDocument) {
    return openDocument.getText();
  }
  try {
    const bytes = await vscode.workspace.fs.readFile(uri);
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    return null;
  }
}

function sameName(left: string | null | undefined, right: string | null | undefined): boolean {
  return typeof left === 'string' && typeof right === 'string' && left.toUpperCase() === right.toUpperCase();
}

function dedupeLocations(locations: vscode.Location[]): vscode.Location[] {
  const seen = new Set<string>();
  const result: vscode.Location[] = [];
  for (const location of locations) {
    const key = `${uriKey(location.uri)}:${location.range.start.line}:${location.range.start.character}:${location.range.end.line}:${location.range.end.character}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(location);
    }
  }
  return result;
}

function yieldToExtensionHost(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
