import * as vscode from 'vscode';
import { MUMPS_LANGUAGE_ID } from '../../config/language';
import { MumpsRoutineIndex } from '../navigation/routineIndex';
import { isReferencesEnabled, MForgeReferenceProvider } from './referenceProvider';

export function registerReferencesFeature(context: vscode.ExtensionContext, routineIndex: MumpsRoutineIndex | null, output?: vscode.OutputChannel): void {
  if (!routineIndex) {
    output?.appendLine('Stage 5.1 Find References is unavailable because the routine index is disabled.');
    return;
  }
  if (!isReferencesEnabled()) {
    output?.appendLine('Stage 5.1 Find References is disabled by mforge.references.enabled.');
    return;
  }
  context.subscriptions.push(vscode.languages.registerReferenceProvider(MUMPS_LANGUAGE_ID, new MForgeReferenceProvider(routineIndex, output)));
}

export { MForgeReferenceProvider } from './referenceProvider';
export { findReferencesForTarget, resolveReferenceTarget } from './referenceSearch';
export { findLocalVariableReferences, findVariableAtPosition } from './variableReferences';
