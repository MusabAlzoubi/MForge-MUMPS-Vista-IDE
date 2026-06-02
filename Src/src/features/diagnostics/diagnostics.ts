import * as vscode from 'vscode';
import { isKnownMumpsCommand } from '../../parser/mumpsCommands';
import { parseMumpsLine } from '../../parser/mumpsLineParser';

export function analyzeMumpsDocument(document: vscode.TextDocument): vscode.Diagnostic[] {
  const diagnostics: vscode.Diagnostic[] = [];

  for (let lineNumber = 0; lineNumber < document.lineCount; lineNumber++) {
    const line = document.lineAt(lineNumber);
    diagnostics.push(...analyzeMumpsLine(line.text, lineNumber));
  }

  return diagnostics;
}

export function analyzeMumpsLine(text: string, lineNumber: number): vscode.Diagnostic[] {
  const parsed = parseMumpsLine(text, lineNumber);
  const diagnostics: vscode.Diagnostic[] = [];

  if (parsed.hasTrailingWhitespace) {
    const start = text.search(/[ \t]+$/u);
    diagnostics.push(createDiagnostic(
      lineNumber,
      Math.max(start, 0),
      text.length,
      'Trailing whitespace can be removed safely.',
      vscode.DiagnosticSeverity.Information,
      'mforge.trailingWhitespace'
    ));
  }

  if (parsed.hasUnterminatedString) {
    const span = parsed.strings.find((candidate) => !candidate.closed);
    diagnostics.push(createDiagnostic(
      lineNumber,
      span?.start ?? 0,
      Math.max(span?.end ?? text.length, (span?.start ?? 0) + 1),
      'Unterminated string literal.',
      vscode.DiagnosticSeverity.Warning,
      'mforge.unterminatedString'
    ));
  }

  if (parsed.invalidLabel && parsed.invalidLabelStart !== null) {
    diagnostics.push(createDiagnostic(
      lineNumber,
      parsed.invalidLabelStart,
      parsed.invalidLabelStart + parsed.invalidLabel.length,
      'Invalid label format at line start. Labels must start with a letter or % and contain only letters and digits.',
      vscode.DiagnosticSeverity.Warning,
      'mforge.invalidLabel'
    ));
  }

  for (const command of parsed.commands) {
    if (!isKnownMumpsCommand(command.token)) {
      diagnostics.push(createDiagnostic(
        lineNumber,
        command.start,
        command.end,
        `Suspicious unknown MUMPS command token '${command.token}'.`,
        vscode.DiagnosticSeverity.Warning,
        'mforge.unknownCommand'
      ));
    }
  }

  if (parsed.parenBalance !== 0) {
    diagnostics.push(createDiagnostic(
      lineNumber,
      0,
      Math.max(text.length, 1),
      parsed.parenBalance > 0 ? 'Unbalanced parentheses: missing closing parenthesis.' : 'Unbalanced parentheses: extra closing parenthesis.',
      vscode.DiagnosticSeverity.Warning,
      'mforge.unbalancedParentheses'
    ));
  }

  return diagnostics;
}

function createDiagnostic(
  lineNumber: number,
  startCharacter: number,
  endCharacter: number,
  message: string,
  severity: vscode.DiagnosticSeverity,
  code: string
): vscode.Diagnostic {
  const diagnostic = new vscode.Diagnostic(
    new vscode.Range(lineNumber, startCharacter, lineNumber, endCharacter),
    message,
    severity
  );
  diagnostic.source = 'MForge';
  diagnostic.code = code;
  return diagnostic;
}
