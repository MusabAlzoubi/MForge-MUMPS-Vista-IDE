import * as vscode from 'vscode';
import { getSignatureDoc, MumpsSignatureDoc } from './signatures';

const SIGNATURE_START_PATTERN = /\$[A-Za-z][A-Za-z0-9]*\(/g;

export interface MumpsSignatureContext {
  doc: MumpsSignatureDoc;
  activeParameter: number;
}

export function resolveMumpsSignature(linePrefix: string): MumpsSignatureContext | null {
  const starts: Array<{ token: string; openParen: number }> = [];
  let match: RegExpExecArray | null;
  SIGNATURE_START_PATTERN.lastIndex = 0;
  while ((match = SIGNATURE_START_PATTERN.exec(linePrefix)) !== null) {
    const token = match[0].slice(0, -1);
    if (getSignatureDoc(token)) {
      starts.push({ token, openParen: match.index + token.length });
    }
  }

  for (let index = starts.length - 1; index >= 0; index--) {
    const start = starts[index];
    if (!start) {
      continue;
    }
    const text = linePrefix.slice(start.openParen + 1);
    const balance = getParenBalance(text);
    if (balance < 0) {
      continue;
    }
    const doc = getSignatureDoc(start.token);
    if (!doc) {
      continue;
    }
    const activeParameter = Math.min(countTopLevelCommas(text), doc.parameters.length - 1);
    return { doc, activeParameter };
  }

  return null;
}

export class MumpsSignatureProvider implements vscode.SignatureHelpProvider {
  provideSignatureHelp(document: vscode.TextDocument, position: vscode.Position): vscode.SignatureHelp | null {
    const linePrefix = document.lineAt(position.line).text.slice(0, position.character);
    const resolved = resolveMumpsSignature(linePrefix);
    if (!resolved) {
      return null;
    }

    const signature = new vscode.SignatureInformation(resolved.doc.label, resolved.doc.documentation);
    signature.parameters = resolved.doc.parameters.map((parameter) => new vscode.ParameterInformation(parameter.label, parameter.documentation));

    const help = new vscode.SignatureHelp();
    help.signatures = [signature];
    help.activeSignature = 0;
    help.activeParameter = resolved.activeParameter;
    return help;
  }
}

function countTopLevelCommas(text: string): number {
  let count = 0;
  let depth = 0;
  let inString = false;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (char === '"') {
      if (inString && text[index + 1] === '"') {
        index++;
        continue;
      }
      inString = !inString;
      continue;
    }
    if (inString) {
      continue;
    }
    if (char === '(') {
      depth++;
    } else if (char === ')') {
      if (depth === 0) {
        break;
      }
      depth--;
    } else if (char === ',' && depth === 0) {
      count++;
    }
  }
  return count;
}

function getParenBalance(text: string): number {
  let depth = 0;
  let inString = false;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (char === '"') {
      if (inString && text[index + 1] === '"') {
        index++;
        continue;
      }
      inString = !inString;
      continue;
    }
    if (inString) {
      continue;
    }
    if (char === '(') {
      depth++;
    } else if (char === ')') {
      depth--;
    }
  }
  return depth;
}
