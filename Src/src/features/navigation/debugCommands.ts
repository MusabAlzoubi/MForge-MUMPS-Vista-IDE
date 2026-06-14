import * as vscode from 'vscode';
import { parseMumpsLine } from '../../parser/mumpsLineParser';
import { findMumpsReferencesInLine, referenceContainsPosition } from '../../parser/routineParser';
import { MumpsReference } from '../../parser/types';
import { MumpsRoutineIndex } from './routineIndex';

const IMPORTANT_ROUTINES = ['UJOWXUS', 'UJOWXUS2', 'XPAR', 'XLFSTR', 'DIE', 'DIQ', 'XLFDT', 'XUS4', 'XTV'];

export function registerNavigationDebugCommands(context: vscode.ExtensionContext, routineIndex: MumpsRoutineIndex, output?: vscode.OutputChannel): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('mforge.debugReferencesInCurrentLine', async () => {
      await debugReferencesInCurrentLine(routineIndex, output);
    }),
    vscode.commands.registerCommand('mforge.rebuildRoutineIndex', async () => {
      await rebuildRoutineIndex(routineIndex, output);
    }),
    vscode.commands.registerCommand('mforge.findRoutineInIndex', async () => {
      await findRoutineInIndex(routineIndex, output);
    }),
    vscode.commands.registerCommand('mforge.showRoutineIndexStatus', async () => {
      await showRoutineIndexStatus(routineIndex, output);
    }),
    vscode.commands.registerCommand('mforge.showNavigationDiagnostics', async () => {
      await showNavigationDiagnostics(routineIndex, output);
    }),
    vscode.commands.registerCommand('mforge.saveDetectedRoutinePathsToSettings', async () => {
      await saveDetectedRoutinePathsToSettings(routineIndex, output);
    })
  );
}

async function debugReferencesInCurrentLine(routineIndex: MumpsRoutineIndex, output?: vscode.OutputChannel): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    output?.appendLine('[navigation-debug] No active editor.');
    output?.show();
    return;
  }

  const document = editor.document;
  const lineNumber = editor.selection.active.line;
  const character = editor.selection.active.character;
  const lineText = document.lineAt(lineNumber).text;
  const parsed = parseMumpsLine(lineText, lineNumber);
  const references = findMumpsReferencesInLine(lineText);

  output?.appendLine('[navigation-debug] Debug References In Current Line');
  output?.appendLine(`[navigation-debug] URI: ${document.uri.toString()}`);
  output?.appendLine(`[navigation-debug] Line ${lineNumber + 1}, cursor character ${character}`);
  output?.appendLine(`[navigation-debug] Full line: ${lineText}`);
  output?.appendLine(`[navigation-debug] Executable: ${parsed.code}`);
  output?.appendLine(`[navigation-debug] References parsed: ${references.length}`);

  await routineIndex.ensureBuilt();
  if (references.length === 0) {
    output?.appendLine('[navigation-debug] No references found on this line.');
  }

  for (const [index, reference] of references.entries()) {
    logReferenceDebug(output, routineIndex, reference, character, index + 1);
  }

  output?.show();
}

