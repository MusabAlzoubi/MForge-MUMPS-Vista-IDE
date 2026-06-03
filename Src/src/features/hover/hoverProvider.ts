import * as vscode from 'vscode';
import { getCommandDoc } from './commandDocs';
import { getIntrinsicDoc } from './intrinsicDocs';
import { getSystemVariableDoc } from './systemVariableDocs';

const TOKEN_PATTERN = /\$[A-Za-z][A-Za-z0-9]*|%?[A-Za-z][A-Za-z0-9]*/g;

export function getMumpsHoverMarkdown(token: string): string | null {
  const normalized = token.toUpperCase();
  const command = getCommandDoc(normalized);
  if (command) {
    return [`### MUMPS Command`, '', `**${command.name}**`, '', command.description, '', `Syntax: \`${command.syntax}\``, '', 'Example:', `\`${command.example}\``].join('\n');
  }

  const intrinsic = getIntrinsicDoc(normalized);
  if (intrinsic) {
    return [`### MUMPS Intrinsic`, '', `**${intrinsic.name}**`, '', intrinsic.description, '', `Syntax: \`${intrinsic.syntax}\``, '', 'Example:', `\`${intrinsic.example}\``].join('\n');
  }

  const systemVariable = getSystemVariableDoc(normalized);
  if (systemVariable) {
    return [`### MUMPS System Variable`, '', `**${systemVariable.token}**`, '', systemVariable.description, '', 'Example:', `\`${systemVariable.example}\``].join('\n');
  }

  return null;
}

export function getTokenAtPosition(lineText: string, character: number): { token: string; start: number; end: number } | null {
  let match: RegExpExecArray | null;
  TOKEN_PATTERN.lastIndex = 0;
  while ((match = TOKEN_PATTERN.exec(lineText)) !== null) {
    const start = match.index;
    const end = start + match[0].length;
    if (character >= start && character <= end) {
      return { token: match[0], start, end };
    }
  }
  return null;
}

export class MumpsHoverProvider implements vscode.HoverProvider {
  provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.Hover | null {
    const lineText = document.lineAt(position.line).text;
    const token = getTokenAtPosition(lineText, position.character);
    if (!token) {
      return null;
    }

    const markdown = getMumpsHoverMarkdown(token.token);
    if (!markdown) {
      return null;
    }

    return new vscode.Hover(new vscode.MarkdownString(markdown), new vscode.Range(position.line, token.start, position.line, token.end));
  }
}
