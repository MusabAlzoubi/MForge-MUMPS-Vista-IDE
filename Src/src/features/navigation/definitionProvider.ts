import * as vscode from 'vscode';
import { isMumpsUri } from '../../config/language';
import { findMumpsReferenceAt } from '../../parser/routineParser';
import { MumpsReference } from '../../parser/types';
import { MumpsRoutineIndex } from './routineIndex';

export class MumpsDefinitionProvider implements vscode.DefinitionProvider {
  constructor(private readonly routineIndex: MumpsRoutineIndex, private readonly output?: vscode.OutputChannel) {}

  async provideDefinition(document: vscode.TextDocument, position: vscode.Position): Promise<vscode.Definition | null> {
    if (!isMumpsUri(document.uri, document.languageId)) {
      return null;
    }

    const reference = findMumpsReferenceAt(document.lineAt(position.line).text, position.character);
    if (!reference) {
      this.debug('No MUMPS label or routine reference at cursor.');
      return null;
    }

    return this.resolveReference(document, reference);
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
        this.debug(`Label '${reference.label}' not found in routine '${reference.routine}'.`);
        return null;
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