async function rebuildRoutineIndex(routineIndex: MumpsRoutineIndex, output?: vscode.OutputChannel): Promise<void> {
  output?.appendLine('[navigation-debug] Rebuilding MUMPS routine index...');
  routineIndex.clear();
  await routineIndex.rebuild();
  const routines = routineIndex.getRoutines();
  const diagnostics = routineIndex.getLastDiagnostics();
  output?.appendLine(`[navigation-debug] Indexed ${routines.length} routine(s), ${routineIndex.getLabelCount()} label(s).`);
  output?.appendLine(`[navigation-debug] Workspace folders: ${diagnostics.workspaceFolders.join(', ') || '(none)'}`);
  output?.appendLine(`[navigation-debug] Include patterns: ${diagnostics.includePatterns.join(', ') || '(none)'}`);
  output?.appendLine(`[navigation-debug] Exclude patterns: ${diagnostics.excludePattern}`);
  output?.appendLine(`[navigation-debug] mforge.maxWorkspaceFiles: ${diagnostics.maxWorkspaceFiles}`);
  output?.appendLine(`[navigation-debug] mforge.maxRoutineSearchPathFiles: ${diagnostics.maxRoutineSearchPathFiles}`);
  output?.appendLine(`[navigation-debug] Elapsed indexing time: ${diagnostics.elapsedMs}ms`);
  output?.appendLine(`[navigation-debug] Limit reached: workspace=${diagnostics.workspaceLimitReached}, searchPaths=${diagnostics.searchPathLimitReached}`);
  output?.appendLine(`[navigation-debug] Indexed source paths: ${diagnostics.indexedSourcePaths.join(', ') || '(none)'}`);
  for (const warning of diagnostics.broadPathWarnings) {
    output?.appendLine(`[navigation-debug] ${warning}`);
  }
  output?.appendLine(`[navigation-debug] manual routine paths: ${diagnostics.manualRoutineSearchPaths.join(', ') || '(none)'}`);
  output?.appendLine(`[navigation-debug] auto-detected routine paths: ${diagnostics.autoDetectedRoutinePaths.join(', ') || '(none)'}`);
  output?.appendLine(`[navigation-debug] effective routine paths: ${diagnostics.effectiveRoutineSearchPaths.join(', ') || '(none)'}`);
  output?.appendLine(`[navigation-debug] mforge.autoDetectRoutinePaths: ${diagnostics.autoDetectRoutinePaths}`);
  output?.appendLine(`[navigation-debug] mforge.autoRebuildIndexOnActivation: ${diagnostics.autoRebuildIndexOnActivation}`);
  output?.appendLine(`[navigation-debug] mforge.indexExtensionlessRoutines: ${diagnostics.indexExtensionlessRoutines}`);
  output?.appendLine(`[navigation-debug] Files discovered: workspace=${diagnostics.workspaceFilesDiscovered}, searchPaths=${diagnostics.searchPathFilesDiscovered}`);
  output?.appendLine(`[navigation-debug] Files skipped: extension=${diagnostics.skippedByExtension}, excludes=${diagnostics.skippedByExcludes}, content=${diagnostics.skippedByContent}`);
  const traceLevel = vscode.workspace.getConfiguration('mforge').get<string>('trace.level', 'off');
  if (traceLevel === 'debug') {
    output?.appendLine(`[navigation-debug] Duplicate routine names: ${diagnostics.duplicateRoutineNames}${diagnostics.duplicateRoutineNameList.length ? ` (${diagnostics.duplicateRoutineNameList.join(', ')})` : ''}`);
    output?.appendLine(`[navigation-debug] First routines: ${routines.slice(0, 20).map((routine) => routine.name).join(', ') || '(none)'}`);
  }
  for (const name of IMPORTANT_ROUTINES) {
    output?.appendLine(`[navigation-debug] ${name}: ${diagnostics.keyRoutineStatus[name] ?? 'not indexed'}`);
  }
  output?.show();
}

async function findRoutineInIndex(routineIndex: MumpsRoutineIndex, output?: vscode.OutputChannel): Promise<void> {
  const name = await vscode.window.showInputBox({ prompt: 'Enter a MUMPS routine name to find in the MForge routine index' });
  const normalized = name?.trim().toUpperCase();
  if (!normalized) {
    return;
  }

  output?.appendLine(`[navigation-debug] Find Routine In Index: ${normalized}`);
  await routineIndex.ensureBuilt();
  const routine = routineIndex.findRoutine(normalized);
  if (routine) {
    output?.appendLine(`[navigation-debug] ${normalized}: FOUND ${routine.uri.toString()}`);
    output?.appendLine(`[navigation-debug] label count: ${routine.labels.length}`);
    output?.show();
    return;
  }

  output?.appendLine(`[navigation-debug] ${normalized}: not indexed.`);
  output?.appendLine('[navigation-debug] Searching configured mforge.routineSearchPaths for possible matching filenames...');
  const candidates = await routineIndex.findRoutineCandidatesInSearchPaths(normalized);
  if (candidates.length === 0) {
    output?.appendLine('[navigation-debug] No possible matches found in configured routine search paths.');
  } else {
    for (const candidate of candidates.slice(0, 20)) {
      output?.appendLine(`[navigation-debug] possible match: ${candidate.toString()}`);
    }
  }
  output?.show();
}


