import * as vscode from 'vscode';
import { MUMPS_LANGUAGE_ID } from '../../config/language';
import { MumpsRoutineIndex } from '../navigation/routineIndex';
import { MumpsCompletionProvider } from './completionProvider';

export function registerCompletionFeature(context: vscode.ExtensionContext, output?: vscode.OutputChannel): void {
  if (!isCompletionEnabled()) {
    output?.appendLine('Stage 4 completion is disabled by mforge.completion.enabled.');
    return;
  }

  const routineIndex = new MumpsRoutineIndex(output);
  routineIndex.registerWatchers(context);
  context.subscriptions.push(
    routineIndex,
    vscode.languages.registerCompletionItemProvider(MUMPS_LANGUAGE_ID, new MumpsCompletionProvider(routineIndex), '$', '^')
  );
}

function isCompletionEnabled(): boolean {
  return vscode.workspace.getConfiguration('mforge').get<boolean>('completion.enabled', true);
}
