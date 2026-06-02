"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatMumpsDocumentText = formatMumpsDocumentText;
exports.formatMumpsLine = formatMumpsLine;
exports.suggestIndentationForNewLine = suggestIndentationForNewLine;
const mumpsLineParser_1 = require("../../parser/mumpsLineParser");
function formatMumpsDocumentText(text) {
    const newline = text.includes('\r\n') ? '\r\n' : '\n';
    const hasFinalNewline = /\r?\n$/.test(text);
    const lines = text.split(/\r?\n/);
    if (hasFinalNewline) {
        lines.pop();
    }
    const formatted = lines.map((line) => formatMumpsLine(line)).join(newline);
    return hasFinalNewline ? `${formatted}${newline}` : formatted;
}
function formatMumpsLine(line) {
    const withoutTrailingWhitespace = line.replace(/[ \t]+$/u, '');
    if (withoutTrailingWhitespace.trim() === '') {
        return '';
    }
    const parsed = (0, mumpsLineParser_1.parseMumpsLine)(withoutTrailingWhitespace);
    const comment = parsed.comment ?? '';
    const code = parsed.code;
    if (code.trim() === '') {
        return comment;
    }
    const formattedCode = normalizeCodeSpacing(code, parsed.commandTextStart);
    if (comment && formattedCode !== '' && !/\s$/u.test(formattedCode)) {
        return `${formattedCode} ${comment}`;
    }
    return `${formattedCode}${comment}`;
}
function normalizeCodeSpacing(code, commandTextStart) {
    if (commandTextStart >= code.length) {
        return code;
    }
    const prefix = code.slice(0, commandTextStart);
    const commandText = code.slice(commandTextStart);
    const normalizedCommandText = normalizeSafeCommandSpacing(commandText);
    return `${prefix}${normalizedCommandText}`.replace(/[ \t]+$/u, '');
}
function normalizeSafeCommandSpacing(commandText) {
    let result = '';
    let inString = false;
    let pendingWhitespace = '';
    for (let index = 0; index < commandText.length; index++) {
        const char = commandText[index] ?? '';
        if (char === '"') {
            if (pendingWhitespace) {
                result += pendingWhitespace.includes('\t') ? ' ' : pendingWhitespace;
                pendingWhitespace = '';
            }
            result += char;
            if (inString && commandText[index + 1] === '"') {
                result += commandText[index + 1];
                index++;
                continue;
            }
            inString = !inString;
            continue;
        }
        if (inString) {
            if (pendingWhitespace) {
                result += pendingWhitespace;
                pendingWhitespace = '';
            }
            result += char;
            continue;
        }
        if (char === ' ' || char === '\t') {
            pendingWhitespace += char;
            continue;
        }
        if (pendingWhitespace) {
            result += normalizeWhitespaceBefore(char, result, pendingWhitespace);
            pendingWhitespace = '';
        }
        result += char;
    }
    return result.replace(/[ \t]+$/u, '');
}
function normalizeWhitespaceBefore(nextChar, currentResult, whitespace) {
    if (currentResult === '') {
        return '';
    }
    if (currentResult.endsWith('.')) {
        return ' ';
    }
    if (nextChar === ':') {
        return '';
    }
    if (whitespace.length > 1 && looksLikeCommandBoundary(currentResult)) {
        return '  ';
    }
    return ' ';
}
function looksLikeCommandBoundary(currentResult) {
    return /(?:^|\s|\.)[A-Za-z][A-Za-z0-9]*:?$/u.test(currentResult);
}
function suggestIndentationForNewLine(previousLine) {
    const parsed = (0, mumpsLineParser_1.parseMumpsLine)(previousLine.replace(/[ \t]+$/u, ''));
    const trimmedCode = parsed.code.trimEnd();
    if (trimmedCode === '') {
        return '';
    }
    const commandTailOpensDotBlock = /(?:^|\s)(?:D|DO|F|FOR)\s*$/iu.test(trimmedCode);
    const nextDotLevel = parsed.dotBlockLevel + (commandTailOpensDotBlock ? 1 : 0);
    if (nextDotLevel <= 0) {
        return parsed.label ? ' ' : previousLine.match(/^\s*/u)?.[0] ?? '';
    }
    return ` ${Array.from({ length: nextDotLevel }, () => '.').join(' ')} `;
}
//# sourceMappingURL=formatter.js.map