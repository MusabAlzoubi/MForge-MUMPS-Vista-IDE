import * as vscode from 'vscode';
import { MUMPS_LANGUAGE_ID } from '../../config/language';
import { MumpsHoverProvider } from './hoverProvider';

export function registerHoverFeature(context: vscode.ExtensionContext, output?: vscode.OutputChannel): void {
  if (!isHoverEnabled()) {
    output?.appendLine('Stage 4 hover is disabled by mforge.hover.enabled.');
    return;
  }

  context.subscriptions.push(vscode.languages.registerHoverProvider(MUMPS_LANGUAGE_ID, new MumpsHoverProvider()));
}

function isHoverEnabled(): boolean {
  return vscode.workspace.getConfiguration('mforge').get<boolean>('hover.enabled', true);
}
