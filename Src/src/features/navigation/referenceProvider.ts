import * as vscode from 'vscode';
import { isMumpsUri } from '../../config/language';
import { findMumpsReferenceAt, findMumpsReferencesInLine } from '../../parser/routineParser';
import { MumpsReference } from '../../parser/types';
import { MumpsRoutineIndex } from './routineIndex';

export class MumpsReferenceProvider implements vscode.ReferenceProvider {
  constructor(private readonly routineIndex: MumpsRoutineIndex) {}

  async provideReferences(document: vscode.TextDocument, position: vscode.Position, context: vscode.ReferenceContext): Promise<vscode.Location[]> {
    if (!isMumpsUri(document.uri, document.languageId)) {
      return [];
    }

    const target = await this.resolveTarget(document, position);
    if (!target) {
      return [];
    }

    await this.routineIndex.ensureBuilt();
    const locations: vscode.Location[] = [];

    if (context.includeDeclaration) {
      const declaration = this.declarationForTarget(document, target);
      if (declaration) {
        locations.push(declaration);
      }
    }

    for (const routine of this.routineIndex.getRoutines()) {
      const text = await this.getRoutineText(routine.uri, document);
      if (text === null) {
        continue;
      }
      const lines = text.split(/\r?\n/u);
      for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
        for (const reference of findMumpsReferencesInLine(lines[lineNumber] ?? '')) {
          if (referencesTarget(reference, target)) {
            locations.push(new vscode.Location(routine.uri, new vscode.Range(lineNumber, reference.startCharacter, lineNumber, reference.endCharacter)));
          }
        }
      }
    }

    return dedupeLocations(locations);
  }

  private async resolveTarget(document: vscode.TextDocument, position: vscode.Position): Promise<MumpsReference | null> {
    const reference = findMumpsReferenceAt(document.lineAt(position.line).text, position.character);
    if (reference) {
      return reference;
    }

    const parsed = this.routineIndex.parseDocument(document);
    const label = parsed?.labels.find((candidate) => candidate.line === position.line && position.character >= candidate.nameStartCharacter && position.character <= candidate.nameEndCharacter);
    if (!label) {
      return null;
    }
    await this.routineIndex.ensureBuilt();
    const routine = this.routineIndex.findRoutineByUri(document.uri);
    return { label: label.name, routine: routine?.name ?? null, startCharacter: label.nameStartCharacter, endCharacter: label.nameEndCharacter, labelStartCharacter: label.nameStartCharacter, labelEndCharacter: label.nameEndCharacter, routineStartCharacter: null, routineEndCharacter: null, raw: label.name };
  }

  private declarationForTarget(document: vscode.TextDocument, target: MumpsReference): vscode.Location | null {
    if (target.routine) {
      const routine = this.routineIndex.findRoutine(target.routine);
      if (!routine) {
        return null;
      }
      if (!target.label) {
        return new vscode.Location(routine.uri, new vscode.Range(0, 0, 0, 0));
      }
      const label = routine.labels.find((candidate) => candidate.name.toUpperCase() === target.label?.toUpperCase());
      return label ? new vscode.Location(routine.uri, new vscode.Range(label.line, label.nameStartCharacter, label.line, label.nameEndCharacter)) : null;
    }

    if (!target.label) {
      return null;
    }
    const label = this.routineIndex.parseDocument(document)?.labels.find((candidate) => candidate.name.toUpperCase() === target.label?.toUpperCase());
    return label ? new vscode.Location(document.uri, new vscode.Range(label.line, label.nameStartCharacter, label.line, label.nameEndCharacter)) : null;
  }

  private async getRoutineText(uri: vscode.Uri, fallbackDocument: vscode.TextDocument): Promise<string | null> {
    if (uri.toString() === fallbackDocument.uri.toString()) {
      return fallbackDocument.getText();
    }
    const openDocument = vscode.workspace.textDocuments.find((document) => document.uri.toString() === uri.toString());
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
}

function referencesTarget(reference: MumpsReference, target: MumpsReference): boolean {
  if (target.routine) {
    return reference.routine?.toUpperCase() === target.routine.toUpperCase()
      && (!target.label || reference.label?.toUpperCase() === target.label.toUpperCase());
  }
  return Boolean(target.label) && !reference.routine && reference.label?.toUpperCase() === target.label?.toUpperCase();
}

function dedupeLocations(locations: vscode.Location[]): vscode.Location[] {
  const seen = new Set<string>();
  const result: vscode.Location[] = [];
  for (const location of locations) {
    const key = `${location.uri.toString()}:${location.range.start.line}:${location.range.start.character}:${location.range.end.line}:${location.range.end.character}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(location);
    }
  }
  return result;
}
