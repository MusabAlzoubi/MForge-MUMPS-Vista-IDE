import * as vscode from 'vscode';
import { MUMPS_LANGUAGE_ID } from '../../config/language';
import { MumpsRoutineIndex } from '../navigation/routineIndex';

export class MumpsWorkspaceSymbolProvider implements vscode.WorkspaceSymbolProvider {
  constructor(private readonly routineIndex: MumpsRoutineIndex) {}

  async provideWorkspaceSymbols(query: string): Promise<vscode.SymbolInformation[]> {
    const normalizedQuery = query.trim().toUpperCase();
    await this.routineIndex.ensureBuilt();
    const symbols: vscode.SymbolInformation[] = [];

    for (const routine of this.routineIndex.getRoutines()) {
      if (matchesQuery(routine.name, normalizedQuery)) {
        symbols.push(new vscode.SymbolInformation(
          routine.name,
          vscode.SymbolKind.Module,
          'MUMPS routine',
          new vscode.Location(routine.uri, new vscode.Range(0, 0, 0, 0))
        ));
      }

      for (const label of routine.labels) {
        const labelName = label.signature;
        const qualifiedName = `${label.name}^${routine.name}`;
        if (!matchesQuery(label.name, normalizedQuery) && !matchesQuery(qualifiedName, normalizedQuery)) {
          continue;
        }
        symbols.push(new vscode.SymbolInformation(
          qualifiedName,
          vscode.SymbolKind.Function,
          routine.name,
          new vscode.Location(routine.uri, new vscode.Range(label.line, label.nameStartCharacter, label.line, label.nameEndCharacter))
        ));
        if (matchesQuery(labelName, normalizedQuery) && label.signature !== label.name) {
          symbols.push(new vscode.SymbolInformation(
            labelName,
            vscode.SymbolKind.Function,
            routine.name,
            new vscode.Location(routine.uri, new vscode.Range(label.line, label.startCharacter, label.line, label.endCharacter))
          ));
        }
      }
    }

    return symbols;
  }
}

function matchesQuery(value: string, normalizedQuery: string): boolean {
  return normalizedQuery.length === 0 || value.toUpperCase().includes(normalizedQuery);
}
