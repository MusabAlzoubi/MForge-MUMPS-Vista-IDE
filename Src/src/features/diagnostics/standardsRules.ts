import * as vscode from 'vscode';
import { parseMumpsLine } from '../../parser/mumpsLineParser';

export type StandardsProfile = 'off' | 'vista' | 'ujo' | 'custom';

export interface StandardsSettings {
  profile: StandardsProfile;
  enforceRoutineHeader: boolean;
  enforceLabelLength: boolean;
  enforceLocalVariableNames: boolean;
  enforceTmpGlobalSubscript: boolean;
  enforcePercentGlobalProtection: boolean;
  namespacePrefixes: string[];
}

export interface StandardsIssue {
  message: string;
  severity: vscode.DiagnosticSeverity;
  range: vscode.Range;
  source: string;
  code: string;
}

const SOURCE = 'MForge Standards';
const LOCAL_VARIABLE_PATTERN = /(^|[^$A-Za-z0-9%])([A-Za-z%][A-Za-z0-9%]*)(?=\s*(?:=|,|\)|$))/g;

export function readStandardsSettings(): StandardsSettings {
  const mforge = vscode.workspace.getConfiguration('mforge');
  const legacy = vscode.workspace.getConfiguration('mumps');
  const get = <T>(key: string, fallback: T): T => {
    const mforgeValue = mforge.get<T>(`standards.${key}`);
    if (mforgeValue !== undefined) return mforgeValue;
    return legacy.get<T>(`standards.${key}`, fallback) ?? fallback;
  };
  const profile = String(get('profile', 'off')).toLowerCase() as StandardsProfile;
  return {
    profile: ['off', 'vista', 'ujo', 'custom'].includes(profile) ? profile : 'off',
    enforceRoutineHeader: get('enforceRoutineHeader', false),
    enforceLabelLength: get('enforceLabelLength', true),
    enforceLocalVariableNames: get('enforceLocalVariableNames', true),
    enforceTmpGlobalSubscript: get('enforceTmpGlobalSubscript', true),
    enforcePercentGlobalProtection: get('enforcePercentGlobalProtection', true),
    namespacePrefixes: get('namespacePrefixes', [])
  };
}

export function analyzeStandards(document: vscode.TextDocument, settings: StandardsSettings = readStandardsSettings()): StandardsIssue[] {
  if (settings.profile === 'off') return [];
  const issues: StandardsIssue[] = [];
  if (settings.enforceRoutineHeader) {
    const issue = checkRoutineHeader(document, settings);
    if (issue) issues.push(issue);
  }
  for (let lineNumber = 0; lineNumber < document.lineCount; lineNumber++) {
    const text = document.lineAt(lineNumber).text;
    const parsed = parseMumpsLine(text, lineNumber);
    if (settings.enforceLabelLength && parsed.label && parsed.label.length > 8 && parsed.labelStart !== null) {
      issues.push(createIssue(lineNumber, parsed.labelStart, parsed.labelStart + parsed.label.length, `Entry point '${parsed.label}' exceeds the VistA label length limit of 8 characters.`, vscode.DiagnosticSeverity.Warning, 'mforge.standards.labelLength'));
    }
    if (settings.enforceLocalVariableNames) {
      issues.push(...checkLocalVariableNames(lineNumber, parsed.code));
    }
    if (settings.enforceTmpGlobalSubscript) {
      issues.push(...checkTmpGlobalSubscript(lineNumber, parsed.code));
    }
    if (settings.enforcePercentGlobalProtection) {
      issues.push(...checkPercentGlobalProtection(lineNumber, parsed.code));
    }
  }
  return issues;
}

