import * as vscode from 'vscode';
import { parseMumpsLine } from '../../parser/mumpsLineParser';
import { findMumpsReferencesInLine, referenceContainsPosition } from '../../parser/routineParser';
import { MumpsReference } from '../../parser/types';
import { MumpsRoutineIndex } from './routineIndex';

const IMPORTANT_ROUTINES = ['UJOWXUS', 'XPAR', 'XLFSTR', 'DIE', 'DIQ'];

export function registerNavigationDebugCommands(context: vscode.ExtensionContext, routineIndex: MumpsRoutineIndex, output?: vscode.OutputChannel): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('mforge.debugReferencesInCurrentLine', async () => {
      await debugReferencesInCurrentLine(routineIndex, output);
    }),
    vscode.commands.registerCommand('mforge.rebuildRoutineIndex', async () => {
      await rebuildRoutineIndex(routineIndex, output);
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
  output?.appendLine(`[navigation-debug] Indexed ${routines.length} routine(s), ${routineIndex.getLabelCount()} label(s).`);
  const traceLevel = vscode.workspace.getConfiguration('mforge').get<string>('trace.level', 'off');
  if (traceLevel === 'debug') {
    output?.appendLine(`[navigation-debug] First routines: ${routines.slice(0, 20).map((routine) => routine.name).join(', ') || '(none)'}`);
  }
  for (const name of IMPORTANT_ROUTINES) {
    const routine = routineIndex.findRoutine(name);
    output?.appendLine(`[navigation-debug] ${name}: ${routine ? `FOUND ${routine.uri.toString()} (${routine.labels.length} label(s))` : 'not indexed'}`);
  }
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
    output?.appendLine(`  unresolved reason: routine ${reference.routine} is not indexed; run MForge: Rebuild Routine Index and confirm the routine file is in the workspace.`);
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
