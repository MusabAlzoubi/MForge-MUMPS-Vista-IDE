import * as vscode from 'vscode';
import { MUMPS_LANGUAGE_ID } from '../../config/language';
import { MUMPS_SEMANTIC_LEGEND, MumpsSemanticTokenProvider } from './semanticTokenProvider';

export function registerSemanticTokenFeature(context: vscode.ExtensionContext, output?: vscode.OutputChannel): void {
  if (!isSemanticHighlightingEnabled()) {
    output?.appendLine('Stage 4.5 semantic highlighting is disabled by mforge.semanticHighlighting.enabled.');
    return;
  }

  context.subscriptions.push(vscode.languages.registerDocumentSemanticTokensProvider(MUMPS_LANGUAGE_ID, new MumpsSemanticTokenProvider(), MUMPS_SEMANTIC_LEGEND));
}

function isSemanticHighlightingEnabled(): boolean {
  return vscode.workspace.getConfiguration('mforge').get<boolean>('semanticHighlighting.enabled', true);
}