function checkRoutineHeader(document: vscode.TextDocument, settings: StandardsSettings): StandardsIssue | undefined {
  for (let lineNumber = 0; lineNumber < document.lineCount; lineNumber++) {
    const text = document.lineAt(lineNumber).text.trim();
    if (!text || text.startsWith(';')) continue;
    const routineName = text.split(/[\s(]/u)[0] ?? '';
    if (!routineName) return undefined;
    if (settings.namespacePrefixes.length > 0 && !settings.namespacePrefixes.some((prefix) => routineName.toUpperCase().startsWith(prefix.toUpperCase()))) {
      return createIssue(lineNumber, 0, routineName.length, `Routine name '${routineName}' does not match allowed namespace prefixes: ${settings.namespacePrefixes.join(', ')}`, vscode.DiagnosticSeverity.Warning, 'mforge.standards.namespacePrefix');
    }
    if (!text.includes(';;')) {
      return createIssue(lineNumber, 0, routineName.length, 'Routine header is missing standard metadata separator (;;).', vscode.DiagnosticSeverity.Information, 'mforge.standards.routineHeader');
    }
    return undefined;
  }
  return undefined;
}

function checkLocalVariableNames(lineNumber: number, code: string): StandardsIssue[] {
  const issues: StandardsIssue[] = [];
  let match: RegExpExecArray | null;
  LOCAL_VARIABLE_PATTERN.lastIndex = 0;
  while ((match = LOCAL_VARIABLE_PATTERN.exec(code)) !== null) {
    const variable = match[2];
    if (!variable || isCommandOrIntrinsic(variable, code, match.index)) continue;
    const start = match.index + (match[1]?.length ?? 0);
    if (variable.length > 16) {
      issues.push(createIssue(lineNumber, start, start + variable.length, `Local variable '${variable}' exceeds the VistA limit of 16 characters.`, vscode.DiagnosticSeverity.Warning, 'mforge.standards.localVariableLength'));
    }
    if (/[a-z]/u.test(variable)) {
      issues.push(createIssue(lineNumber, start, start + variable.length, `Local variable '${variable}' contains lowercase characters; VistA standard expects uppercase local variables.`, vscode.DiagnosticSeverity.Information, 'mforge.standards.localVariableCase'));
    }
  }
  return issues;
}

function isCommandOrIntrinsic(variable: string, code: string, matchIndex: number): boolean {
  const before = code.slice(0, matchIndex + 1).trimEnd();
  return before === '' || before.endsWith('$') || ['D', 'DO', 'G', 'GOTO', 'I', 'IF', 'N', 'NEW', 'Q', 'QUIT', 'S', 'SET', 'W', 'WRITE'].includes(variable.toUpperCase());
}

function checkTmpGlobalSubscript(lineNumber: number, code: string): StandardsIssue[] {
  const issues: StandardsIssue[] = [];
  const globalRegex = /\^TMP\s*\(/giu;
  let match: RegExpExecArray | null;
  while ((match = globalRegex.exec(code)) !== null) {
    const argsStart = globalRegex.lastIndex;
    const argsText = code.slice(argsStart);
    const trimmedArgs = argsText.trimStart();
    const leadingWhitespace = argsText.length - trimmedArgs.length;
    const isJobScoped = /^\$J\b/iu.test(trimmedArgs) || /^"[^"]+"\s*,\s*\$J\b/iu.test(trimmedArgs);
    if (!isJobScoped) {
      issues.push(createIssue(lineNumber, match.index, argsStart + leadingWhitespace, '^TMP usage should be scoped by $J, or by a package namespace followed by $J.', vscode.DiagnosticSeverity.Warning, 'mforge.standards.tmpGlobalSubscript'));
    }
  }
  return issues;
}

function checkPercentGlobalProtection(lineNumber: number, code: string): StandardsIssue[] {
  const match = /\b(R|READ|K|KILL|S|SET|M|MERGE)\b[^;]*\^%[A-Za-z0-9%]*/iu.exec(code);
  if (!match) return [];
  const globalPosition = code.indexOf('^%', match.index);
  return [createIssue(lineNumber, globalPosition, globalPosition + 2, 'VistA standard disallows READ/KILL/SET/MERGE against ^% globals except Kernel exemptions.', vscode.DiagnosticSeverity.Warning, 'mforge.standards.percentGlobalProtection')];
}

function createIssue(lineNumber: number, start: number, end: number, message: string, severity: vscode.DiagnosticSeverity, code: string): StandardsIssue {
  return { message, severity, range: new vscode.Range(lineNumber, start, lineNumber, end), source: SOURCE, code };
}
