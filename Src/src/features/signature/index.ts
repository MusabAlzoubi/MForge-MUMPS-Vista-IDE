import * as vscode from 'vscode';
import { MUMPS_LANGUAGE_ID } from '../../config/language';
import { MumpsSignatureProvider } from './signatureProvider';

export function registerSignatureFeature(context: vscode.ExtensionContext, output?: vscode.OutputChannel): void {
  if (!isSignatureHelpEnabled()) {
    output?.appendLine('Stage 4 signature help is disabled by mforge.signatureHelp.enabled.');
    return;
  }

  context.subscriptions.push(vscode.languages.registerSignatureHelpProvider(MUMPS_LANGUAGE_ID, new MumpsSignatureProvider(), '(', ','));
}

function isSignatureHelpEnabled(): boolean {
  return vscode.workspace.getConfiguration('mforge').get<boolean>('signatureHelp.enabled', true);
}
