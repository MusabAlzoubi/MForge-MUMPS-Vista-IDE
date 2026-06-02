"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeMumpsDocument = analyzeMumpsDocument;
exports.analyzeMumpsLine = analyzeMumpsLine;
const vscode = __importStar(require("vscode"));
const mumpsCommands_1 = require("../../parser/mumpsCommands");
const mumpsLineParser_1 = require("../../parser/mumpsLineParser");
function analyzeMumpsDocument(document) {
    const diagnostics = [];
    for (let lineNumber = 0; lineNumber < document.lineCount; lineNumber++) {
        const line = document.lineAt(lineNumber);
        diagnostics.push(...analyzeMumpsLine(line.text, lineNumber));
    }
    return diagnostics;
}
function analyzeMumpsLine(text, lineNumber) {
    const parsed = (0, mumpsLineParser_1.parseMumpsLine)(text, lineNumber);
    const diagnostics = [];
    if (parsed.hasTrailingWhitespace) {
        const start = text.search(/[ \t]+$/u);
        diagnostics.push(createDiagnostic(lineNumber, Math.max(start, 0), text.length, 'Trailing whitespace can be removed safely.', vscode.DiagnosticSeverity.Information, 'mforge.trailingWhitespace'));
    }
    if (parsed.hasUnterminatedString) {
        const span = parsed.strings.find((candidate) => !candidate.closed);
        diagnostics.push(createDiagnostic(lineNumber, span?.start ?? 0, Math.max(span?.end ?? text.length, (span?.start ?? 0) + 1), 'Unterminated string literal.', vscode.DiagnosticSeverity.Warning, 'mforge.unterminatedString'));
    }
    if (parsed.invalidLabel && parsed.invalidLabelStart !== null) {
        diagnostics.push(createDiagnostic(lineNumber, parsed.invalidLabelStart, parsed.invalidLabelStart + parsed.invalidLabel.length, 'Invalid label format at line start. Labels must start with a letter or % and contain only letters and digits.', vscode.DiagnosticSeverity.Warning, 'mforge.invalidLabel'));
    }
    for (const command of parsed.commands) {
        if (!(0, mumpsCommands_1.isKnownMumpsCommand)(command.token)) {
            diagnostics.push(createDiagnostic(lineNumber, command.start, command.end, `Suspicious unknown MUMPS command token '${command.token}'.`, vscode.DiagnosticSeverity.Warning, 'mforge.unknownCommand'));
        }
    }
    if (parsed.parenBalance !== 0) {
        diagnostics.push(createDiagnostic(lineNumber, 0, Math.max(text.length, 1), parsed.parenBalance > 0 ? 'Unbalanced parentheses: missing closing parenthesis.' : 'Unbalanced parentheses: extra closing parenthesis.', vscode.DiagnosticSeverity.Warning, 'mforge.unbalancedParentheses'));
    }
    return diagnostics;
}
function createDiagnostic(lineNumber, startCharacter, endCharacter, message, severity, code) {
    const diagnostic = new vscode.Diagnostic(new vscode.Range(lineNumber, startCharacter, lineNumber, endCharacter), message, severity);
    diagnostic.source = 'MForge';
    diagnostic.code = code;
    return diagnostic;
}
//# sourceMappingURL=diagnostics.js.map