async function showNavigationDiagnostics(routineIndex: MumpsRoutineIndex, output?: vscode.OutputChannel): Promise<void> {
  await routineIndex.ensureBuilt();
  const diagnostics = routineIndex.getLastDiagnostics();
  output?.appendLine('[navigation-debug] MForge Navigation Diagnostics');
  output?.appendLine(`[navigation-debug] Indexed routines: ${routineIndex.getRoutines().length}`);
  output?.appendLine(`[navigation-debug] Indexed labels: ${routineIndex.getLabelCount()}`);
  output?.appendLine(`[navigation-debug] Index source folders: ${diagnostics.indexedSourcePaths.join(', ') || '(none)'}`);
  output?.appendLine(`[navigation-debug] Duplicates removed: ${diagnostics.duplicatesRemoved}`);
  output?.appendLine(`[navigation-debug] Index build time: ${diagnostics.elapsedMs}ms`);
  output?.appendLine(`[navigation-debug] Localr indexed: ${diagnostics.localrIndexed}`);
  output?.appendLine(`[navigation-debug] Routines indexed: ${diagnostics.routinesIndexed}`);
  output?.appendLine(`[navigation-debug] Cache hits: ${diagnostics.cacheHits}`);
  output?.appendLine(`[navigation-debug] Cache misses: ${diagnostics.cacheMisses}`);
  output?.show();
}

async function showRoutineIndexStatus(routineIndex: MumpsRoutineIndex, output?: vscode.OutputChannel): Promise<void> {
  await routineIndex.ensureBuilt();
  const diagnostics = routineIndex.getLastDiagnostics();
  const pathState = await routineIndex.getRoutinePathState(false);
  output?.appendLine('[navigation-debug] MUMPS Routine Index Status');
  output?.appendLine(`[navigation-debug] Indexed routines: ${routineIndex.getRoutines().length}`);
  output?.appendLine(`[navigation-debug] Indexed labels: ${routineIndex.getLabelCount()}`);
  output?.appendLine(`[navigation-debug] Last rebuild time: ${routineIndex.getLastRebuildTime() ?? '(not rebuilt yet)'}`);
  output?.appendLine(`[navigation-debug] Elapsed indexing time: ${diagnostics.elapsedMs}ms`);
  output?.appendLine(`[navigation-debug] Limit reached: workspace=${diagnostics.workspaceLimitReached}, searchPaths=${diagnostics.searchPathLimitReached}`);
  output?.appendLine(`[navigation-debug] Indexed source paths: ${diagnostics.indexedSourcePaths.join(', ') || '(none)'}`);
  for (const warning of diagnostics.broadPathWarnings) {
    output?.appendLine(`[navigation-debug] ${warning}`);
  }
  output?.appendLine(`[navigation-debug] Auto-detection enabled: ${diagnostics.autoDetectRoutinePaths}`);
  output?.appendLine(`[navigation-debug] Auto-rebuild on activation enabled: ${diagnostics.autoRebuildIndexOnActivation}`);
  output?.appendLine(`[navigation-debug] Manual routine paths: ${pathState.manualPaths.join(', ') || '(none)'}`);
  output?.appendLine(`[navigation-debug] Auto-detected routine paths: ${pathState.autoDetectedPaths.join(', ') || '(none)'}`);
  output?.appendLine(`[navigation-debug] Effective routine paths: ${pathState.effectivePaths.join(', ') || '(none)'}`);
  for (const name of IMPORTANT_ROUTINES) {
    const routine = routineIndex.findRoutine(name);
    output?.appendLine(`[navigation-debug] ${name}: ${routine ? `FOUND ${routine.uri.toString()} (${routine.labels.length} label(s))` : 'not indexed'}`);
  }
  if (diagnostics.workspaceLimitReached || diagnostics.searchPathLimitReached) {
    output?.appendLine('[navigation-debug] Next action: increase mforge.maxWorkspaceFiles or mforge.maxRoutineSearchPathFiles if important routines are missing.');
  }
  if (diagnostics.broadPathWarnings.length > 0) {
    output?.appendLine('[navigation-debug] Next action: remove broad parent folders and use routines/localr routine source folders.');
  }
  output?.appendLine('[navigation-debug] Next action: run MForge: Rebuild Routine Index after changing routine search paths.');
  output?.show();
}

