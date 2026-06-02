import * as vscode from 'vscode';
import { COMMAND_DOCS } from '../hover/commandDocs';
import { INTRINSIC_DOCS } from '../hover/intrinsicDocs';
import { SYSTEM_VARIABLE_DOCS } from '../hover/systemVariableDocs';
import { IndexedRoutine } from '../navigation/routineIndex';
import { MumpsLabel } from '../../parser/types';

const COMPLETION_COMMANDS = new Set(['SET', 'NEW', 'DO', 'QUIT', 'FOR', 'IF', 'KILL', 'READ', 'WRITE']);
const COMPLETION_INTRINSICS = new Set(['$P', '$G', '$O', '$D', '$L', '$E', '$F', '$NA']);
const COMPLETION_SYSTEM_VARIABLES = new Set(['$JOB', '$HOROLOG', '$IO', '$TEST']);

export function createCommandCompletionItems(): vscode.CompletionItem[] {
  return COMMAND_DOCS.filter((doc) => COMPLETION_COMMANDS.has(doc.name)).map((doc) => {
    const item = new vscode.CompletionItem(doc.name, vscode.CompletionItemKind.Keyword);
    item.detail = 'MUMPS command';
    item.documentation = doc.description;
    item.insertText = doc.name;
    return item;
  });
}

export function createIntrinsicCompletionItems(): vscode.CompletionItem[] {
  return INTRINSIC_DOCS.filter((doc) => COMPLETION_INTRINSICS.has(doc.token)).map((doc) => {
    const item = new vscode.CompletionItem(doc.token, vscode.CompletionItemKind.Function);
    item.detail = doc.name;
    item.documentation = doc.description;
    item.insertText = doc.token;
    return item;
  });
}

export function createSystemVariableCompletionItems(): vscode.CompletionItem[] {
  return SYSTEM_VARIABLE_DOCS.filter((doc) => COMPLETION_SYSTEM_VARIABLES.has(doc.token)).map((doc) => {
    const item = new vscode.CompletionItem(doc.token, vscode.CompletionItemKind.Variable);
    item.detail = 'MUMPS system variable';
    item.documentation = doc.description;
    item.insertText = doc.token;
    return item;
  });
}

export function createLabelCompletionItems(labels: MumpsLabel[]): vscode.CompletionItem[] {
  return labels.map((label) => {
    const item = new vscode.CompletionItem(label.name, vscode.CompletionItemKind.Function);
    item.detail = `Label ${label.signature}`;
    item.documentation = `Local label on line ${label.line + 1}.`;
    item.insertText = label.name;
    return item;
  });
}

export function createRoutineIndexCompletionItems(routines: IndexedRoutine[]): vscode.CompletionItem[] {
  const items: vscode.CompletionItem[] = [];
  for (const routine of routines) {
    const routineItem = new vscode.CompletionItem(routine.name, vscode.CompletionItemKind.Module);
    routineItem.detail = 'MUMPS routine';
    routineItem.documentation = routine.filePath;
    routineItem.insertText = routine.name;
    items.push(routineItem);

    for (const label of routine.labels) {
      const labelItem = new vscode.CompletionItem(`${label.name}^${routine.name}`, vscode.CompletionItemKind.Function);
      labelItem.detail = `Workspace label ${label.signature}`;
      labelItem.documentation = `${label.signature} in ${routine.name}.`;
      labelItem.insertText = `${label.name}^${routine.name}`;
      items.push(labelItem);
    }
  }
  return items;
}

export function createMumpsCompletionItems(labels: MumpsLabel[], routines: IndexedRoutine[]): vscode.CompletionItem[] {
  return [
    ...createCommandCompletionItems(),
    ...createIntrinsicCompletionItems(),
    ...createSystemVariableCompletionItems(),
    ...createLabelCompletionItems(labels),
    ...createRoutineIndexCompletionItems(routines)
  ];
}
