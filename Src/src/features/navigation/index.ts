import * as vscode from 'vscode';
import { MUMPS_LANGUAGE_ID } from '../../config/language';
import { registerSymbolsFeature } from '../symbols';
import { MumpsDefinitionProvider } from './definitionProvider';
import { MumpsRoutineIndex } from './routineIndex';

export function registerNavigationFeature(context: vscode.ExtensionContext, output?: vscode.OutputChannel): void {
  if (!isNavigationEnabled()) {
    output?.appendLine('Stage 3 navigation is disabled by mforge.navigation.enabled.');
    return;
  }

  const routineIndex = new MumpsRoutineIndex(output);
  routineIndex.registerWatchers(context);
  context.subscriptions.push(
    routineIndex,
    vscode.languages.registerDefinitionProvider(MUMPS_LANGUAGE_ID, new MumpsDefinitionProvider(routineIndex, output))
  );
  registerSymbolsFeature(context, routineIndex);
}

function isNavigationEnabled(): boolean {
  return vscode.workspace.getConfiguration('mforge').get<boolean>('navigation.enabled', true);
}
