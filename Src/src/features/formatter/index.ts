import * as vscode from 'vscode';
import { MUMPS_LANGUAGE_ID } from '../../config/language';
import { formatMumpsDocumentText, suggestIndentationForNewLine } from './formatter';

export function registerFormatterFeature(context: vscode.ExtensionContext): void {
  const provider: vscode.DocumentFormattingEditProvider = {
    provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
      if (!isFormatterEnabled()) {
        return [];
      }

      const original = document.getText();
      const formatted = formatMumpsDocumentText(original);
      if (formatted === original) {
        return [];
      }

      const lastLine = document.lineAt(document.lineCount - 1);
      const fullRange = new vscode.Range(new vscode.Position(0, 0), lastLine.rangeIncludingLineBreak.end);
      return [vscode.TextEdit.replace(fullRange, formatted)];
    }
  };

  const indentationProvider: vscode.OnTypeFormattingEditProvider = {
    provideOnTypeFormattingEdits(document: vscode.TextDocument, position: vscode.Position, ch: string): vscode.TextEdit[] {
      if (!isFormatterEnabled() || ch !== '\n' || position.line === 0) {
        return [];
      }

      const currentLine = document.lineAt(position.line).text;
      if (currentLine.slice(0, position.character).trim() !== '') {
        return [];
      }

      const previousLine = document.lineAt(position.line - 1).text;
      const indentation = suggestIndentationForNewLine(previousLine);
      if (indentation === '') {
        return [];
      }

      return [vscode.TextEdit.insert(new vscode.Position(position.line, 0), indentation)];
    }
  };

  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider(MUMPS_LANGUAGE_ID, provider),
    vscode.languages.registerOnTypeFormattingEditProvider(MUMPS_LANGUAGE_ID, indentationProvider, '\n')
  );
}

function isFormatterEnabled(): boolean {
  return vscode.workspace.getConfiguration('mforge').get<boolean>('formatter.enabled', true);
}
