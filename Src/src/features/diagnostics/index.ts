import * as vscode from 'vscode';
import { MUMPS_LANGUAGE_ID } from '../../config/language';
import { analyzeMumpsDocument } from './diagnostics';

export function registerDiagnosticsFeature(context: vscode.ExtensionContext): void {
  const collection = vscode.languages.createDiagnosticCollection('mforge-mumps');
  context.subscriptions.push(collection);

  const refresh = (document: vscode.TextDocument): void => {
    if (document.languageId !== MUMPS_LANGUAGE_ID) {
      return;
    }

    if (!isDiagnosticsEnabled()) {
      collection.delete(document.uri);
      return;
    }

    collection.set(document.uri, analyzeMumpsDocument(document));
  };

  for (const document of vscode.workspace.textDocuments) {
    refresh(document);
  }

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(refresh),
    vscode.workspace.onDidChangeTextDocument((event) => refresh(event.document)),
    vscode.workspace.onDidSaveTextDocument(refresh),
    vscode.workspace.onDidCloseTextDocument((document) => collection.delete(document.uri)),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (!event.affectsConfiguration('mforge.diagnostics.enabled')) {
        return;
      }
      for (const document of vscode.workspace.textDocuments) {
        refresh(document);
      }
    })
  );
}

function isDiagnosticsEnabled(): boolean {
  return vscode.workspace.getConfiguration('mforge').get<boolean>('diagnostics.enabled', true);
}
