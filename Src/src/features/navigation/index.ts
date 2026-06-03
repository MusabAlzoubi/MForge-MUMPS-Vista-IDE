import * as vscode from 'vscode';
import { MUMPS_LANGUAGE_ID } from '../../config/language';
import { registerSymbolsFeature } from '../symbols';
import { MumpsDefinitionProvider } from './definitionProvider';
import { MumpsDocumentLinkProvider } from './documentLinkProvider';
import { MumpsReferenceProvider } from './referenceProvider';
import { MumpsNavigationHoverProvider } from './navigationHoverProvider';
import { MumpsRoutineIndex } from './routineIndex';
import { registerNavigationDebugCommands } from './debugCommands';

export function registerNavigationFeature(context: vscode.ExtensionContext, output?: vscode.OutputChannel): MumpsRoutineIndex | null {
  if (!isNavigationEnabled()) {
    output?.appendLine('Stage 4.6 navigation is disabled by mforge.navigation.enabled.');
    return null;
  }

  const routineIndex = new MumpsRoutineIndex(output);
  routineIndex.registerWatchers(context);
  context.subscriptions.push(
    routineIndex,
    vscode.languages.registerDefinitionProvider(MUMPS_LANGUAGE_ID, new MumpsDefinitionProvider(routineIndex, output)),
    vscode.languages.registerDocumentLinkProvider(MUMPS_LANGUAGE_ID, new MumpsDocumentLinkProvider(routineIndex, output)),
    vscode.languages.registerReferenceProvider(MUMPS_LANGUAGE_ID, new MumpsReferenceProvider(routineIndex)),
    vscode.languages.registerHoverProvider(MUMPS_LANGUAGE_ID, new MumpsNavigationHoverProvider(routineIndex, output))
  );
  registerNavigationDebugCommands(context, routineIndex, output);
  registerSymbolsFeature(context, routineIndex);
  routineIndex.scheduleAutoRebuildOnActivation();
  return routineIndex;
}


function isNavigationEnabled(): boolean {
  return vscode.workspace.getConfiguration('mforge').get<boolean>('navigation.enabled', true);
}