async function saveDetectedRoutinePathsToSettings(routineIndex: MumpsRoutineIndex, output?: vscode.OutputChannel): Promise<void> {
  const pathState = await routineIndex.getRoutinePathState(true);
  if (pathState.autoDetectedPaths.length === 0) {
    output?.appendLine('[navigation-debug] No auto-detected routine paths to save.');
    output?.show();
    return;
  }

  const merged = pathState.effectivePaths;
  const selection = await vscode.window.showInformationMessage(
    `Save ${pathState.autoDetectedPaths.length} detected MUMPS routine path(s) to mforge.routineSearchPaths?`,
    'Save',
    'Cancel'
  );
  if (selection !== 'Save') {
    output?.appendLine('[navigation-debug] Save Detected Routine Paths To Settings cancelled.');
    output?.show();
    return;
  }

  await vscode.workspace.getConfiguration('mforge').update('routineSearchPaths', merged, vscode.ConfigurationTarget.Global);
  output?.appendLine(`[navigation-debug] Saved routine paths to mforge.routineSearchPaths: ${merged.join(', ')}`);
  output?.show();
}

function logReferenceDebug(output: vscode.OutputChannel | undefined, routineIndex: MumpsRoutineIndex, reference: MumpsReference, cursorCharacter: number, ordinal: number): void {
  const inside = referenceContainsPosition(reference, cursorCharacter);
  output?.appendLine(`[navigation-debug] #${ordinal}: ${reference.raw}`);
  output?.appendLine(`  label: ${reference.label ?? '(none)'}`);
  output?.appendLine(`  routine: ${reference.routine ?? '(local)'}`);
  output?.appendLine(`  range: ${reference.startCharacter}-${reference.endCharacter}`);
  output?.appendLine(`  label range: ${reference.labelStartCharacter ?? '(none)'}-${reference.labelEndCharacter ?? '(none)'}`);
  output?.appendLine(`  routine range: ${reference.routineStartCharacter ?? '(none)'}-${reference.routineEndCharacter ?? '(none)'}`);
  output?.appendLine(`  cursor inside: ${inside ? 'yes' : 'no'}`);

  if (!reference.routine) {
    output?.appendLine('  target: local label (resolved in current document by DefinitionProvider)');
    return;
  }

  const routine = routineIndex.findRoutine(reference.routine);
  if (!routine) {
    output?.appendLine(`  target routine found: no`);
    output?.appendLine(`  unresolved reason: routine ${reference.routine} is not indexed; run MForge: Rebuild Routine Index or add the folder to mforge.routineSearchPaths.`);
    return;
  }

  output?.appendLine(`  target routine found: yes`);
  output?.appendLine(`  resolved URI: ${routine.uri.toString()}`);
  if (!reference.label) {
    output?.appendLine('  resolved label: routine top (routine-only reference)');
    return;
  }

  const label = routine.labels.find((candidate) => candidate.name.toUpperCase() === reference.label?.toUpperCase());
  if (!label) {
    output?.appendLine(`  resolved label: not found; DefinitionProvider will open routine top.`);
  } else {
    output?.appendLine(`  resolved label line: ${label.line + 1}`);
  }
}
