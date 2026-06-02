import * as vscode from 'vscode';
import { parseMumpsRoutine } from '../../parser/routineParser';
import { MumpsLabel } from '../../parser/types';

export function getDocumentLabels(documentText: string): MumpsLabel[] {
  return parseMumpsRoutine(documentText).labels;
}

export class MumpsDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
  provideDocumentSymbols(document: vscode.TextDocument): vscode.DocumentSymbol[] {
    return getDocumentLabels(document.getText()).map((label) => {
      const range = new vscode.Range(label.line, label.startCharacter, label.line, label.endCharacter);
      const selectionRange = new vscode.Range(label.line, label.nameStartCharacter, label.line, label.nameEndCharacter);
      return new vscode.DocumentSymbol(label.signature, 'MUMPS label', vscode.SymbolKind.Function, range, selectionRange);
    });
  }
}
