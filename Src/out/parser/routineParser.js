"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseMumpsRoutine = parseMumpsRoutine;
exports.parseRoutineLabelFromText = parseRoutineLabelFromText;
exports.parseRoutineLabelFromLine = parseRoutineLabelFromLine;
exports.findMumpsReferenceAt = findMumpsReferenceAt;
exports.findMumpsReferencesInLine = findMumpsReferencesInLine;
const mumpsLineParser_1 = require("./mumpsLineParser");
const LABEL_WITH_PARAMS_PATTERN = /^((?:%?[A-Za-z][A-Za-z0-9]*))(?:\(([^;\s]*)\))?/;
const ROUTINE_NAME_PATTERN = /^%?[A-Za-z][A-Za-z0-9]*$/;
const REFERENCE_NAME_PATTERN = /%?[A-Za-z][A-Za-z0-9]*/y;
function parseMumpsRoutine(text, routineName) {
    const lines = (0, mumpsLineParser_1.parseMumpsDocument)(text);
    const labels = [];
    for (const line of lines) {
        const label = parseRoutineLabelFromLine(line);
        if (label) {
            labels.push(label);
        }
    }
    return { routineName, labels, lines };
}
function parseRoutineLabelFromText(text, lineNumber = 0) {
    return parseRoutineLabelFromLine((0, mumpsLineParser_1.parseMumpsLine)(text, lineNumber));
}
function parseRoutineLabelFromLine(line) {
    if (!line.label || line.labelStart === null || line.labelEnd === null) {
        return null;
    }
    const match = LABEL_WITH_PARAMS_PATTERN.exec(line.code);
    if (!match || !match[1]) {
        return null;
    }
    const parametersText = match[2] ?? null;
    const parameters = parametersText === null || parametersText.length === 0
        ? []
        : parametersText.split(',').map((parameter) => parameter.trim()).filter((parameter) => parameter.length > 0);
    const signature = match[0];
    const lineNumber = line.lineNumber ?? 0;
    return {
        name: match[1],
        parameters,
        signature,
        line: lineNumber,
        startCharacter: line.labelStart,
        endCharacter: line.labelStart + signature.length,
        nameStartCharacter: line.labelStart,
        nameEndCharacter: line.labelEnd
    };
}
function findMumpsReferenceAt(lineText, character) {
    const parsed = (0, mumpsLineParser_1.parseMumpsLine)(lineText);
    const codeLimit = parsed.commentStart ?? lineText.length;
    if (character > codeLimit) {
        return null;
    }
    const references = findMumpsReferencesInLine(lineText);
    return references.find((reference) => character >= reference.startCharacter && character <= reference.endCharacter) ?? null;
}
function findMumpsReferencesInLine(lineText) {
    const parsed = (0, mumpsLineParser_1.parseMumpsLine)(lineText);
    const references = [];
    const code = parsed.code;
    for (let index = 0; index < code.length; index++) {
        if (isInsideString(index, parsed)) {
            continue;
        }
        const char = code[index];
        if (char === '^') {
            const routine = readReferenceName(code, index + 1);
            if (!routine || !isRoutineName(routine.text)) {
                continue;
            }
            const label = readLabelBeforeRoutine(code, index);
            references.push({
                label: label?.text ?? null,
                routine: routine.text,
                startCharacter: label?.start ?? index,
                endCharacter: routine.end,
                routineStartCharacter: routine.start,
                routineEndCharacter: routine.end,
                labelStartCharacter: label?.start ?? null,
                labelEndCharacter: label?.end ?? null,
                raw: code.slice(label?.start ?? index, routine.end)
            });
            continue;
        }
        if (isDoOrGotoCommandAt(code, index, parsed)) {
            const operandStart = skipSpaces(code, index + readCommandLength(code, index));
            collectLocalCommandReferences(code, operandStart, references, parsed);
            index = operandStart;
            continue;
        }
        if (code.startsWith('$$', index)) {
            const label = readReferenceName(code, index + 2);
            if (label) {
                const routineStart = code[label.end] === '^' ? label.end + 1 : null;
                const routine = routineStart === null ? null : readReferenceName(code, routineStart);
                references.push({
                    label: label.text,
                    routine: routine?.text ?? null,
                    startCharacter: index,
                    endCharacter: routine?.end ?? label.end,
                    labelStartCharacter: label.start,
                    labelEndCharacter: label.end,
                    routineStartCharacter: routine?.start ?? null,
                    routineEndCharacter: routine?.end ?? null,
                    raw: code.slice(index, routine?.end ?? label.end)
                });
                index = routine?.end ?? label.end;
            }
        }
    }
    return references;
}
function collectLocalCommandReferences(code, start, references, parsed) {
    let index = start;
    while (index < code.length) {
        if (isInsideString(index, parsed)) {
            index++;
            continue;
        }
        const char = code[index];
        if (char === ' ' && code[index + 1] === ' ') {
            break;
        }
        if (char === ',' || char === ':' || char === ' ' || char === '\t') {
            index++;
            continue;
        }
        if (char === '@') {
            index++;
            continue;
        }
        const label = readReferenceName(code, index);
        if (!label) {
            index++;
            continue;
        }
        const afterLabel = skipCallArguments(code, label.end);
        const routineStart = code[afterLabel] === '^' ? afterLabel + 1 : null;
        const routine = routineStart === null ? null : readReferenceName(code, routineStart);
        references.push({
            label: label.text,
            routine: routine?.text ?? null,
            startCharacter: label.start,
            endCharacter: routine?.end ?? label.end,
            labelStartCharacter: label.start,
            labelEndCharacter: label.end,
            routineStartCharacter: routine?.start ?? null,
            routineEndCharacter: routine?.end ?? null,
            raw: code.slice(label.start, routine?.end ?? label.end)
        });
        index = routine?.end ?? afterLabel;
    }
}
function readLabelBeforeRoutine(code, caretIndex) {
    let end = caretIndex;
    while (end > 0 && /\s/.test(code[end - 1] ?? '')) {
        end--;
    }
    if (end > 0 && code[end - 1] === ')') {
        end = findMatchingOpenParenBackward(code, end - 1) ?? end;
    }
    let start = end;
    while (start > 0 && /[A-Za-z0-9%]/.test(code[start - 1] ?? '')) {
        start--;
    }
    if (start === end) {
        return null;
    }
    const text = code.slice(start, end);
    return isRoutineName(text) ? { text, start, end } : null;
}
function readReferenceName(code, start) {
    REFERENCE_NAME_PATTERN.lastIndex = start;
    const match = REFERENCE_NAME_PATTERN.exec(code);
    if (!match || match.index !== start) {
        return null;
    }
    return { text: match[0], start, end: start + match[0].length };
}
function isRoutineName(name) {
    return ROUTINE_NAME_PATTERN.test(name);
}
function isDoOrGotoCommandAt(code, index, parsed) {
    const command = parsed.commands.find((candidate) => candidate.start === index);
    return command?.normalized === 'DO' || command?.normalized === 'GOTO';
}
function readCommandLength(code, index) {
    const command = readReferenceName(code, index);
    return command?.text.length ?? 0;
}
function skipSpaces(code, start) {
    let index = start;
    while (code[index] === ' ' || code[index] === '\t') {
        index++;
    }
    return index;
}
function skipCallArguments(code, start) {
    if (code[start] !== '(') {
        return start;
    }
    let depth = 0;
    let inString = false;
    for (let index = start; index < code.length; index++) {
        const char = code[index];
        if (char === '"') {
            if (inString && code[index + 1] === '"') {
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
        }
        else if (char === ')') {
            depth--;
            if (depth === 0) {
                return index + 1;
            }
        }
    }
    return start;
}
function findMatchingOpenParenBackward(code, closeIndex) {
    let depth = 0;
    for (let index = closeIndex; index >= 0; index--) {
        if (code[index] === ')') {
            depth++;
        }
        else if (code[index] === '(') {
            depth--;
            if (depth === 0) {
                return index;
            }
        }
    }
    return null;
}
function isInsideString(index, parsed) {
    return parsed.strings.some((span) => index >= span.start && index < span.end);
}
//# sourceMappingURL=routineParser.js.map