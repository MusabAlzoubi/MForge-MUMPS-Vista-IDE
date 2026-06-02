import * as vscode from 'vscode';
import { MUMPS_LANGUAGE_ID } from '../../config/language';
import { MumpsRoutineIndex } from '../navigation/routineIndex';
import { MumpsDocumentSymbolProvider } from './documentSymbols';
import { MumpsWorkspaceSymbolProvider } from './workspaceSymbols';

export function registerSymbolsFeature(context: vscode.ExtensionContext, routineIndex: MumpsRoutineIndex): void {
  context.subscriptions.push(
    vscode.languages.registerDocumentSymbolProvider(MUMPS_LANGUAGE_ID, new MumpsDocumentSymbolProvider()),
    vscode.languages.registerWorkspaceSymbolProvider(new MumpsWorkspaceSymbolProvider(routineIndex))
  );
}
