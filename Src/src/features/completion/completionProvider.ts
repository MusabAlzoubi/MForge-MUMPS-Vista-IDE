import * as vscode from 'vscode';
import { parseMumpsRoutine } from '../../parser/routineParser';
import { MumpsRoutineIndex } from '../navigation/routineIndex';
import { createMumpsCompletionItems } from './completionItems';

export class MumpsCompletionProvider implements vscode.CompletionItemProvider {
  constructor(private readonly routineIndex: MumpsRoutineIndex) {}

  async provideCompletionItems(document: vscode.TextDocument): Promise<vscode.CompletionItem[]> {
    await this.routineIndex.ensureBuilt();
    const labels = parseMumpsRoutine(document.getText()).labels;
    return createMumpsCompletionItems(labels, this.routineIndex.getRoutines());
  }
}
